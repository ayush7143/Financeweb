const express = require('express');
const router = express.Router();
const multer = require('multer');
const { handleExcelUpload } = require('../controllers/excelController');

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            cb(null, true);
        } else {
            cb(new Error('Only .xlsx files are allowed'));
        }
    }
});

router.post('/upload', upload.single('file'), handleExcelUpload);

module.exports = router;
