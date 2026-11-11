const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const config = require('../config');

// O nome gravado é gerado pelo servidor e não usa o nome enviado pelo cliente.
const diskStorage = multer.diskStorage({
  destination: config.storageDir,
  filename: (req, file, callback) => callback(null, randomUUID()),
});

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: config.maxUploadSizeBytes, files: 1 },
});

function resolvePath(storedName) {
  return path.join(config.storageDir, storedName);
}

async function exists(storedName) {
  try {
    await fs.access(resolvePath(storedName));
    return true;
  } catch {
    return false;
  }
}

async function remove(storedName) {
  await fs.unlink(resolvePath(storedName)).catch(() => {});
}

module.exports = {
  uploadSingleFile: upload.single('file'),
  resolvePath,
  exists,
  remove,
};
