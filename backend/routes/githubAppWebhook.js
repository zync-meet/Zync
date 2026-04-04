const express = require('express');
const router = express.Router();
const verifyGithub = require('../middleware/verifyGithub');
const { analyzeCommit } = require('../utils/commitAnalysisService');
const ProjectTask = require('../models/ProjectTask');
const Project = require('../models/Project');
const Step = require('../models/Step');
const User = require('../models/User');
const Repository = require('../models/Repository');
const Session = require('../models/Session');
const { normalizeDoc } = require('../utils/normalize');
const { getProjectWithSteps } = require('../utils/projectHelper');

const normalizeTaskStatus = (value) => String(value || '').trim().toLowerCase();
const COMMIT_CODE_REGEX = /\b\d{10}\b/g;

const extractCommitCodes = (message) => {
  const matches = String(message || '').match(COMMIT_CODE_REGEX);
  return [...new Set(matches || [])];
};

const computeStatusFromCommit = ({ fromStatus, hasOwnerGeneratedCommitCode }) => {
  const normalizedFrom = normalizeTaskStatus(fromStatus);

  if (hasOwnerGeneratedCommitCode) {
    return 'Done';
  }

  if (normalizedFrom === 'done' || normalizedFrom.includes('complete')) {
    return null;
  }

  return 'In Progress';
};

async function logTaskProgressActivity({ recipients, taskTitle, projectName, actorName, projectId, taskId, fromStatus, toStatus }) {
  const uniqueRecipients = [...new Set((recipients || []).filter(Boolean))];
  if (uniqueRecipients.length === 0) return;

  const now = new Date();
  await Session.insertMany(
    uniqueRecipients.map((uid) => ({
      userId: uid,
      startTime: now,
      endTime: now,
      duration: 0,
      activeDuration: 0,
      date: now.toISOString().split('T')[0],
      eventType: 'task-progressed',
      title: `Task moved to ${toStatus}: ${taskTitle}`,
      source: projectName || 'Tasks',
      actorName: actorName || 'GitHub',
      metadata: {
        projectId: String(projectId || ''),
        taskId: String(taskId || ''),
        projectName: projectName || null,
        fromStatus: fromStatus || null,
        toStatus: toStatus || null,
        trigger: 'commit',
      },
    }))
  );
}

// POST /api/github-app/webhook — GitHub App webhook handler
router.post('/webhook', verifyGithub, async (req, res) => {
  try {
    const event = req.headers['x-github-event'];
    console.log(`[GitHub App Webhook] Received event: ${event}`);

    // Handle installation events
    if (event === 'installation' || event === 'installation_repositories') {
      console.log(`[GitHub App Webhook] Installation event processed`);
      return res.status(200).json({ message: 'Installation event acknowledged' });
    }

    // Handle push events
    if (event !== 'push') {
      return res.status(200).json({ message: `Event ${event} ignored` });
    }

    const { commits, repository, sender, installation } = req.body;

    if (!commits || commits.length === 0) {
      return res.status(200).json({ message: 'No commits to process' });
    }

    console.log(`[GitHub App Webhook] Processing ${commits.length} commits from ${repository?.full_name}`);

    // Try to find the project this repository is linked to
    const repoFullName = repository?.full_name;
    const repoId = repository?.id?.toString();
    let linkedProject = null;

    if (repoFullName) {
      const [repoOwner, repoName] = repoFullName.split('/');
      linkedProject = await Project.findOne({
        githubRepoOwner: repoOwner,
        githubRepoName: repoName,
      }).lean();
    }

    if (!linkedProject && repoId) {
      linkedProject = await Project.findOne({ githubRepoIds: repoId }).lean();
    }

    const results = [];

    for (const commit of commits) {
      const message = commit.message;
      const analysis = await analyzeCommit(message);
      const commitCodesInMessage = extractCommitCodes(message);

      let task = null;
      let displayId = analysis.id || null;

      if (analysis.found && analysis.id) {
        displayId = analysis.id;
        task = await ProjectTask.findOne({ displayId }).lean();
        if (!task) {
          const taskByDisplayRegex = await ProjectTask.findOne({
            displayId: { $regex: `^${String(displayId).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, $options: 'i' }
          }).lean();
          task = taskByDisplayRegex || null;
        }
      }

      if (!task && commitCodesInMessage.length > 0) {
        task = await ProjectTask.findOne({ commitCode: { $in: commitCodesInMessage } }).lean();
      }

      if (!task) {
        results.push({ commit: commit.id?.substring(0, 7), status: 'no_task_found' });
        continue;
      }

      // Update task with commit info
      const fromStatus = task.status;
      const hasOwnerGeneratedCommitCode = Boolean(task.commitCode && commitCodesInMessage.includes(String(task.commitCode)));
      const updateData = {
        commitMessage: message,
        commitUrl: commit.url,
        commitAuthor: sender?.login || commit.author?.name || 'Unknown',
        commitTimestamp: commit.timestamp || new Date().toISOString(),
      };

      const nextStatus = computeStatusFromCommit({
        fromStatus,
        hasOwnerGeneratedCommitCode,
      });
      if (nextStatus) {
        updateData.status = nextStatus;
      }

      await ProjectTask.updateOne({ _id: task._id }, { $set: updateData });

      // Emit socket event
      const step = await Step.findById(task.stepId).lean();
      if (step) {
        const project = await Project.findById(step.projectId).lean();
        if (updateData.status && updateData.status !== fromStatus) {
          await logTaskProgressActivity({
            recipients: [project?.ownerUid, ...(project?.team || []), task.assignedTo],
            taskTitle: task.title,
            projectName: project?.name,
            actorName: sender?.login || commit.author?.name || 'GitHub',
            projectId: step.projectId,
            taskId: task._id,
            fromStatus,
            toStatus: updateData.status,
          });
        }

        const projectData = await getProjectWithSteps(step.projectId);
        const io = req.app.get('io');
        if (io) {
          const updatedTask = normalizeDoc({ ...task, ...updateData });
          io.emit('taskUpdated', {
            task: updatedTask,
            taskId: String(task._id),
            status: updateData.status || task.status,
            projectId: step.projectId.toString(),
          });
          io.emit('projectUpdate', {
            projectId: projectData.id,
            project: projectData,
          });
        }
      }

      results.push({
        commit: commit.id?.substring(0, 7),
        displayId: task.displayId || displayId || null,
        status: 'updated',
        action: hasOwnerGeneratedCommitCode ? 'Complete' : 'In Progress',
      });
    }

    console.log(`[GitHub App Webhook] Processed ${results.length} commits`);
    res.json({ message: 'Webhook processed', results });
  } catch (error) {
    console.error('[GitHub App Webhook] Error:', error);
    res.status(500).json({ message: 'Webhook processing failed', error: error.message });
  }
});

module.exports = router;
