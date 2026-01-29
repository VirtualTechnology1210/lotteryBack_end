/**
 * Multer Configuration for File Uploads
 * Handles image uploads for categories and other features
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
    const dirs = [
        'uploads',
        'uploads/categories',
        'uploads/temp'
    ];

    dirs.forEach(dir => {
        const fullPath = path.join(__dirname, '..', dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    });
};

createUploadDirs();

// Storage configuration for categories
const categoryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'uploads', 'categories');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: category_timestamp_originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `category_${uniqueSuffix}${ext}`);
    }
});

// File filter - only allow images
const imageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) are allowed!'), false);
    }
};

// Multer upload instances
const uploadCategory = multer({
    storage: categoryStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Error handler middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.',
                timestamp: new Date().toISOString()
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message,
            timestamp: new Date().toISOString()
        });
    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
            timestamp: new Date().toISOString()
        });
    }
    next();
};

// Helper to delete file
const deleteFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

// Helper to get file URL
const getFileUrl = (filename, folder = 'categories') => {
    if (!filename) return null;
    return `/uploads/${folder}/${filename}`;
};

module.exports = {
    uploadCategory,
    handleMulterError,
    deleteFile,
    getFileUrl
};
