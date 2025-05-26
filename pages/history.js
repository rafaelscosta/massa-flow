import Head from 'next/head';
import { useState, useEffect } from 'react';
import styles from '../styles/History.module.css'; // To be created
// Assuming a fixed userId for MVP frontend simplicity
const MVP_USER_ID = 'user1';

export default function CommunicationHistory() {
  const [clientIdInput, setClientIdInput] = useState('');
  const [currentClientId, setCurrentClientId] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false); // To show "no logs found" only after a search

  const fetchLogs = async (userId, clientId) => {
    if (!userId || !clientId) {
      setError('User ID e Client ID são obrigatórios.');
      setLogs([]);
      setSearched(true);
      return;
    }
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const response = await fetch(`/api/communications?userId=${userId}&clientId=${clientId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError(err.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (clientIdInput.trim()) {
      setCurrentClientId(clientIdInput.trim());
      fetchLogs(MVP_USER_ID, clientIdInput.trim());
    } else {
      setError("Por favor, insira um ID de Cliente.");
      setLogs([]);
      setCurrentClientId('');
      setSearched(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>MassaFlow - Histórico de Comunicação</title>
        <meta name="description" content="Veja o histórico de comunicações com seus clientes" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Histórico de Comunicação</h1>

        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            value={clientIdInput}
            onChange={(e) => setClientIdInput(e.target.value)}
            placeholder="Digite o ID do Cliente (ex: client1)"
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton} disabled={loading}>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}

        {loading && <p>Carregando histórico...</p>}

        {!loading && !error && searched && logs.length === 0 && currentClientId && (
          <p className={styles.noLogs}>Nenhum log de comunicação encontrado para o cliente: {currentClientId}.</p>
        )}
        
        {!loading && logs.length > 0 && (
          <div className={styles.logsContainer}>
            <h2>Histórico para Cliente: {currentClientId}</h2>
            <ul className={styles.logList}>
              {logs.map((log) => (
                <li key={log.id} className={styles.logItem}>
                  <div className={styles.logHeader}>
                    <span className={`${styles.logType} ${styles[log.type.toLowerCase()]}`}>{log.type.replace('_', ' ').toUpperCase()}</span>
                    <span className={styles.logTimestamp}>{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className={styles.logDetails}>
                    <p><strong>Destinatário:</strong> {log.recipientAddress}</p>
                    <p><strong>Status:</strong> <span className={log.status === 'success' ? styles.statusSuccess : styles.statusFailure}>{log.status}</span></p>
                    <p><strong>Preview:</strong> {log.messagePreview}</p>
                    {log.appointmentId && <p><strong>Agendamento ID:</strong> {log.appointmentId}</p>}
                     <p><strong>Método:</strong> {log.method}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
