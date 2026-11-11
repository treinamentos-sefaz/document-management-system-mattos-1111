import DownloadButton from './DownloadButton.jsx';

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function DocumentList({ documents }) {
  if (documents.length === 0) {
    return <p>Nenhum documento encontrado.</p>;
  }

  return (
    <ul>
      {documents.map((metadata) => (
        <li key={metadata.id}>
          <strong>{metadata.originalName}</strong>{' '}
          <span>
            ({formatSize(metadata.size)}, enviado em{' '}
            {new Date(metadata.uploadedAt).toLocaleString('pt-BR')})
          </span>{' '}
          <DownloadButton metadata={metadata} />
        </li>
      ))}
    </ul>
  );
}
