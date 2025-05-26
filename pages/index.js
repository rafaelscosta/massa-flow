import Head from 'next/head';
import styles from '../styles/Dashboard.module.css';
import { useEffect, useState } from 'react'; // Added useState
import { trackFrontendEvent } from '../lib/frontendAnalytics';

// Hardcoded userId for MVP
const MVP_USER_ID = 'user1';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    trackFrontendEvent('screen_viewed', { screen_name: 'dashboard', userId: MVP_USER_ID });

    async function fetchMetrics() {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`/api/dashboard-metrics?userId=${MVP_USER_ID}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error fetching metrics: ${response.status}`);
        }
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error("Failed to fetch dashboard metrics:", err);
        setError(err.message);
        setMetrics(null); // Clear previous metrics on error
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []); // Empty dependency array ensures this runs once on mount

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'R$ 0,00';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatPercentage = (value) => {
    if (typeof value !== 'number') return '0%';
    return `${(value * 100).toFixed(0)}%`; // No decimal places for percentage
  };

  const formatHours = (value) => {
    if (typeof value !== 'number') return '0 horas';
    return `${value.toFixed(1)} horas`; // One decimal place for hours
  };


  return (
    <div className={styles.container}>
      <Head>
        <title>MassaFlow - Dashboard</title>
        <meta name="description" content="Painel de Resultados do MassaFlow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Painel de Resultados
        </h1>

        {loading && <p>Carregando métricas...</p>}
        {error && <p className={styles.error}>Erro ao carregar métricas: {error}</p>}

        {!loading && !error && metrics && (
          <div className={styles.grid}>
            <div className={styles.card}>
              <h2>Taxa de Presença</h2>
              <p>Total de atendimentos</p> {/* Updated subtitle */}
              <div className={styles.metricValue}> {/* Changed class for clarity */}
                <span>{formatPercentage(metrics.attendanceRate)}</span>
              </div>
            </div>

            <div className={styles.card}>
              <h2>Receita Total Gerada</h2> {/* Updated title */}
              <p>Soma de consultas 'attended'</p> {/* Updated subtitle */}
              <div className={styles.metricValue}>
                <span>{formatCurrency(metrics.totalRevenueGenerated)}</span>
              </div>
            </div>

            <div className={styles.card}>
              <h2>Tempo Admin. Economizado</h2> {/* Updated title */}
              <p>Estimativa via automações</p> {/* Updated subtitle */}
              <div className={styles.metricValue}>
                <span>{formatHours(metrics.adminTimeSavedHours)}</span>
              </div>
            </div>
          </div>
        )}
        {!loading && !error && !metrics && (
           <p>Nenhuma métrica para exibir.</p>
        )}

        {/* Próximos Passos Recomendados Section */}
        {!loading && ( // Show this section once main metrics loading is done, regardless of metrics presence
          <div className={styles.nextStepsSection}>
            <h2>Próximos Passos Recomendados</h2>
            <div className={styles.nextStepsGrid}>
              <Link href="/integrations" legacyBehavior>
                <a className={styles.nextStepCard}>
                  <h3>🔗 Conecte suas Ferramentas</h3>
                  <p>Integre sua agenda (Google Agenda) para automatizar agendamentos e comunicações.</p>
                </a>
              </Link>
              <Link href="/automations" legacyBehavior>
                <a className={styles.nextStepCard}>
                  <h3>⚙️ Explore e Personalize Rotinas</h3>
                  <p>Ajuste as mensagens, ative follow-ups e crie novas automações para seu fluxo de trabalho.</p>
                </a>
              </Link>
              {/* Add more recommended steps as needed */}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
