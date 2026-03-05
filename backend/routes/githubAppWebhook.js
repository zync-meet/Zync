const express = require('express');
const router = express.Router();
const verifyGithub = require('../middleware/verifyGithub');
const { analyzeCommit } = require('../utils/commitAnalysisService');
const ProjectTask = require('../models/ProjectTask');
const Project = require('../models/Project');
const Step = require('../models/Step');
const User = require('../models/User');
const Repository = require('../models/Repository');
const { normalizeDoc } = require('../utils/normalize');
const { getProjectWithSteps } = require('../utils/projectHelper');

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

      if (!analysis.found || !analysis.id) {
        results.push({ commit: commit.id?.substring(0, 7), status: 'no_task_found' });
        continue;
      }

      const displayId = analysis.id;

      // Find task by displayId
      let task = await ProjectTask.findOne({ displayId }).lean();

      if (!task) {
        // Try case-insensitive
        const allTasks = await ProjectTask.find({
          displayId: { $regex: `^${displayId.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, $options: 'i' }
        }).lean();
        task = allTasks[0] || null;
      }

      if (!task) {
        results.push({ commit: commit.id?.substring(0, 7), displayId, status: 'task_not_found' });
        continue;
      }

      // Update task with commit info
      const updateData = {
        commitMessage: message,
        commitUrl: commit.url,
        commitAuthor: sender?.login || commit.author?.name || 'Unknown',
        commitTimestamp: commit.timestamp || new Date().toISOString(),
      };

      if (analysis.action === 'Complete') {
        updateData.status = 'Done';
      } else if (analysis.action === 'In Progress') {
        updateData.status = 'In Progress';
      }

      await ProjectTask.updateOne({ _id: task._id }, { $set: updateData });

      // Emit socket event
      const step = await Step.findById(task.stepId).lean();
      if (step) {
        const projectData = await getProjectWithSteps(step.projectId);
        const io = req.app.get('io');
        if (io) {
          io.emit('taskUpdated', {
            task: normalizeDoc({ ...task, ...updateData }),
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
        displayId,
        status: 'updated',
        action: analysis.action,
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
