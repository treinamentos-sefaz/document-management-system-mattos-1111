const path = require('node:path');

const BYTES_PER_MB = 1024 * 1024;
const DEFAULT_MAX_UPLOAD_SIZE_MB = 10;

module.exports = {
  storageDir: path.resolve(process.env.STORAGE_DIR || path.join(__dirname, '..', 'storage')),
  maxUploadSizeBytes:
    Number(process.env.MAX_UPLOAD_SIZE_MB || DEFAULT_MAX_UPLOAD_SIZE_MB) * BYTES_PER_MB,
};
