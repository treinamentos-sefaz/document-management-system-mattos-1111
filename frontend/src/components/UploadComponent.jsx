import { useRef, useState } from 'react';
import { uploadDocument } from '../services/apiClient.js';

const ACCEPTED_EXTENSIONS = '.pdf,.png,.jpg,.docx,.txt';

export default function UploadComponent({ owner, onUploaded }) {
  const formRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!owner) {
      setFeedback({ type: 'error', text: 'Informe o usuário antes de enviar o documento.' });
      return;
    }

    setIsUploading(true);
    setFeedback(null);
    try {
      const metadata = await uploadDocument(file, owner);
      setFeedback({ type: 'success', text: `Documento "${metadata.originalName}" enviado com sucesso.` });
      setFile(null);
      formRef.current.reset();
      onUploaded();
    } catch (error) {
      setFeedback({ type: 'error', text: error.message });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section>
      <h2>Enviar documento</h2>
      <form ref={formRef} onSubmit={handleSubmit}>
        <input
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          disabled={isUploading}
          onChange={(event) => setFile(event.target.files[0] ?? null)}
        />
        <button type="submit" disabled={isUploading || !file}>
          {isUploading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
      {feedback && (
        <p role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.text}</p>
      )}
    </section>
  );
}
