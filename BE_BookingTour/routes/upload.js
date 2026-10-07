const express = require('express');
const router = express.Router();
const { safeSingleUpload } = require('../middleware/upload.middleware');

// POST: Upload single image to Cloudinary
// Endpoint: /api/upload
router.post('/', safeSingleUpload('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: req.file.path // Cloudinary URL
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
});

module.exports = router;
