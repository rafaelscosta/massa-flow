import Head from 'next/head';
import styles from '../styles/Automations.module.css';
import { useState, useEffect } from 'react'; // Added useEffect
import { trackFrontendEvent } from '../lib/frontendAnalytics';

const initialAutomations = [
  { 
    id: 'confirm_24h', // Using string IDs consistent with backend/templates
    name: 'Confirmação de consulta 24h antes', 
    description: 'Envia um lembrete automático para o cliente confirmar a consulta agendada.',
    isActive: true, 
    // settings: { time: '10:00', message: 'Olá [Cliente], sua consulta amanhã às [Horário] está confirmada?' } 
  },
  { 
    id: 'reminder_1h', 
    name: 'Lembrete de chegada 1h antes', 
    description: 'Envia um lembrete amigável pouco antes do horário da consulta.',
    isActive: true, 
    // settings: { time: '09:00', message: 'Olá [Cliente], lembre-se da sua consulta hoje às [Horário]. Estamos te esperando!' } 
  },
  { 
    id: 'follow_up_24h', 
    name: 'Follow-up pós-sessão 24h depois', 
    description: 'Envia uma mensagem de acompanhamento para saber como o cliente está se sentindo.',
    isActive: false, 
    // settings: { time: '14:00', message: 'Olá [Cliente], como você está se sentindo após a sessão de ontem?' } 
  },
];

export default function Automations() {
  const [automations, setAutomations] = useState(initialAutomations);
  // Assuming userId might be available from a global context or session in a real app
  const userId = 'user123_mvp'; // Placeholder for MVP

  useEffect(() => {
    trackFrontendEvent('screen_viewed', { screen_name: 'automations' }, userId);
  }, [userId]);

  const toggleAutomation = (automationId, currentStatus, routineName) => {
    const newStatus = !currentStatus;
    setAutomations(
      automations.map((automation) =>
        automation.id === automationId ? { ...automation, isActive: newStatus } : automation
      )
    );
    trackFrontendEvent(
      'routine_status_changed',
      { routine_name: routineName, status: newStatus ? 'activated' : 'deactivated', context: 'automations_page' },
      userId
    );
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>MassaFlow - Rotinas de Atendimento</title>
        <meta name="description" content="Gerencie suas rotinas de atendimento automatizadas no MassaFlow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Rotinas de Atendimento
        </h1>
        <p className={styles.subtitle}>
          Automatize tarefas repetitivas e melhore a experiência dos seus clientes.
        </p>

        <div className={styles.automationsList}>
          {automations.map((automation) => (
            <div key={automation.id} className={styles.automationCard}>
              <div className={styles.automationHeader}>
                <h2>{automation.name}</h2>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    checked={automation.isActive}
                    onChange={() => toggleAutomation(automation.id)}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              <p className={styles.description}>{automation.description}</p>
              <div className={styles.placeholders}>
                <button className={styles.placeholderButton}>Editar Horário</button>
                <button className={styles.placeholderButton}>Editar Mensagem</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
