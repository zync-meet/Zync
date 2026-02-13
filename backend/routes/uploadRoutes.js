const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const cloudinary = require('cloudinary').v2;
const verifyToken = require('../middleware/authMiddleware');
const User = require('../models/User');

// ---------------------------------------------------------------------------
// Cloudinary Configuration
// ---------------------------------------------------------------------------
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------------------------------------------------------------------
// Profile Photo Upload  →  POST /api/upload/profile-photo
// ---------------------------------------------------------------------------
// Auth required. Uploads to Cloudinary at zync_profiles/{firebaseUid}.
// Overwrites the previous photo automatically (same public_id).
// Updates the MongoDB User document and returns the full user JSON.

const profileUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed.'));
        }
    },
});

router.post('/profile-photo', verifyToken, (req, res) => {
    profileUpload.single('file')(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        try {
            const uid = req.user.uid; // From verifyToken middleware

            // Upload buffer to Cloudinary via stream
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'zync_profiles',
                        public_id: uid,           // Each user gets a unique, stable ID
                        overwrite: true,          // Replace previous photo
                        resource_type: 'image',
                        transformation: [
                            { width: 512, height: 512, crop: 'fill', gravity: 'face' },
                            { quality: 'auto', fetch_format: 'auto' }
                        ],
                    },
                    (error, uploadResult) => {
                        if (error) reject(error);
                        else resolve(uploadResult);
                    }
                );
                stream.end(req.file.buffer);
            });

            // Update MongoDB user document
            const updatedUser = await User.findOneAndUpdate(
                { uid },
                { photoURL: result.secure_url },
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json({
                message: 'Profile photo updated successfully',
                photoURL: result.secure_url,
                user: updatedUser,
            });
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            res.status(500).json({ message: 'Failed to upload profile photo' });
        }
    });
});

// ---------------------------------------------------------------------------
// Generic File Upload  →  POST /api/upload
// ---------------------------------------------------------------------------
// Kept for other file uploads (chat attachments, etc.) – saves to disk.

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = mime.extension(file.mimetype) || 'bin';
        cb(null, uniqueSuffix + '.' + ext);
    },
});

const genericUpload = multer({
    storage: diskStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/zip',
            'application/x-zip-compressed',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type.'));
        }
    },
});

router.post('/', (req, res) => {
    genericUpload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({
            message: 'File uploaded successfully',
            fileUrl,
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
        });
    });
});

module.exports = router;
