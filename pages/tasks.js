import Head from 'next/head';
import { useState, useEffect } from 'react';
import styles from '../styles/Tasks.module.css';
import { trackFrontendEvent } from '../lib/frontendAnalytics';
import { useRouter } from 'next/router'; // To redirect
import Link from 'next/link'; // For linking to pricing

// Hardcoded userId for MVP
const MVP_USER_ID = 'user1';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchSubscriptionAndTasks() {
      setLoadingSubscription(true);
      try {
        const subResponse = await fetch(`/api/billing/subscription-status?userId=${MVP_USER_ID}`);
        if (!subResponse.ok) throw new Error('Falha ao buscar status da assinatura.');
        const subData = await subResponse.json();
        setSubscriptionStatus(subData);

        if (subData.tier === 'free' || subData.status !== 'active') {
          // For MVP, allow 'essencial' to access tasks as well, or make it truly premium
          // Let's say 'profissional' or 'premium' are required
          if (subData.tier !== 'profissional' && subData.tier !== 'premium') {
            trackFrontendEvent('paywall_triggered', { 
                userId: MVP_USER_ID, 
                feature: 'tasks_page', 
                current_tier: subData.tier 
            });
            // Redirect or show paywall message - for now, just block loading tasks
            setLoading(false); // Stop tasks loading
            setLoadingSubscription(false);
            return; // Exit early
          }
        }
        // If subscription is adequate, load tasks
        await fetchTasks();
      } catch (err) {
        console.error("Error checking subscription or fetching tasks:", err);
        setError(err.message);
        setTasks([]);
      } finally {
        setLoadingSubscription(false);
        // setLoading(false); // fetchTasks will set this
      }
    }
    
    trackFrontendEvent('screen_viewed', { screen_name: 'tasks_page', userId: MVP_USER_ID });
    fetchSubscriptionAndTasks();

  }, []); // Removed fetchTasks from here as it's called conditionally

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks?userId=${MVP_USER_ID}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error fetching tasks: ${response.status}`);
      }
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError(err.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };


  const handleMarkAsRead = async (taskId) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: MVP_USER_ID, status: 'read' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update task status');
      }
      
      // Update local state and dispatch event for header update
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: 'read', updatedAt: new Date().toISOString() } : task
        )
      );
      window.dispatchEvent(new CustomEvent('task_updated')); // Notify header
      
    } catch (err) {
      console.error(`Error marking task ${taskId} as read:`, err);
      alert(`Erro ao marcar tarefa como lida: ${err.message}`);
    }
  };
  
  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'all') return true;
    return task.status === filterStatus;
  });

  const getTaskTypeDisplayName = (type) => {
    switch (type) {
      case 'no_show_risk_alert': return 'ALERTA: RISCO DE NO-SHOW';
      case 'tool_connection_failed': return 'ALERTA: FALHA DE CONEXÃO';
      case 'low_attendance_rate_alert': return 'ALERTA: TAXA DE PRESENÇA BAIXA';
      default: return type.toUpperCase().replace(/_/g, ' ');
    }
  };


  return (
    <div className={styles.container}>
      <Head>
        <title>MassaFlow - Minhas Tarefas</title>
        <meta name="description" content="Suas tarefas e alertas importantes no MassaFlow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Minhas Tarefas</h1>

        <div className={styles.filterControls}>
          <button onClick={() => setFilterStatus('all')} className={filterStatus === 'all' ? styles.activeFilter : ''}>Todas</button>
          <button onClick={() => setFilterStatus('new')} className={filterStatus === 'new' ? styles.activeFilter : ''}>Novas</button>
          <button onClick={() => setFilterStatus('read')} className={filterStatus === 'read' ? styles.activeFilter : ''}>Lidas</button>
        </div>

        {loading && <p>Carregando tarefas...</p>}
        {error && <p className={styles.error}>Erro ao carregar tarefas: {error}</p>}

        {!loading && !error && filteredTasks.length === 0 && (
          <p className={styles.noTasks}>
            {filterStatus === 'all' && "Nenhuma tarefa pendente no momento. Bom trabalho! 👍"}
            {filterStatus === 'new' && "Nenhuma tarefa nova. Tudo em dia! 🎉"}
            {filterStatus === 'read' && "Nenhuma tarefa marcada como lida ainda."}
          </p>
        )}

        {!loading && !error && filteredTasks.length > 0 && (
          <div className={styles.tasksList}>
            {filteredTasks.map((task) => (
              <div key={task.id} className={`${styles.taskCard} ${styles[task.type + '_border'] || styles.default_border} ${styles['status_' + task.status]}`}>
                <div className={styles.taskHeader}>
                  {/* Simple icon placeholders - replace with actual icons/images later */}
                  <span className={styles.taskIcon}>
                    {task.type === 'no_show_risk_alert' && '⚠️'}
                    {task.type === 'tool_connection_failed' && '🔌❗'}
                    {task.type === 'low_attendance_rate_alert' && '📉'}
                  </span>
                  <span className={`${styles.taskType} ${styles[task.type] || styles.defaultType}`}>
                    {getTaskTypeDisplayName(task.type)}
                  </span>
                  <span className={`${styles.taskStatus} ${styles['status_badge_' + task.status]}`}>{task.status.toUpperCase()}</span>
                </div>
                <p className={styles.taskMessage}>{task.message}</p>
                <div className={styles.taskFooter}>
                  <small>Criada: {new Date(task.createdAt).toLocaleString('pt-BR')}</small>
                  {task.updatedAt && <small>Atualizada: {new Date(task.updatedAt).toLocaleString('pt-BR')}</small>}
                  {task.appointmentId && <small>Agendamento: {task.appointmentId}</small>}
                  {task.clientId && <small>Cliente: {task.clientId}</small>}
                  {task.relatedEntityId && !task.appointmentId && !task.clientId && <small>Ref: {task.relatedEntityId}</small>}
                </div>
                {task.status === 'new' && (
                  <button 
                    onClick={() => handleMarkAsRead(task.id)} 
                    className={styles.markAsReadButton}
                  >
                    Marcar como Lida
                  </button>
                )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
