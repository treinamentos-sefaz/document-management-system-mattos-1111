import { useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/apiClient.js';

export default function App() {
  const [owner, setOwner] = useState('');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const normalizedOwner = owner.trim();

  useEffect(() => {
    if (!normalizedOwner) {
      setDocuments([]);
      setListError(null);
      return undefined;
    }

    // Ignora respostas antigas quando o usuário muda antes do fim da requisição.
    let ignore = false;
    setIsLoading(true);
    setListError(null);
    listDocuments(normalizedOwner)
      .then((items) => {
        if (!ignore) setDocuments(items);
      })
      .catch((error) => {
        if (!ignore) {
          setDocuments([]);
          setListError(error.message);
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [normalizedOwner, refreshCount]);

  function renderDocuments() {
    if (!normalizedOwner) {
      return <p>Informe o usuário para ver os documentos.</p>;
    }
    if (isLoading) {
      return <p>Carregando documentos...</p>;
    }
    if (listError) {
      return <p role="alert">{listError}</p>;
    }
    return <DocumentList documents={documents} />;
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>Document Management System</h1>

      <label>
        Usuário (X-User-Id):{' '}
        <input
          type="text"
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          placeholder="ex.: usuario-01"
        />
      </label>

      <UploadComponent
        owner={normalizedOwner}
        onUploaded={() => setRefreshCount((count) => count + 1)}
      />

      <section>
        <h2>Meus documentos</h2>
        {renderDocuments()}
      </section>
    </main>
  );
}
