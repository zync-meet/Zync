const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');
const { createInstantMeet } = require('../services/googleMeet');
const { sendZyncEmail } = require('../services/mailer');
const { getMeetingInviteTextVersion, getMeetingEmailHtml } = require('../utils/emailTemplates');


router.get('/user/:uid', verifyToken, async (req, res) => {
    const { uid } = req.params;
    if (req.user.uid !== uid) {
        return res.status(403).json({ message: 'Unauthorized access to meeting history' });
    }

    try {
        const meetings = await prisma.meeting.findMany({
            where: {
                OR: [
                    { organizerId: uid },


                ]
            },
            orderBy: { startTime: 'desc' },
            take: 20
        });


        const filteredMeetings = meetings.filter(m => {
            if (m.organizerId === uid) return true;
            const participants = Array.isArray(m.participants) ? m.participants : [];
            return participants.some(p => p.uid === uid);
        });


        const now = new Date();
        const updatedMeetings = filteredMeetings.map(m => {
            const startTime = new Date(m.startTime);
            const meetingEnd = m.endTime ? new Date(m.endTime) : new Date(startTime.getTime() + 60 * 60 * 1000);

            let status = m.status;
            if (status === 'cancelled') return { ...m, status };

            if (now.getTime() > meetingEnd.getTime()) {
                status = 'ended';
            } else if (now.getTime() >= startTime.getTime() && now.getTime() <= meetingEnd.getTime()) {
                status = 'live';
            } else if (now.getTime() < startTime.getTime()) {
                status = 'scheduled';
            }

            return { ...m, status };
        });

        res.json(updatedMeetings);
    } catch (error) {
        console.error('Error fetching meetings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.delete('/:meetingId', verifyToken, async (req, res) => {
    const { meetingId } = req.params;
    const uid = req.user.uid;

    try {
        const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        if (meeting.organizerId !== uid) {
            return res.status(403).json({ message: 'Only the organizer can delete this meeting' });
        }

        await prisma.meeting.delete({ where: { id: meetingId } });

        res.json({ message: 'Meeting deleted successfully' });
    } catch (error) {
        console.error('Error deleting meeting:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.post('/schedule', verifyToken, async (req, res) => {
    const { title, description, startTime, endTime, organizerId, participantIds } = req.body;

    if (req.user.uid !== organizerId) {
        return res.status(403).json({ message: 'Unauthorized organizer' });
    }

    try {
        const meetingUrl = await createInstantMeet();

        const organizer = await prisma.user.findUnique({ where: { uid: organizerId } });
        const participants = participantIds && participantIds.length > 0
            ? await prisma.user.findMany({ where: { uid: { in: participantIds } } })
            : [];

        const participantData = participants.map(u => ({
            uid: u.uid,
            email: u.email,
            name: u.displayName,
            status: 'invited'
        }));

        const newMeeting = await prisma.meeting.create({
            data: {
                title: title || 'Scheduled Meeting',
                description,
                startTime: new Date(startTime),
                endTime: endTime ? new Date(endTime) : new Date(new Date(startTime).getTime() + 60 * 60 * 1000),
                organizerId,
                organizerName: organizer?.displayName || 'Unknown',
                meetLink: meetingUrl,
                status: 'scheduled',
                participants: participantData
            }
        });


        (async () => {
            await Promise.all(participants.map(async (receiver) => {
                if (receiver.email) {
                    try {
                        const senderName = organizer.displayName || 'A colleague';
                        const recipientName = receiver.displayName || 'there';
                        const emailSubject = `Invitation: ${newMeeting.title} @ ${new Date(startTime).toLocaleString()}`;

                        const htmlContent = getMeetingEmailHtml({
                            inviterName: senderName,
                            meetingTopic: title,
                            date: new Date(startTime).toLocaleDateString(),
                            time: new Date(startTime).toLocaleTimeString(),
                            meetingLink: meetingUrl,
                            attendeeName: recipientName
                        });

                        const textContent = getMeetingInviteTextVersion({
                            recipientName,
                            senderName,
                            meetingUrl,
                            meetingDate: new Date(startTime),
                            meetingTime: new Date(startTime),
                            projectName: title,
                        });

                        await sendZyncEmail(receiver.email, emailSubject, htmlContent, textContent);
                    } catch (err) {
                        console.error("Invite email failed for", receiver.email, err);
                    }
                }
            }));
        })();

        res.status(201).json(newMeeting);

    } catch (error) {
        console.error('Error scheduling meeting:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


router.post('/invite', verifyToken, async (req, res) => {
    const { senderId, receiverIds, projectId } = req.body;

    if (req.user.uid !== senderId) {
        return res.status(403).json({ message: 'Unauthorized sender' });
    }

    try {

        const meetingUrl = await createInstantMeet();


        let projectName = null;
        if (projectId) {
            const project = await prisma.project.update({
                where: { id: projectId },
                data: { meetLink: meetingUrl }
            });
            projectName = project?.name || null;
        }

        const sender = await prisma.user.findUnique({ where: { uid: senderId } });
        if (!sender) return res.status(404).json({ message: 'Sender not found' });

        const receivers = Array.isArray(receiverIds) && receiverIds.length > 0
            ? await prisma.user.findMany({ where: { uid: { in: receiverIds } } })
            : [];


        const participantData = receivers.map(u => ({
            uid: u.uid,
            email: u.email,
            name: u.displayName,
            status: 'invited'
        }));

        const newMeeting = await prisma.meeting.create({
            data: {
                title: projectName ? `Sync: ${projectName}` : 'Instant Meeting',
                description: 'Instant meeting started from dashboard',
                startTime: new Date(),
                organizerId: senderId,
                organizerName: sender.displayName,
                meetLink: meetingUrl,
                status: 'live',
                projectId: projectId || null,
                participants: participantData
            }
        });


        res.status(200).json({ message: 'Meeting created', meetingUrl, meetingId: newMeeting.id });


        (async () => {
            try {
                await Promise.all(receivers.map(async (receiver) => {
                    if (receiver.email) {
                        try {
                            const senderName = sender.displayName || 'A colleague';
                            const recipientName = receiver.displayName || receiver.firstName || 'there';
                            const emailSubject = `ZYNC Meeting Invitation from ${senderName}`;

                            const htmlContent = getMeetingEmailHtml({
                                inviterName: senderName,
                                meetingTopic: newMeeting.title,
                                date: new Date().toLocaleDateString(),
                                time: new Date().toLocaleTimeString(),
                                meetingLink: meetingUrl,
                                attendeeName: recipientName
                            });

                            const textContent = getMeetingInviteTextVersion({
                                recipientName,
                                senderName,
                                meetingUrl,
                                meetingDate: new Date(),
                                meetingTime: new Date(),
                                projectName,
                            });

                            await sendZyncEmail(receiver.email, emailSubject, htmlContent, textContent);
                        } catch (emailErr) {
                            console.error(`Failed to email ${receiver.email}:`, emailErr);
                        }
                    }
                }));
            } catch (bgError) {
                console.error("Background notification error:", bgError);
            }
        })();

    } catch (error) {
        console.error('Error creating meeting/invites:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
