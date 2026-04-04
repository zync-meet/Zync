const express = require('express');
const router = express.Router();
const verifyGithub = require('../middleware/verifyGithub');
const { analyzeCommit } = require('../utils/commitAnalysisService');
const ProjectTask = require('../models/ProjectTask');
const Project = require('../models/Project');
const Step = require('../models/Step');
const Session = require('../models/Session');
const { normalizeDoc } = require('../utils/normalize');
const { getProjectWithSteps } = require('../utils/projectHelper');

const normalizeTaskStatus = (value) => String(value || '').trim().toLowerCase();

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
        const fromStatus = matchedTask.status;
        const updateData = {
          commitMessage: message,
          commitUrl: commit.url,
          commitAuthor: sender?.login || commit.author?.name || 'Unknown',
          commitTimestamp: commit.timestamp || new Date().toISOString(),
        };
        if (normalizeTaskStatus(fromStatus) === 'active') {
          updateData.status = 'In Progress';
        } else if (analysis.action === 'Complete') {
          updateData.status = 'Done';
        } else if (analysis.action === 'In Progress') {
          updateData.status = 'In Progress';
        }

        await ProjectTask.updateOne({ _id: matchedTask._id }, { $set: updateData });

        // Emit socket event
        const step = await Step.findById(matchedTask.stepId).lean();
        if (step) {
          const project = await Project.findById(step.projectId).lean();
          if (updateData.status && updateData.status !== fromStatus) {
            await logTaskProgressActivity({
              recipients: [project?.ownerUid, ...(project?.team || []), matchedTask.assignedTo],
              taskTitle: matchedTask.title,
              projectName: project?.name,
              actorName: sender?.login || commit.author?.name || 'GitHub',
              projectId: step.projectId,
              taskId: matchedTask._id,
              fromStatus,
              toStatus: updateData.status,
            });
          }

          const projectData = await getProjectWithSteps(step.projectId);
          const io = req.app.get('io');
          if (io) {
            io.emit('taskUpdated', { task: normalizeDoc({ ...matchedTask, ...updateData }), projectId: step.projectId.toString() });
            io.emit('projectUpdate', { projectId: projectData.id, project: projectData });
          }
        }

        results.push({ commit: commit.id, displayId, status: 'updated', action: analysis.action });
        continue;
      }

      // Update task found by displayId
      const fromStatus = task.status;
      const updateData = {
        commitMessage: message,
        commitUrl: commit.url,
        commitAuthor: sender?.login || commit.author?.name || 'Unknown',
        commitTimestamp: commit.timestamp || new Date().toISOString(),
      };
      if (normalizeTaskStatus(fromStatus) === 'active') {
        updateData.status = 'In Progress';
      } else if (analysis.action === 'Complete') {
        updateData.status = 'Done';
      } else if (analysis.action === 'In Progress') {
        updateData.status = 'In Progress';
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
          io.emit('taskUpdated', { task: normalizeDoc({ ...task, ...updateData }), projectId: step.projectId.toString() });
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
