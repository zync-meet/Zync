const express = require('express');
const router = express.Router();
const verifyGithub = require('../middleware/verifyGithub');
const { analyzeCommit } = require('../utils/commitAnalysisService');
const ProjectTask = require('../models/ProjectTask');
const Project = require('../models/Project');
const Step = require('../models/Step');
const { normalizeDoc } = require('../utils/normalize');
const { getProjectWithSteps } = require('../utils/projectHelper');

// POST /api/webhooks/github — GitHub push webhook
router.post('/github', verifyGithub, async (req, res) => {
  try {
    const event = req.headers['x-github-event'];

    if (event !== 'push') {
      return res.status(200).json({ message: `Ignoring event: ${event}` });
    }

    const { commits, repository, sender } = req.body;

    if (!commits || commits.length === 0) {
      return res.status(200).json({ message: 'No commits to process' });
    }

    const results = [];

    for (const commit of commits) {
      const message = commit.message;
      const analysis = await analyzeCommit(message);

      if (!analysis.found || !analysis.id) {
        results.push({ commit: commit.id, status: 'no_task_found' });
        continue;
      }

      const displayId = analysis.id;

      // Find task by displayId
      const task = await ProjectTask.findOne({ displayId }).lean();
      if (!task) {
        // Try case-insensitive search
        const tasks = await ProjectTask.find({}).lean();
        const matchedTask = tasks.find(t =>
          t.displayId && t.displayId.toUpperCase() === displayId.toUpperCase()
        );

        if (!matchedTask) {
          results.push({ commit: commit.id, displayId, status: 'task_not_found' });
          continue;
        }

        // Update matched task
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

        await ProjectTask.updateOne({ _id: matchedTask._id }, { $set: updateData });

        // Emit socket event
        const step = await Step.findById(matchedTask.stepId).lean();
        if (step) {
          const projectData = await getProjectWithSteps(step.projectId);
          const io = req.app.get('io');
          if (io) {
            io.emit('taskUpdated', { task: normalizeDoc(matchedTask), projectId: step.projectId.toString() });
            io.emit('projectUpdate', { projectId: projectData.id, project: projectData });
          }
        }

        results.push({ commit: commit.id, displayId, status: 'updated', action: analysis.action });
        continue;
      }

      // Update task found by displayId
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
          io.emit('taskUpdated', { task: normalizeDoc(task), projectId: step.projectId.toString() });
          io.emit('projectUpdate', { projectId: projectData.id, project: projectData });
        }
      }

      results.push({ commit: commit.id, displayId, status: 'updated', action: analysis.action });
    }

    res.json({ message: 'Webhook processed', results });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing failed', error: error.message });
  }
});

module.exports = router;
