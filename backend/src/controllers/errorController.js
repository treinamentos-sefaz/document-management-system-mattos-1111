const { ERROR_CODES, DocumentError } = require('../services/documentErrors');

const STATUS_BY_CODE = {
  [ERROR_CODES.MISSING_OWNER]: 400,
  [ERROR_CODES.MISSING_FILE]: 400,
  [ERROR_CODES.UNSUPPORTED_TYPE]: 415,
  [ERROR_CODES.DOCUMENT_NOT_FOUND]: 404,
  [ERROR_CODES.FILE_NOT_FOUND]: 404,
};

function resolveStatus(error) {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return { status: 413, message: 'Arquivo acima do tamanho máximo permitido.' };
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return { status: 400, message: "Use o campo 'file' para enviar o documento." };
  }
  if (error instanceof DocumentError) {
    return { status: STATUS_BY_CODE[error.code] || 500, message: error.message };
  }
  if (error.code === 'ENOENT') {
    return { status: 404, message: 'Arquivo não encontrado no armazenamento.' };
  }
  if (error.status >= 400 && error.status < 500) {
    return { status: error.status, message: 'Requisição inválida.' };
  }
  return { status: 500, message: 'Erro interno ao processar a requisição.' };
}

// Traduz erros de domínio e de entrada HTTP para respostas JSON `{ error }`.
function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }
  const { status, message } = resolveStatus(error);
  if (status >= 500) {
    console.error(error);
  }
  res.removeHeader('Content-Disposition');
  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
