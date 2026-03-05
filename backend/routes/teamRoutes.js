const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const User = require('../models/User');
const Team = require('../models/Team');
const { normalizeDoc, normalizeDocs } = require('../utils/normalize');


const generateInviteCode = async () => {
    let code;
    let isUnique = false;
    while (!isUnique) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
        const existingTeam = await Team.findOne({ inviteCode: code }).lean();
        if (!existingTeam) isUnique = true;
    }
    return code;
};


router.get('/owned', verifyToken, async (req, res) => {
    const uid = req.user.uid;
    try {
        const teams = await Team.find({ ownerId: uid }).lean();
        res.json(normalizeDocs(teams));
    } catch (error) {
        console.error('Error fetching owned teams:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.get('/mine', verifyToken, async (req, res) => {
    const uid = req.user.uid;
    try {
        const teams = await Team.find({ members: uid }).lean();
        res.json(normalizeDocs(teams));
    } catch (error) {
        console.error('Error fetching my teams:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.post('/create', verifyToken, async (req, res) => {
    const { name, type, initialInvites } = req.body;
    const uid = req.user.uid;

    if (!name) return res.status(400).json({ message: 'Team name is required' });

    try {
        const user = await User.findOne({ uid }).lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        const inviteCode = await generateInviteCode();

        const savedTeam = await Team.create({
            name,
            type: type || 'Other',
            inviteCode,
            ownerId: uid,
            members: [uid]
        });
        const teamObj = normalizeDoc(savedTeam.toObject());

        // Add team to user's memberships
        const memberships = [...(user.teamMemberships || []), teamObj.id];
        await User.updateOne({ uid }, { $set: { teamMemberships: memberships } });

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

        res.status(201).json(teamObj);
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.post('/join', verifyToken, async (req, res) => {
    const { inviteCode } = req.body;
    const uid = req.user.uid;

    if (!inviteCode) return res.status(400).json({ message: 'Invite code is required' });

    try {
        const team = await Team.findOne({ inviteCode }).lean();
        if (!team) return res.status(404).json({ message: 'Team not found with this code' });

        if (team.members.includes(uid)) {
            return res.status(400).json({ message: 'User already in this team' });
        }

        const user = await User.findOne({ uid }).lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        const newMembers = [...team.members, uid];
        const updatedTeam = await Team.findByIdAndUpdate(
            team._id,
            { $set: { members: newMembers } },
            { new: true, lean: true }
        );

        const teamId = team._id.toString();
        const memberships = [...(user.teamMemberships || []), teamId];
        await User.updateOne({ uid }, { $set: { teamMemberships: memberships } });

        res.status(200).json(normalizeDoc(updatedTeam));

    } catch (error) {
        console.error('Error joining team:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.delete('/:teamId', verifyToken, async (req, res) => {
    const { teamId } = req.params;
    const uid = req.user.uid;

    try {
        const team = await Team.findById(teamId).lean();
        if (!team) return res.status(404).json({ message: 'Team not found' });

        if (team.ownerId !== uid) {
            return res.status(403).json({ message: 'Only the team owner can delete the team' });
        }

        for (const memberUid of team.members) {
            const member = await User.findOne({ uid: memberUid }).lean();
            if (member) {
                await User.updateOne(
                    { uid: memberUid },
                    { $set: { teamMemberships: member.teamMemberships.filter(id => id !== teamId) } }
                );
            }
        }

        await Team.findByIdAndDelete(teamId);

        res.status(200).json({ message: 'Team deleted successfully' });
    } catch (error) {
        console.error('Error deleting team:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.delete('/:teamId/members/:memberUid', verifyToken, async (req, res) => {
    const { teamId, memberUid } = req.params;
    const uid = req.user.uid;

    try {
        const team = await Team.findById(teamId).lean();
        if (!team) return res.status(404).json({ message: 'Team not found' });

        if (team.ownerId !== uid) {
            return res.status(403).json({ message: 'Only the team owner can remove members' });
        }

        if (memberUid === team.ownerId) {
            return res.status(400).json({ message: 'Cannot remove the owner. Delete the team instead.' });
        }

        await Team.updateOne(
            { _id: team._id },
            { $set: { members: team.members.filter(id => id !== memberUid) } }
        );

        const member = await User.findOne({ uid: memberUid }).lean();
        if (member) {
            await User.updateOne(
                { uid: memberUid },
                { $set: { teamMemberships: member.teamMemberships.filter(id => id !== teamId) } }
            );
        }

        res.status(200).json({ message: 'Member removed successfully' });
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.post('/invite', verifyToken, async (req, res) => {
    const { email } = req.body;
    const uid = req.user.uid;

    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const user = await User.findOne({ uid }).lean();
        if (!user || !user.teamMemberships || user.teamMemberships.length === 0) {
            return res.status(400).json({ message: 'You must be in a team to invite members' });
        }

        const teamId = user.teamMemberships[0];
        const team = await Team.findById(teamId).lean();
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


router.post('/:teamId/leave', verifyToken, async (req, res) => {
    const { teamId } = req.params;
    const uid = req.user.uid;

    try {
        const team = await Team.findById(teamId).lean();
        if (!team) return res.status(404).json({ message: 'Team not found' });

        if (team.ownerId === uid) {
            return res.status(400).json({ message: 'The owner cannot leave the team. Transfer ownership or delete the team instead.' });
        }

        if (!team.members.includes(uid)) {
            return res.status(400).json({ message: 'You are not a member of this team' });
        }

        await Team.updateOne(
            { _id: team._id },
            { $set: { members: team.members.filter(id => id !== uid) } }
        );

        const user = await User.findOne({ uid }).lean();
        if (user) {
            await User.updateOne(
                { uid },
                { $set: { teamMemberships: user.teamMemberships.filter(id => id !== teamId) } }
            );
        }

        res.status(200).json({ message: 'Left team successfully' });
    } catch (error) {
        console.error('Error leaving team:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.get('/:teamId/details', verifyToken, async (req, res) => {
    const { teamId } = req.params;

    try {
        const team = await Team.findById(teamId).lean();
        if (!team) return res.status(404).json({ message: 'Team not found' });

        const memberDetails = await Promise.all(
            team.members.map(async (memberUid) => {
                const user = await User.findOne({ uid: memberUid }).lean();
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
            ...normalizeDoc(team),
            memberDetails
        });
    } catch (error) {
        console.error('Error fetching team details:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
