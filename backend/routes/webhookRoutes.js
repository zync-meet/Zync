const express = require('express');
const router = express.Router();

const Groq = require('groq-sdk');
const prisma = require('../lib/prisma');

const verifyGithub = require('../middleware/verifyGithub');
const { analyzeCommit } = require('../utils/commitAnalysisService');

router.post('/github', verifyGithub, async (req, res) => {
    try {
        const event = req.headers['x-github-event'];
        console.log(`Received GitHub Header Event: ${event}`);

        if (event === 'ping') {
            return res.json({ message: 'Pong' });
        }

        if (event === 'push') {
            const payload = req.body;
            const commits = payload.commits || [];
            console.log(`Processing push event with ${commits.length} commits.`);

            const io = req.app.get('io');

            for (const commit of commits) {
                const message = commit.message;
                let taskId = null;
                let action = null;


                const explicitMatch = message.match(/\[ZYNC-COMPLETE #([a-zA-Z0-9_-]+)\]/i);
                if (explicitMatch) {
                    taskId = explicitMatch[1];
                    action = 'Complete';
                    console.log(`Found Explicit Tag: ${taskId}`);
                } else {

                    const analysis = await analyzeCommit(message);
                    if (analysis.found && analysis.id && analysis.action === 'Complete') {
                        taskId = analysis.id.replace('TASK-', '');
                        action = 'Complete';
                        console.log(`AI identified task: ${taskId}`);
                    }
                }

                if (taskId && action === 'Complete') {

                    const task = await prisma.projectTask.findFirst({
                        where: {
                            OR: [
                                { id: taskId },
                                { displayId: taskId },
                                { displayId: `TASK-${taskId}` }
                            ]
                        },
                        include: { step: { include: { project: true } } }
                    });

                    if (task) {
                        const updatedTask = await prisma.projectTask.update({
                            where: { id: task.id },
                            data: {
                                status: 'Completed',
                                commitMessage: commit.message,
                                commitUrl: commit.url,
                                commitAuthor: commit.author.name,
                                commitTimestamp: new Date(commit.timestamp)
                            }
                        });

                        console.log(`Marking task ${task.title} as Completed`);
                        console.log(`SUCCESS: Task ${taskId} updated in DB.`);


                        if (io) {
                            io.emit('taskUpdated', {
                                taskId: task.id,
                                projectId: task.step.project.id,
                                status: 'Completed',
                                message: `Task completed via commit: ${message}`
                            });
                            console.log('Socket event emitted: taskUpdated');
                        }
                    } else {
                        console.warn(`Task ID ${taskId} not found in any project.`);
                    }
                }
            }
            return res.status(200).json({ message: 'Processed' });
        }
        res.status(200).json({ message: 'Ignored' });
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
