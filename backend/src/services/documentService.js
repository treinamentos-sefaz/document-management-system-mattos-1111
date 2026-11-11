const path = require('node:path');
const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');
const fileRepository = require('../repositories/fileRepository');
const { DocumentError, ERROR_CODES } = require('./documentErrors');

// Extensão -> MIME types aceitos. O upload precisa atender aos dois critérios.
const ALLOWED_TYPES = {
  pdf: ['application/pdf'],
  png: ['image/png'],
  jpg: ['image/jpeg', 'image/jpg'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  txt: ['text/plain'],
};

function normalizeOwner(owner) {
  const normalized = typeof owner === 'string' ? owner.trim() : '';
  if (!normalized) {
    throw new DocumentError(ERROR_CODES.MISSING_OWNER, 'O cabeçalho X-User-Id é obrigatório.');
  }
  return normalized;
}

function isAllowedType(originalName, mimeType) {
  const extension = path.extname(originalName).slice(1).toLowerCase();
  const allowedMimeTypes = ALLOWED_TYPES[extension];
  return Boolean(allowedMimeTypes) && allowedMimeTypes.includes(mimeType);
}

function toPublicMetadata({ storedName, ...metadata }) {
  return metadata;
}

// Remove o arquivo já gravado pelo multer quando a requisição é rejeitada.
async function discardFile(file) {
  if (file) {
    await fileRepository.remove(file.filename);
  }
}

async function createDocument({ file, owner }) {
  try {
    const normalizedOwner = normalizeOwner(owner);
    if (!file) {
      throw new DocumentError(ERROR_CODES.MISSING_FILE, "O campo 'file' é obrigatório.");
    }
    if (!isAllowedType(file.originalname, file.mimetype)) {
      throw new DocumentError(
        ERROR_CODES.UNSUPPORTED_TYPE,
        'Tipo de arquivo não permitido. Use pdf, png, jpg, docx ou txt.'
      );
    }

    const metadata = documentRepository.save({
      id: randomUUID(),
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner: normalizedOwner,
    });
    return toPublicMetadata(metadata);
  } catch (error) {
    await discardFile(file);
    throw error;
  }
}

function listDocumentsByOwner(owner) {
  const normalizedOwner = normalizeOwner(owner);
  return documentRepository.findByOwner(normalizedOwner).map(toPublicMetadata);
}

// RN-03: o download não verifica dono nesta fase.
async function getDownloadInfo(id) {
  const metadata = documentRepository.findById(id);
  if (!metadata) {
    throw new DocumentError(ERROR_CODES.DOCUMENT_NOT_FOUND, 'Documento não encontrado.');
  }
  if (!(await fileRepository.exists(metadata.storedName))) {
    throw new DocumentError(ERROR_CODES.FILE_NOT_FOUND, 'Arquivo não encontrado no armazenamento.');
  }
  return {
    filePath: fileRepository.resolvePath(metadata.storedName),
    originalName: metadata.originalName,
    mimeType: metadata.mimeType,
  };
}

module.exports = { createDocument, listDocumentsByOwner, getDownloadInfo };
