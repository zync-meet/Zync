const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const prisma = require('../lib/prisma');
const { getInstallationAccessToken } = require('../utils/githubAppAuth');

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;


const verifySignature = (req, res, next) => {
    const signature = req.headers['x-hub-signature-256'];
    const deliveryId = req.headers['x-github-delivery'];

    if (!WEBHOOK_SECRET) {
        console.warn("GITHUB_WEBHOOK_SECRET not set. Skipping verification.");
        return next();
    }

    if (!signature) {
        console.error(`[Webhook ${deliveryId}] No signature found on request.`);
        return res.status(401).json({ error: 'No signature found' });
    }

    if (!req.rawBody) {
        console.error(`[Webhook ${deliveryId}] req.rawBody is missing.`);
        return res.status(500).json({ error: 'Internal Server Error: Raw body missing' });
    }

    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
        console.log(`[Webhook ${deliveryId}] Signature verified successfully.`);
        req.deliveryId = deliveryId;
        next();
    } else {
        console.error(`[Webhook ${deliveryId}] Invalid signature.`);
        return res.status(401).json({ error: 'Invalid signature' });
    }
};

router.post('/', verifySignature, async (req, res) => {
    const event = req.headers['x-github-event'];
    const payload = req.body;

    if (event === 'ping') return res.json({ message: 'Pong' });

    if (event === 'push') {
        const { commits, repository, installation } = payload;
        const installationId = installation?.id;

        console.log(`Received push event for ${repository.full_name} with ${commits.length} commits.`);

        try {
            let installToken = null;
            try {
                if (installationId) {
                    installToken = await getInstallationAccessToken(installationId);
                }
            } catch (err) {
                console.error("Failed to get installation token:", err.message);
            }

            for (const commit of commits) {
                const message = commit.message;
                const match = message.match(/\[ZYNC-COMPLETE #([a-zA-Z0-9_-]+)\]/i);

                if (match) {
                    const taskId = match[1];
                    console.log(`Found completion tag for Task ID: ${taskId}`);


                    const task = await prisma.projectTask.findFirst({
                        where: {
                            OR: [
                                { id: taskId },
                                { displayId: taskId },
                                { displayId: `TASK-${taskId}` }
                            ]
                        },
                        include: {
                            step: {
                                include: { project: true }
                            }
                        }
                    });

                    if (task) {
                        const senderLogin = payload.sender.login;

                        if (!task.assignedTo) {
                            console.log(`Task ${taskId} is unassigned. Ignoring commit from ${senderLogin}.`);
                        } else {

                            const assignedUser = await prisma.user.findUnique({
                                where: { uid: task.assignedTo }
                            });
                            const storedUsername = assignedUser?.githubIntegration?.username;

                            if (storedUsername === senderLogin) {

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

                                console.log(`Task ${taskId} marked as Completed by ${senderLogin}.`);


                                if (installToken) {
                                    try {
                                        await axios.post(
                                            `https://api.github.com/repos/${repository.full_name}/commits/${commit.id}/comments`,
                                            {
                                                body: `🚀 **Zync Bot**: Task **#${taskId}** ("${task.title}") has been set to **Completed** by @${senderLogin}! Verified assignment. ✅`
                                            },
                                            {
                                                headers: {
                                                    'Authorization': `token ${installToken}`,
                                                    'Accept': 'application/vnd.github.v3+json'
                                                }
                                            }
                                        );
                                        console.log(`Posted comment on commit ${commit.id}`);
                                    } catch (commentErr) {
                                        console.error("Failed to post GitHub comment:", commentErr.message);
                                    }
                                }


                                const io = req.app.get('io');
                                if (io) {
                                    const projectId = task.step.project.id;
                                    io.emit('taskUpdated', {
                                        taskId: task.id,
                                        projectId,
                                        status: 'Completed',
                                        message: `Task status updated via commit`
                                    });


                                    const fullProject = await prisma.project.findUnique({
                                        where: { id: projectId },
                                        include: {
                                            steps: {
                                                include: { tasks: true },
                                                orderBy: { order: 'asc' }
                                            }
                                        }
                                    });
                                    io.emit('projectUpdate', {
                                        projectId,
                                        project: fullProject
                                    });
                                }
                            } else {
                                console.log(`Unauthorized commit attempt by ${senderLogin} for task ${taskId}`);
                            }
                        }
                    } else {
                        console.log(`Task ${taskId} not found in any project.`);
                    }
                }
            }
        } catch (error) {
            console.error("Error processing push webhook:", error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    res.json({ success: true });
});

module.exports = router;
