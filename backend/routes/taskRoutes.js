const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const User = require('../models/User');
const Team = require('../models/Team');
const Project = require('../models/Project');
const Step = require('../models/Step');
const ProjectTask = require('../models/ProjectTask');
const { normalizeDocs } = require('../utils/normalize');

const buildOctokitForInstallation = async (installationId) => {
  const appId = process.env.GITHUB_APP_ID;
  let privateKey = process.env.GITHUB_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error('Server configuration error: Missing GitHub credentials');
  }

  privateKey = privateKey.replace(/\\n/g, '\n');

  const { App } = await import('octokit');
  const app = new App({ appId, privateKey });
  return app.getInstallationOctokit(Number.parseInt(installationId, 10));
};

const getRepoCollaboratorLogins = async (octokit, owner, repo) => {
  const response = await octokit.request('GET /repos/{owner}/{repo}/collaborators', {
    owner,
    repo,
    per_page: 100,
    affiliation: 'all',
  });

  return new Set((response.data || []).map((collab) => String(collab.login || '').toLowerCase()));
};

const generateUniqueCommitCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    code = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const found = await ProjectTask.findOne({ commitCode: code }).select('_id').lean();
    exists = !!found;
  }

  return code;
};

router.post('/assign', verifyToken, async (req, res) => {
  try {
    const { projectId, taskName, description, assignedUserId, assignedUserIds } = req.body || {};
    const requesterUid = req.user?.uid;

    if (!projectId || !taskName?.trim()) {
      return res.status(400).json({ message: 'projectId and taskName are required' });
    }

    const normalizedArray = Array.isArray(assignedUserIds)
      ? [...new Set(assignedUserIds.filter(Boolean))]
      : [];

    const resolvedAssigneeId = assignedUserId || normalizedArray[0] || null;

    if (!resolvedAssigneeId) {
      return res.status(400).json({ message: 'assignedUserId is required' });
    }

    if (normalizedArray.length > 1) {
      return res.status(400).json({ message: 'Only one assignee is allowed' });
    }

    if (resolvedAssigneeId === requesterUid) {
      return res.status(400).json({ message: 'You cannot assign a task to yourself' });
    }

    const project = await Project.findById(projectId).lean();
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.ownerUid !== requesterUid) {
      return res.status(403).json({ message: 'Only the repository owner can assign tasks' });
    }

    if (!project.githubRepoOwner || !project.githubRepoName) {
      return res.status(400).json({ message: 'Project is not linked to a GitHub repository' });
    }

    const requester = await User.findOne({ uid: requesterUid }).lean();
    if (!requester?.githubIntegration?.installationId) {
      return res.status(400).json({ message: 'GitHub App installation is missing for this account' });
    }

    const normalizedAssigneeIds = [resolvedAssigneeId];

    const teams = await Team.find({ members: requesterUid }).select('members').lean();
    const sameTeamUids = new Set(teams.flatMap((team) => team.members || []));

    const assignees = await User.find({ uid: { $in: normalizedAssigneeIds } })
      .select('uid displayName email githubIntegration.username')
      .lean();

    const assigneeMap = new Map(assignees.map((assignee) => [assignee.uid, assignee]));

    const hasInvalidAssignee = normalizedAssigneeIds.some((uid) => {
      const assignee = assigneeMap.get(uid);
      return !assignee || !sameTeamUids.has(uid) || !assignee?.githubIntegration?.username;
    });

    if (hasInvalidAssignee) {
      return res.status(400).json({
        message: 'This user is not connected to ZYNC GitHub or is not in your team.'
      });
    }

    let step = await Step.findOne({ projectId: project._id })
      .sort({ order: 1 })
      .lean();

    if (!step) {
      const createdStep = await Step.create({
        title: 'Backlog',
        description: 'Auto-generated backlog step',
        type: 'Other',
        order: 0,
        projectId: project._id,
      });
      step = createdStep.toObject();
    }

    const octokit = await buildOctokitForInstallation(requester.githubIntegration.installationId);
    const collaboratorLogins = await getRepoCollaboratorLogins(octokit, project.githubRepoOwner, project.githubRepoName);

    const assigneesNotCollaborators = normalizedAssigneeIds.filter((uid) => {
      const assignee = assigneeMap.get(uid);
      const githubUsername = String(assignee?.githubIntegration?.username || '').toLowerCase();
      return !collaboratorLogins.has(githubUsername);
    });

    if (assigneesNotCollaborators.length > 0) {
      return res.status(400).json({ message: 'Selected assignee is not a collaborator on this repository.' });
    }

    const createdTasksPayload = [];
    for (const uid of normalizedAssigneeIds) {
      const assignee = assigneeMap.get(uid);
      const commitCode = await generateUniqueCommitCode();

      createdTasksPayload.push({
        title: taskName.trim(),
        description: description?.trim() || null,
        status: 'Pending',
        assignedTo: uid,
        assignedUserIds: normalizedAssigneeIds,
        assignedToName: assignee?.displayName || assignee?.email || uid,
        assignedBy: requesterUid,
        createdBy: requesterUid,
        commitCode,
        stepId: step._id,
      });
    }

    const createdTasks = await ProjectTask.insertMany(createdTasksPayload);

    return res.status(200).json({
      message: 'Task created successfully.',
      commitCodes: createdTasks.map((task) => task.commitCode),
      tasks: normalizeDocs(createdTasks.map((task) => task.toObject())),
    });
  } catch (error) {
    console.error('Error assigning task:', error);
    return res.status(500).json({ message: 'Failed to assign task', error: error.message });
  }
});

module.exports = router;
