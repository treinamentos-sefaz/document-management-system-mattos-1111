const documentService = require('../services/documentService');

async function upload(req, res) {
  const metadata = await documentService.createDocument({
    file: req.file,
    owner: req.get('X-User-Id'),
  });
  res.status(201).json(metadata);
}

function list(req, res) {
  const documents = documentService.listDocumentsByOwner(req.get('X-User-Id'));
  res.json(documents);
}

async function download(req, res) {
  const { filePath, originalName, mimeType } = await documentService.getDownloadInfo(req.params.id);
  res.attachment(originalName);
  res.setHeader('Content-Type', mimeType);
  await res.sendFile(filePath);
}

module.exports = { upload, list, download };
