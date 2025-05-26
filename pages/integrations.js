import Head from 'next/head';
import styles from '../styles/Integrations.module.css';
import { useEffect, useState } from 'react'; // Added useState for managing integrations
import { trackFrontendEvent } from '../lib/frontendAnalytics';

const initialIntegrations = [ // Renamed for clarity
  { id: 'google_calendar', name: 'Google Agenda', status: 'Conectado', logo: '/icons/google-calendar.png' },
  { id: 'whatsapp_business', name: 'WhatsApp Business', status: 'Desconectado', logo: '/icons/whatsapp.png' },
  { id: 'email', name: 'E-mail', status: 'Requer Atenção', logo: '/icons/email.png' },
];

export default function Integrations() {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  // Assuming userId might be available from a global context or session in a real app
  const userId = 'user1'; // Using the same MVP_USER_ID as other pages for consistency
  const [showConnectionPrompt, setShowConnectionPrompt] = useState(false);
  const [error, setError] = useState(''); // For API errors

  useEffect(() => {
    trackFrontendEvent('screen_viewed', { screen_name: 'integrations' }, userId);
    const isAnyToolConnected = integrations.some(tool => tool.status === 'Conectado');
    setShowConnectionPrompt(!isAnyToolConnected);
  }, [userId, integrations]);

  const handleIntegrationToggle = async (toolId, toolName, currentStatus) => {
    setError(''); // Clear previous errors
    const desiredStatus = currentStatus === 'Conectado' ? 'disconnected' : 'connected';

    try {
      const response = await fetch('/api/integrations/toggle-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, toolId, toolName, desiredStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        // If API indicates failure (e.g. simulated email connection failure)
        if (result.task_created) {
          // Task was created for the failure, update UI to reflect actual status
          alert(`Falha ao conectar ${toolName}. Uma tarefa de alerta foi criada para você.`);
        } else {
          alert(result.message || `Erro ao atualizar ${toolName}.`);
        }
         // Update UI to reflect the actual status returned by API, or keep current if error not specific
        const finalStatusForUI = result.status === 'disconnected' ? 'Desconectado' : (result.status === 'connected' ? 'Conectado' : currentStatus);
         setIntegrations(prevIntegrations =>
            prevIntegrations.map(tool =>
              tool.id === toolId ? { ...tool, status: finalStatusForUI } : tool
            )
          );
        setError(result.message || `Falha ao atualizar ${toolName}.`);
        return; // Stop further processing
      }
      
      // Successful update via API
      const updatedIntegrations = integrations.map((integration) =>
        integration.id === toolId ? { ...integration, status: result.status === 'connected' ? 'Conectado' : 'Desconectado' } : integration
      );
      setIntegrations(updatedIntegrations);

      const isAnyToolConnected = updatedIntegrations.some(tool => tool.status === 'Conectado');
      setShowConnectionPrompt(!isAnyToolConnected);
      
      // trackFrontendEvent is already called by the API route now for successful updates
      // But for failed ones handled here, we might want to track differently if not done by API.
      // For MVP, the API tracks failures that generate tasks.

    } catch (err) {
      console.error(`Error toggling integration ${toolId}:`, err);
      setError(`Erro de comunicação ao tentar atualizar ${toolName}.`);
      // Optionally revert UI or show generic error
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>MassaFlow - Minhas Ferramentas</title>
        <meta name="description" content="Gerencie suas integrações com o MassaFlow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Minhas Ferramentas
        </h1>
        <p className={styles.subtitle}>
          Conecte suas ferramentas favoritas para automatizar seu fluxo de trabalho.
        </p>

        <div className={styles.grid}>
          {integrations.map((integration) => (
            <div key={integration.name} className={styles.card}>
              <img src={integration.logo} alt={`${integration.name} logo`} className={styles.logo} />
              <h2>{integration.name}</h2>
              <p className={`${styles.status} ${styles[integration.status.toLowerCase().replace(' ', '').replace('ç', 'c').replace('ê', 'e')]}`}>
                {integration.status}
              </p>
              <button className={styles.button}>
                {integration.status === 'Conectado' ? 'Reconectar' : 'Conectar'}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
