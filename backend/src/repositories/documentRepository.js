// Metadados dos documentos em memória (perdidos ao reiniciar o processo).
const documents = new Map();

function save(metadata) {
  documents.set(metadata.id, metadata);
  return metadata;
}

function findById(id) {
  return documents.get(id) || null;
}

function findByOwner(owner) {
  return Array.from(documents.values())
    .filter((document) => document.owner === owner)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

module.exports = { save, findById, findByOwner };
