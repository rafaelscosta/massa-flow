import Head from 'next/head';
import { useState, useEffect } from 'react';
import styles from '../styles/Account.module.css'; // To be created
import { trackFrontendEvent } from '../lib/frontendAnalytics';
import Link from 'next/link';

// Hardcoded userId for MVP
const MVP_USER_ID = 'user1';

export default function AccountPage() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationMessage, setCancellationMessage] = useState('');

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/billing/subscription-status?userId=${MVP_USER_ID}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error fetching subscription status: ${response.status}`);
      }
      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      console.error("Failed to fetch subscription status:", err);
      setError(err.message);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    trackFrontendEvent('screen_viewed', { screen_name: 'account_page', userId: MVP_USER_ID });
    fetchSubscriptionStatus();

    // Listen for global subscription updates (e.g., after successful payment on pricing page)
    const handleSubscriptionUpdate = () => {
        console.log("AccountPage: Detected subscription_updated event. Refetching status.");
        fetchSubscriptionStatus();
    };
    window.addEventListener('subscription_updated', handleSubscriptionUpdate);

    return () => {
        window.removeEventListener('subscription_updated', handleSubscriptionUpdate);
    };

  }, []);

  const handleCancelSubscription = async () => {
    if (!window.confirm("Tem certeza que deseja cancelar sua assinatura? Esta ação não pode ser desfeita e o cancelamento será efetivo ao final do período de cobrança atual.")) {
      return;
    }

    setIsCancelling(true);
    setCancellationMessage('');
    setError('');

    try {
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: MVP_USER_ID }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Falha ao cancelar assinatura.');
      }
      
      setCancellationMessage('Sua assinatura foi cancelada com sucesso. As alterações serão refletidas em breve, ou ao final do período de cobrança.');
      // The webhook will eventually update the DB. For immediate UI update:
      setSubscription(prev => ({ ...prev, status: 'cancelled' })); // Optimistic UI update
      trackFrontendEvent('subscription_cancelled_by_user', { userId: MVP_USER_ID, subscriptionId: subscription?.stripeSubscriptionId });

    } catch (err) {
      console.error("Failed to cancel subscription:", err);
      setError(err.message || 'Ocorreu um erro ao cancelar a assinatura.');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusDisplayName = (status) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'inactive': return 'Inativa';
      case 'cancelled': return 'Cancelada';
      case 'past_due': return 'Pagamento Pendente';
      case 'incomplete': return 'Incompleta (requer ação)';
      default: return status;
    }
  };

  const getTierDisplayName = (tier) => {
    if (!tier) return 'N/A';
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>MassaFlow - Minha Conta</title>
        <meta name="description" content="Gerencie sua assinatura e dados da conta MassaFlow." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.pageTitle}>Minha Conta</h1>

        {loading && <p>Carregando dados da assinatura...</p>}
        {error && <p className={styles.error}>{error}</p>}
        
        {cancellationMessage && <p className={styles.successMessage}>{cancellationMessage}</p>}

        {!loading && !error && subscription && (
          <div className={styles.subscriptionInfo}>
            <h2>Detalhes da Assinatura</h2>
            <p><strong>Plano Atual:</strong> {getTierDisplayName(subscription.tier)}</p>
            <p><strong>Status:</strong> <span className={`${styles.statusBadge} ${styles['status_' + subscription.status]}`}>{getStatusDisplayName(subscription.status)}</span></p>
            
            {subscription.stripeCustomerId && <p><strong>ID de Cliente Stripe:</strong> <code>{subscription.stripeCustomerId}</code></p>}
            {subscription.stripeSubscriptionId && <p><strong>ID de Assinatura Stripe:</strong> <code>{subscription.stripeSubscriptionId}</code></p>}

            {(subscription.status === 'active' || subscription.status === 'past_due') && (
              <button 
                onClick={handleCancelSubscription} 
                disabled={isCancelling}
                className={styles.cancelButton}
              >
                {isCancelling ? 'Cancelando...' : 'Cancelar Assinatura'}
              </button>
            )}
            {subscription.status === 'cancelled' && (
              <p className={styles.infoMessage}>Sua assinatura está cancelada e não será renovada.</p>
            )}
            {subscription.status === 'incomplete' && (
              <p className={styles.warningMessage}>
                Sua assinatura está incompleta. Por favor, <Link href="/pricing">retorne à página de planos</Link> para completar o pagamento ou contate o suporte.
              </p>
            )}
             {(subscription.tier === 'free' || subscription.status === 'inactive' || subscription.status === 'cancelled') && subscription.status !== 'incomplete' && (
                <Link href="/pricing" legacyBehavior><a className={styles.upgradeButton}>Ver Planos e Assinar</a></Link>
            )}
          </div>
        )}
         {!loading && !error && !subscription && (
            <p>Não foi possível carregar os dados da sua assinatura.</p>
        )}
      </main>
    </div>
  );
}
