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
  const userId = 'user123_mvp'; // Placeholder for MVP

  useEffect(() => {
    trackFrontendEvent('screen_viewed', { screen_name: 'integrations' }, userId);
  }, [userId]);

  const handleIntegrationToggle = (toolId, currentStatus) => {
    // Simulate toggling connection status
    const newStatus = currentStatus === 'Conectado' ? 'Desconectado' : 'Conectado';
    setIntegrations(
      integrations.map((integration) =>
        integration.id === toolId ? { ...integration, status: newStatus } : integration
      )
    );

    trackFrontendEvent(
      'tool_connection_updated',
      { tool_name: toolId, status: newStatus.toLowerCase() }, // ensure status is 'connected' or 'disconnected'
      userId
    );
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
