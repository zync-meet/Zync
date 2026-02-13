const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const verifyToken = require('../middleware/authMiddleware');

// Link a generic repo to a Project
router.post('/link-repo', verifyToken, async (req, res) => {
  const { projectId, githubRepoId } = req.body;

  if (!projectId || !githubRepoId) {
    return res.status(400).json({ message: 'Missing projectId or githubRepoId' });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Add to array if not already present
    const currentIds = project.githubRepoIds || [];
    if (!currentIds.includes(githubRepoId)) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          githubRepoIds: { push: githubRepoId }
        }
      });
    }

    // Update all ProjectTasks associated with this project's steps
    const steps = await prisma.step.findMany({
      where: { projectId },
      select: { id: true }
    });
    const stepIds = steps.map(s => s.id);

    if (stepIds.length > 0) {
      await prisma.projectTask.updateMany({
        where: { stepId: { in: stepIds } },
        data: {
          repoIds: { push: githubRepoId }
        }
      });
    }

    const updatedProject = await prisma.project.findUnique({
      where: { id: projectId }
    });

    res.json({ message: 'Repository linked successfully', project: updatedProject });

  } catch (error) {
    console.error('Link Repo Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
