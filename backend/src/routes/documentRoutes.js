const express = require('express');
const fileRepository = require('../repositories/fileRepository');
const documentController = require('../controllers/documentController');

const router = express.Router();

router.post('/upload', fileRepository.uploadSingleFile, documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = router;
