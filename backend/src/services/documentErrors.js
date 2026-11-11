const ERROR_CODES = Object.freeze({
  MISSING_OWNER: 'MISSING_OWNER',
  MISSING_FILE: 'MISSING_FILE',
  UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
});

class DocumentError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'DocumentError';
    this.code = code;
  }
}

module.exports = { DocumentError, ERROR_CODES };
