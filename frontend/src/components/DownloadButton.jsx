import { useState } from 'react';
import { downloadDocument } from '../services/apiClient.js';

export default function DownloadButton({ metadata }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick() {
    setIsDownloading(true);
    setError(null);
    try {
      const blob = await downloadDocument(metadata.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = metadata.originalName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={isDownloading}>
        {isDownloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && <span role="alert"> {error}</span>}
    </>
  );
}
