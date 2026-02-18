const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');

// Helper to generate unique 6-digit code
const generateInviteCode = async () => {
    let code;
    let isUnique = false;
    while (!isUnique) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
        const existingTeam = await prisma.team.findUnique({ where: { inviteCode: code } });
        if (!existingTeam) isUnique = true;
    }
    return code;
};

// Get Teams Owned by User
router.get('/owned', verifyToken, async (req, res) => {
    const uid = req.user.uid;
    try {
        const teams = await prisma.team.findMany({ where: { ownerId: uid } });
        res.json(teams);
    } catch (error) {
        console.error('Error fetching owned teams:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get All Teams User is Member Of
router.get('/mine', verifyToken, async (req, res) => {
    const uid = req.user.uid;
    try {
        const teams = await prisma.team.findMany({
            where: { members: { has: uid } }
        });
        res.json(teams);
    } catch (error) {
        console.error('Error fetching my teams:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create Team
router.post('/create', verifyToken, async (req, res) => {
    const { name, type, initialInvites } = req.body;
    const uid = req.user.uid;

    if (!name) return res.status(400).json({ message: 'Team name is required' });

    try {
        const user = await prisma.user.findUnique({ where: { uid } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const inviteCode = await generateInviteCode();

        const savedTeam = await prisma.team.create({
            data: {
                name,
                type: type || 'Other',
                inviteCode,
                ownerId: uid,
                members: [uid]
            }
        });

        // Update user's teamMemberships
        await prisma.user.update({
            where: { uid },
            data: {
                teamMemberships: { push: savedTeam.id }
            }
        });

        // Send Initial Invites
        if (initialInvites && Array.isArray(initialInvites) && initialInvites.length > 0) {
            const { sendZYNCEmail } = require('../services/mailer');
            initialInvites.forEach(async (email) => {
                if (!email) return;
                try {
                    await sendZYNCEmail(
                        email,
                        `Join ${name} on ZYNC!`,
                        `
                          <h2>You've been invited to join a team!</h2>
                          <p>${user.displayName || 'A colleague'} has invited you to join the <strong>${name}</strong> team on ZYNC.</p>
                          <p><strong>Invite Code: ${inviteCode}</strong></p>
                          <p>Login to ZYNC and enter this code to join.</p>
                        `,
                        `You've been invited to join ${name}. Invite Code: ${inviteCode}`
                    );
                } catch (err) {
                    console.error(`Failed to send invite to ${email}:`, err);
                }
            });
        }

        res.status(201).json(savedTeam);
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Join Team
router.post('/join', verifyToken, async (req, res) => {
    const { inviteCode } = req.body;
    const uid = req.user.uid;

    if (!inviteCode) return res.status(400).json({ message: 'Invite code is required' });

    try {
        const team = await prisma.team.findUnique({ where: { inviteCode } });
        if (!team) return res.status(404).json({ message: 'Team not found with this code' });

        if (team.members.includes(uid)) {
            return res.status(400).json({ message: 'User already in this team' });
        }

        const user = await prisma.user.findUnique({ where: { uid } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Add to team members
        const updatedTeam = await prisma.team.update({
            where: { id: team.id },
            data: { members: { push: uid } }
        });

        // Update user's teamMemberships
        await prisma.user.update({
            where: { uid },
            data: { teamMemberships: { push: team.id } }
        });

        res.status(200).json(updatedTeam);

    } catch (error) {
        console.error('Error joining team:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete Team (Owner Only)
router.delete('/:teamId', verifyToken, async (req, res) => {
    const { teamId } = req.params;
    const uid = req.user.uid;

    try {
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) return res.status(404).json({ message: 'Team not found' });

        if (team.ownerId !== uid) {
            return res.status(403).json({ message: 'Only the team owner can delete the team' });
        }

        // Remove teamId from all members' teamMemberships
        for (const memberUid of team.members) {
            const member = await prisma.user.findUnique({ where: { uid: memberUid } });
            if (member) {
                await prisma.user.update({
                    where: { uid: memberUid },
                    data: {
                        teamMemberships: member.teamMemberships.filter(id => id !== teamId)
                    }
                });
            }
        }

        await prisma.team.delete({ where: { id: teamId } });

        res.status(200).json({ message: 'Team deleted successfully' });
    } catch (error) {
        console.error('Error deleting team:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove Member (Owner Only)
router.delete('/:teamId/members/:memberUid', verifyToken, async (req, res) => {
    const { teamId, memberUid } = req.params;
    const uid = req.user.uid;

    try {
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) return res.status(404).json({ message: 'Team not found' });

        if (team.ownerId !== uid) {
            return res.status(403).json({ message: 'Only the team owner can remove members' });
        }

        if (memberUid === team.ownerId) {
            return res.status(400).json({ message: 'Cannot remove the owner. Delete the team instead.' });
        }

        // Remove from team members array
        await prisma.team.update({
            where: { id: teamId },
            data: {
                members: team.members.filter(id => id !== memberUid)
            }
        });

        // Update user to remove teamMembership
        const member = await prisma.user.findUnique({ where: { uid: memberUid } });
        if (member) {
            await prisma.user.update({
                where: { uid: memberUid },
                data: {
                    teamMemberships: member.teamMemberships.filter(id => id !== teamId)
                }
            });
        }

        res.status(200).json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Invite Member
router.post('/invite', verifyToken, async (req, res) => {
    const { email } = req.body;
    const uid = req.user.uid;

    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const user = await prisma.user.findUnique({ where: { uid } });
        if (!user || !user.teamMemberships || user.teamMemberships.length === 0) {
            return res.status(400).json({ message: 'You must be in a team to invite members' });
        }

        // Use the first team membership
        const teamId = user.teamMemberships[0];
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) return res.status(404).json({ message: 'Team not found' });

        const { sendZYNCEmail } = require('../services/mailer');
        await sendZYNCEmail(
            email,
            `You're invited to join ${team.name} on ZYNC!`,
            `
              <h2>Team Invitation</h2>
              <p>${user.displayName || 'A colleague'} has invited you to join the <strong>${team.name}</strong> team.</p>
              <p><strong>Invite Code: ${team.inviteCode}</strong></p>
              <p>Login to ZYNC and enter this code to join the team.</p>
            `,
            `You've been invited to join ${team.name}. Invite Code: ${team.inviteCode}`
        );

        res.status(200).json({ message: 'Invitation sent successfully' });
    } catch (error) {
        console.error('Error sending invite:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Leave Team (Member leaves voluntarily)
router.post('/:teamId/leave', verifyToken, async (req, res) => {
    const { teamId } = req.params;
    const uid = req.user.uid;

    try {
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) return res.status(404).json({ message: 'Team not found' });

        if (team.ownerId === uid) {
            return res.status(400).json({ message: 'The owner cannot leave the team. Transfer ownership or delete the team instead.' });
        }

        if (!team.members.includes(uid)) {
            return res.status(400).json({ message: 'You are not a member of this team' });
        }

        // Remove from team members
        await prisma.team.update({
            where: { id: teamId },
            data: { members: team.members.filter(id => id !== uid) }
        });

        // Remove from user's teamMemberships
        const user = await prisma.user.findUnique({ where: { uid } });
        if (user) {
            await prisma.user.update({
                where: { uid },
                data: { teamMemberships: user.teamMemberships.filter(id => id !== teamId) }
            });
        }

        res.status(200).json({ message: 'Left team successfully' });
    } catch (error) {
        console.error('Error leaving team:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Team Details with Member Info
router.get('/:teamId/details', verifyToken, async (req, res) => {
    const { teamId } = req.params;

    try {
        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (!team) return res.status(404).json({ message: 'Team not found' });

        // Resolve member UIDs to user objects
        const memberDetails = await Promise.all(
            team.members.map(async (memberUid) => {
                const user = await prisma.user.findUnique({ where: { uid: memberUid } });
                return user ? {
                    uid: user.uid,
                    displayName: user.displayName || user.email?.split('@')[0] || 'Unknown',
                    email: user.email,
                    photoURL: user.photoURL,
                    isOwner: memberUid === team.ownerId
                } : { uid: memberUid, displayName: 'Unknown User', email: '', photoURL: null, isOwner: false };
            })
        );

        res.json({
            ...team,
            memberDetails
        });
    } catch (error) {
        console.error('Error fetching team details:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
