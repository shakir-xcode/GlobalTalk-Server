const multer = require('multer');

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/images/');
    },
    filename: (req, file, cb) => {
        const fileName = Date.now() + '-' + file.originalname;
        req.body.fileName = fileName;
        req.body.mimetype = file.mimetype;
        cb(null, fileName);
    }
});

// Create the multer instance
const upload = multer({ storage: storage });

module.exports = upload;