const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');
const { encrypt } = require('../utils/encryption');
const { sendZyncEmail } = require('../services/mailer');
const { appendRow } = require('../services/sheetLogger');


const sendVerificationEmail = async (email, code) => {
  return sendZyncEmail(
    email,
    'Phone Verification Code',
    `<b>Your verification code is: ${code}</b>`,
    `Your verification code is: ${code}`
  );
};


router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { uid: req.user.uid } });
    if (!user) return res.status(404).json({ message: 'User not found' });


    let teamInfo = null;
    if (user.teamMemberships && user.teamMemberships.length > 0) {
      teamInfo = await prisma.team.findUnique({ where: { id: user.teamMemberships[0] } });
    }

    res.json({ ...user, teamId: teamInfo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/sync', verifyToken, async (req, res) => {
  const { uid: bodyUid, email, displayName, photoURL, phoneNumber, firstName, lastName } = req.body;
  const uid = req.user.uid;

  try {
    let user = await prisma.user.findUnique({ where: { uid } });

    let finalDisplayName = displayName;
    if (!finalDisplayName && email) {
      finalDisplayName = email.split('@')[0];
    }

    if (user) {

      const updateData = {
        email,
        status: 'online',
        lastSeen: new Date()
      };
      if (finalDisplayName) updateData.displayName = finalDisplayName;
      if (photoURL) updateData.photoURL = photoURL;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (!user.firstName && firstName) updateData.firstName = firstName;
      if (!user.lastName && lastName) updateData.lastName = lastName;

      user = await prisma.user.update({
        where: { uid },
        data: updateData
      });
    } else {

      user = await prisma.user.create({
        data: {
          uid,
          email,
          displayName: finalDisplayName || 'User',
          firstName: firstName || null,
          lastName: lastName || null,
          photoURL: photoURL || null,
          phoneNumber: phoneNumber || null,
          status: 'online',
          lastSeen: new Date()
        }
      });


      try {
        await sendZyncEmail(
          'consolemaster.app@gmail.com',
          '🚀 New User Joined ZYNC!',
          `
            <h1>New User Alert!</h1>
            <p><strong>Name:</strong> ${displayName || 'N/A'}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>UID:</strong> ${uid}</p>
          `,
          `New User Alert! Name: ${displayName || 'N/A'}, Email: ${email}`
        );
        console.log(`Notification email sent for new user: ${email}`);
      } catch (emailError) {
        console.error("Failed to send admin notification:", emailError);
      }

      // Log new user to Google Sheets
      try {
        await appendRow(
          finalDisplayName || 'N/A',
          email,
          new Date().toISOString()
        );
        console.log(`New user logged to Google Sheets: ${email}`);
      } catch (sheetError) {
        console.error('Failed to log user to Google Sheets:', sheetError);
      }
    }


    let teamInfo = null;
    if (user.teamMemberships && user.teamMemberships.length > 0) {
      teamInfo = await prisma.team.findUnique({ where: { id: user.teamMemberships[0] } });
    }

    res.status(200).json({ ...user, teamId: teamInfo });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/sync-github', verifyToken, async (req, res) => {
  const { accessToken, username, firebaseUid } = req.body;
  const uid = req.user?.uid || firebaseUid;

  if (!accessToken) {
    return res.status(400).json({ message: 'GitHub Access Token is required' });
  }

  try {
    const encryptedToken = encrypt(accessToken);

    const user = await prisma.user.update({
      where: { uid },
      data: {
        githubIntegration: {
          connected: true,
          accessToken: encryptedToken,
          username: username,
          connectedAt: new Date().toISOString()
        }
      }
    });

    res.json({ message: 'GitHub account linked successfully', user });
  } catch (error) {
    console.error('Error syncing GitHub data:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found in database. Please refresh.' });
    }
    res.status(500).json({ message: 'Server error updating GitHub integration' });
  }
});


router.get('/search', verifyToken, async (req, res) => {
  const { query } = req.query;
  if (!query) return res.json([]);

  try {
    const currentUserUid = req.user.uid;
    const searchLower = query.toLowerCase();


    const users = await prisma.user.findMany({
      where: {
        AND: [
          { uid: { not: currentUserUid } },
          {
            OR: [
              { displayName: { contains: searchLower, mode: 'insensitive' } },
              { email: { contains: searchLower, mode: 'insensitive' } },
              { firstName: { contains: searchLower, mode: 'insensitive' } },
              { lastName: { contains: searchLower, mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        uid: true,
        displayName: true,
        email: true,
        photoURL: true,
        status: true,
        lastSeen: true,
        teamMemberships: true
      },
      take: 20
    });

    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});


router.post('/chat-request', verifyToken, async (req, res) => {
  const { recipientId, message } = req.body;
  const senderUid = req.user.uid;

  try {
    const sender = await prisma.user.findUnique({ where: { uid: senderUid } });
    const recipient = await prisma.user.findUnique({ where: { uid: recipientId } });

    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });


    const existingRequests = Array.isArray(recipient.chatRequests) ? recipient.chatRequests : [];
    const existingRequest = existingRequests.find(r => r.senderId === senderUid && r.status === 'pending');
    if (existingRequest) {
      return res.status(400).json({ message: 'Request already sent' });
    }


    const newRequest = {
      senderId: senderUid,
      senderName: sender.displayName,
      senderEmail: sender.email,
      senderPhoto: sender.photoURL,
      message: message,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await prisma.user.update({
      where: { uid: recipientId },
      data: {
        chatRequests: [...existingRequests, newRequest]
      }
    });


    await sendZyncEmail(
      recipient.email,
      `New Chat Request from ${sender.displayName || 'a Zync User'}`,
      `
        <h2>Chat Request</h2>
        <p><b>${sender.displayName}</b> wants to chat with you on ZYNC.</p>
        <p><i>"${message}"</i></p>
        <br/>
        <p>Log in to ZYNC to view and reply.</p>
      `,
      `New Chat Request from ${sender.displayName}: "${message}"`
    );

    res.json({ message: 'Chat request sent successfully' });
  } catch (error) {
    console.error('Chat request error:', error);
    res.status(500).json({ message: 'Failed to send chat request' });
  }
});


router.post('/chat-request/respond', verifyToken, async (req, res) => {
  const { senderId, status } = req.body;
  const recipientUid = req.user.uid;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const recipient = await prisma.user.findUnique({ where: { uid: recipientUid } });
    const sender = await prisma.user.findUnique({ where: { uid: senderId } });

    if (!recipient || !sender) return res.status(404).json({ message: 'User not found' });

    const chatRequests = Array.isArray(recipient.chatRequests) ? [...recipient.chatRequests] : [];
    const requestIndex = chatRequests.findIndex(r => r.senderId === senderId && r.status === 'pending');
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Pending request not found' });
    }


    chatRequests[requestIndex] = { ...chatRequests[requestIndex], status };

    if (status === 'accepted') {

      const recipientConnections = [...(recipient.connections || [])];
      const senderConnections = [...(sender.connections || [])];

      if (!recipientConnections.includes(senderId)) recipientConnections.push(senderId);
      if (!senderConnections.includes(recipientUid)) senderConnections.push(recipientUid);

      await prisma.user.update({
        where: { uid: senderId },
        data: { connections: senderConnections }
      });

      await prisma.user.update({
        where: { uid: recipientUid },
        data: { chatRequests, connections: recipientConnections }
      });
    } else {
      await prisma.user.update({
        where: { uid: recipientUid },
        data: { chatRequests }
      });
    }

    res.json({ message: `Request ${status}` });
  } catch (error) {
    console.error('Error responding to request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/close-friends/toggle', verifyToken, async (req, res) => {
  const { friendId } = req.body;
  const uid = req.user.uid;

  try {
    const user = await prisma.user.findUnique({ where: { uid } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const closeFriends = [...(user.closeFriends || [])];
    const index = closeFriends.indexOf(friendId);

    if (index > -1) {
      closeFriends.splice(index, 1);
      await prisma.user.update({ where: { uid }, data: { closeFriends } });
      return res.json({ message: 'Removed from Close Friends', isCloseFriend: false });
    } else {
      closeFriends.push(friendId);
      await prisma.user.update({ where: { uid }, data: { closeFriends } });
      return res.json({ message: 'Added to Close Friends', isCloseFriend: true });
    }
  } catch (error) {
    console.error('Error toggling close friend:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/', verifyToken, async (req, res) => {
  try {
    const { teamId } = req.query;
    const currentUser = await prisma.user.findUnique({ where: { uid: req.user.uid } });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });


    if (teamId) {
      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team) return res.status(404).json({ message: 'Team not found' });
      const users = await prisma.user.findMany({
        where: { uid: { in: team.members } },
        orderBy: { lastSeen: 'desc' }
      });
      return res.status(200).json(users);
    }


    const relatedUids = new Set(currentUser.connections || []);


    const allMyTeams = await prisma.team.findMany({
      where: { members: { has: req.user.uid } }
    });
    const ownedTeams = await prisma.team.findMany({
      where: { ownerId: req.user.uid }
    });

    const uniqueTeams = [...allMyTeams, ...ownedTeams];
    uniqueTeams.forEach(t => {
      if (t.members) t.members.forEach(m => relatedUids.add(m));
    });

    relatedUids.add(req.user.uid);

    const users = await prisma.user.findMany({
      where: { uid: { in: Array.from(relatedUids) } },
      orderBy: { lastSeen: 'desc' }
    });
    res.status(200).json(users);

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/:uid', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { uid: req.params.uid } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const updates = req.body;


    if (updates.phoneNumber) {
      const user = await prisma.user.findUnique({ where: { uid } });
      if (user && user.phoneNumber !== updates.phoneNumber) {
        updates.isPhoneVerified = false;
        updates.phoneVerificationCode = null;
        updates.phoneVerificationCodeExpires = null;
      }
    }


    const { id, uid: _uid, createdAt, updatedAt, ...safeUpdates } = updates;

    const user = await prisma.user.update({
      where: { uid },
      data: safeUpdates
    });
    res.status(200).json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/delete/request', verifyToken, async (req, res) => {
  const { uid } = req.body;

  if (req.user.uid !== uid) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { uid } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.update({
      where: { uid },
      data: {
        deleteConfirmationCode: code,
        deleteConfirmationExpires: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    await sendZyncEmail(
      user.email,
      'Account Deletion Verification Code',
      `
        <h2>Confirm Account Deletion</h2>
        <p>You have requested to delete your ZYNC account. This action is irreversible.</p>
        <p><b>Verification Code: ${code}</b></p>
        <p>If you did not request this, please ignore this email and secure your account.</p>
      `,
      `Verification Code: ${code}`
    );

    res.status(200).json({ message: 'Verification code sent to email' });
  } catch (error) {
    console.error('Error requesting deletion:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/delete/confirm', verifyToken, async (req, res) => {
  const { uid, code } = req.body;
  console.log(`[DELETE] Request to delete user: ${uid} with code: ${code}`);

  if (req.user.uid !== uid) {
    console.warn(`[DELETE] Unauthorized attempt by ${req.user.uid} to delete ${uid}`);
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { uid } });
    if (!user) {
      console.warn(`[DELETE] User not found: ${uid}`);
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.deleteConfirmationCode !== code) {
      console.warn(`[DELETE] Invalid code for user ${uid}`);
      return res.status(400).json({ message: 'Invalid code' });
    }

    if (user.deleteConfirmationExpires < new Date()) {
      console.warn(`[DELETE] Code expired for user ${uid}`);
      return res.status(400).json({ message: 'Code expired' });
    }


    const teamsWithUser = await prisma.team.findMany({
      where: { members: { has: uid } }
    });
    for (const team of teamsWithUser) {
      await prisma.team.update({
        where: { id: team.id },
        data: { members: team.members.filter(m => m !== uid) }
      });
    }
    console.log(`[DELETE] Removed user ${uid} from teams`);


    await prisma.user.delete({ where: { uid } });
    console.log(`[DELETE] User ${uid} deleted from database`);


    try {
      const admin = require('firebase-admin');
      await admin.auth().deleteUser(uid);
      console.log(`[DELETE] User ${uid} deleted from Firebase Auth (server-side)`);
    } catch (fbError) {
      console.error(`[DELETE] Failed to delete user from Firebase Auth:`, fbError.message);
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error confirming deletion:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/verify-phone/request', async (req, res) => {
  const { uid, phoneNumber } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { uid } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.update({
      where: { uid },
      data: {
        phoneVerificationCode: code,
        phoneVerificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
        phoneNumber: phoneNumber,
        isPhoneVerified: false
      }
    });

    await sendVerificationEmail(user.email, code);

    res.status(200).json({ message: 'Verification code sent to email' });
  } catch (error) {
    console.error('Error requesting verification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/verify-phone/confirm', async (req, res) => {
  const { uid, code } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { uid } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.phoneVerificationCode !== code) {
      return res.status(400).json({ message: 'Invalid code' });
    }

    if (user.phoneVerificationCodeExpires < new Date()) {
      return res.status(400).json({ message: 'Code expired' });
    }

    await prisma.user.update({
      where: { uid },
      data: {
        isPhoneVerified: true,
        phoneVerificationCode: null,
        phoneVerificationCodeExpires: null
      }
    });

    res.status(200).json({ message: 'Phone number verified successfully' });
  } catch (error) {
    console.error('Error verifying phone:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
