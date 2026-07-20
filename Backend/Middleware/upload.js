const multer = require('multer');

// Use Memory Storage for processing with Sharp
const storage = multer.memoryStorage();

// Check file type
function checkFileType(file, cb) {
    // Allow any image mimetype
    const isImage = file.mimetype.startsWith('image/');

    if (isImage) {
        return cb(null, true);
    } else {
        cb('Error: Only image files are allowed!');
    }
}

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload;
