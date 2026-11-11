// Base /api: o Vite encaminha as chamadas para o backend (ver vite.config.js).
const API_BASE_URL = '/api';

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Erro inesperado ao processar a requisição.');
  }
  return response;
}

function ownerHeaders(owner) {
  return { 'X-User-Id': owner };
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    headers: ownerHeaders(owner),
    body: formData,
  });
  return response.json();
}

export async function listDocuments(owner) {
  const response = await request('/documents', { headers: ownerHeaders(owner) });
  return response.json();
}

export async function downloadDocument(id) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`);
  return response.blob();
}
