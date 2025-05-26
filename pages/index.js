import Head from 'next/head';
import styles from '../styles/Dashboard.module.css';
import { useEffect } from 'react';
import { trackFrontendEvent } from '../lib/frontendAnalytics';

export default function Dashboard() {
  useEffect(() => {
    // Assuming userId might be available from a global context or session in a real app
    // For MVP, we'll use the default 'anonymous_user_mvp' or pass a placeholder if needed
    trackFrontendEvent('screen_viewed', { screen_name: 'dashboard' /* , userId: 'user123_mvp' */ });
  }, []);

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

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Taxa de Presença</h2>
            <p>vs. mês anterior</p>
            <div className={styles.metricPlaceholder}>
              <span>+5%</span>
            </div>
          </div>

          <div className={styles.card}>
            <h2>Receita Adicional Gerada</h2>
            <p>pela plataforma</p>
            <div className={styles.metricPlaceholder}>
              <span>R$ 1.250,00</span>
            </div>
          </div>

          <div className={styles.card}>
            <h2>Tempo Administrativo Economizado</h2>
            <p>horas / mês</p>
            <div className={styles.metricPlaceholder}>
              <span>10 horas</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
