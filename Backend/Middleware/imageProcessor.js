const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const processImage = async (req, res, next) => {
    if (!req.file) return next();

    try {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }

        // Create a unique filename with .webp extension
        const fileName = `license-${Date.now()}.webp`;
        const filePath = path.join(uploadDir, fileName);

        // Convert buffer to webp and save to disk
        await sharp(req.file.buffer)
            .webp({ quality: 80 })
            .toFile(filePath);

        // Replace req.file.path with our new webp file path for the controller
        req.file.path = filePath.replace(/\\/g, '/'); // Ensure forward slashes for URL consistency
        
        next();
    } catch (err) {
        res.status(500).json({ success: false, error: 'Image processing failed: ' + err.message });
    }
};

module.exports = { processImage };
