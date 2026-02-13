const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const prisma = require('../lib/prisma');

// POST /api/google/connect
// Saves the Google OAuth token (accessToken) to the user's profile
router.post('/connect', verifyToken, async (req, res) => {
    const { accessToken, email, refreshToken } = req.body;
    const uid = req.user.uid;

    if (!accessToken) {
        return res.status(400).json({ message: 'Access Token is required' });
    }

    try {
        const googleData = {
            connected: true,
            email,
            accessToken,
            connectedAt: new Date().toISOString()
        };
        if (refreshToken) {
            googleData.refreshToken = refreshToken;
        }

        const user = await prisma.user.update({
            where: { uid },
            data: { googleIntegration: googleData }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({
            message: 'Google connected',
            email: user.googleIntegration?.email
        });

    } catch (error) {
        console.error('Google Connect Error:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// DELETE /api/google/disconnect
router.delete('/disconnect', verifyToken, async (req, res) => {
    const uid = req.user.uid;

    try {
        await prisma.user.update({
            where: { uid },
            data: {
                googleIntegration: {
                    connected: false,
                    accessToken: null,
                    refreshToken: null,
                    email: null
                }
            }
        });

        res.status(200).json({ message: 'Google disconnected' });

    } catch (error) {
        console.error('Google Disconnect Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
