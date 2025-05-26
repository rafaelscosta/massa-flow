import Head from 'next/head';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import styles from '../styles/Pricing.module.css'; // To be created
import { trackFrontendEvent } from '../lib/frontendAnalytics';

// Hardcoded userId for MVP
const MVP_USER_ID = 'user1'; // Assume this user exists in your db.js
// Placeholder for Stripe Publishable Key (user needs to set this in .env.local)
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_PLACEHOLDER_MISSING_ENV_VAR';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Placeholder Price IDs (user needs to set these in .env.local, matching their Stripe setup)
const PRICE_IDS = {
  essencial: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ESSENCIAL || 'price_essencial_placeholder',
  profissional: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PROFISSIONAL || 'price_profissional_placeholder',
  premium: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM || 'price_premium_placeholder',
};

const plans = [
  {
    id: 'essencial',
    name: 'MassaFlow Essencial',
    price: 'R$ 97',
    priceSuffix: '/mês',
    features: ['Gestão de Clientes Básica', 'Agendamentos Manuais', '1 Automação (Lembrete)', 'Suporte por Email'],
    stripePriceId: PRICE_IDS.essencial,
  },
  {
    id: 'profissional',
    name: 'MassaFlow Profissional',
    price: 'R$ 197',
    priceSuffix: '/mês',
    features: ['Tudo do Essencial', 'Múltiplas Automações', 'Histórico de Comunicação', 'Intelligence Engine Básico', 'Suporte Prioritário'],
    stripePriceId: PRICE_IDS.profissional,
    recommended: true,
  },
  {
    id: 'premium',
    name: 'MassaFlow Premium',
    price: 'R$ 397',
    priceSuffix: '/mês',
    features: ['Tudo do Profissional', 'Alertas Avançados', 'Relatórios Detalhados (futuro)', 'API de Integração (futuro)', 'Suporte VIP'],
    stripePriceId: PRICE_IDS.premium,
  },
];

const CheckoutForm = ({ selectedPlan, onSubscriptionResult }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Step 1: Create a subscription on your backend
      const createSubResponse = await fetch('/api/billing/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: MVP_USER_ID,
          stripePriceId: selectedPlan.stripePriceId,
          userEmail: `user1_mvp@example.com`, // Fetch or pass real user email
        }),
      });

      const subData = await createSubResponse.json();

      if (!createSubResponse.ok) {
        throw new Error(subData.message || 'Falha ao criar assinatura.');
      }

      trackFrontendEvent('subscription_creation_attempted', {
        userId: MVP_USER_ID,
        plan: selectedPlan.id,
        stripePriceId: selectedPlan.stripePriceId,
      });
      
      const { clientSecret, subscriptionId, status } = subData;

      if (status === 'active' || status === 'trialing') {
        // No payment needed or trial started successfully
        console.log('Subscription active without immediate payment:', subscriptionId);
        onSubscriptionResult({ success: true, plan: selectedPlan.id, status });
        setIsLoading(false);
        return;
      }
      
      if (!clientSecret) {
        throw new Error('Client secret não recebido do backend.');
      }

      // Step 2: Confirm the payment with Stripe Elements
      const cardElement = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            // Ideally, collect name and email from a form
            name: `Usuário ${MVP_USER_ID}`, 
            email: `user1_mvp@example.com`,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        trackFrontendEvent('subscription_payment_failed', {
            userId: MVP_USER_ID,
            plan: selectedPlan.id,
            error: error.message,
        });
        onSubscriptionResult({ success: false, error: error.message });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        trackFrontendEvent('subscription_payment_succeeded', {
            userId: MVP_USER_ID,
            plan: selectedPlan.id,
            paymentIntentId: paymentIntent.id,
        });
        onSubscriptionResult({ success: true, plan: selectedPlan.id, status: 'active' });
      } else {
        // Handle other payment intent statuses if necessary
        setErrorMessage('Pagamento não foi bem-sucedido. Status: ' + paymentIntent?.status);
        onSubscriptionResult({ success: false, error: 'Pagamento não foi bem-sucedido.' });
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setErrorMessage(err.message || 'Ocorreu um erro inesperado.');
      onSubscriptionResult({ success: false, error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.checkoutForm}>
      <h4>Assinando: {selectedPlan.name} ({selectedPlan.price}{selectedPlan.priceSuffix})</h4>
      <CardElement options={{ style: { base: { fontSize: '16px' }}}} />
      {errorMessage && <div className={styles.paymentError}>{errorMessage}</div>}
      <button type="submit" disabled={!stripe || isLoading} className={styles.payButton}>
        {isLoading ? 'Processando...' : `Pagar e Assinar ${selectedPlan.price}`}
      </button>
    </form>
  );
};


export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState(null); // Plan object
  const [subscriptionOutcome, setSubscriptionOutcome] = useState(null); // { success: bool, error?: string, plan?: string, status?: string }

  useEffect(() => {
    trackFrontendEvent('screen_viewed', { screen_name: 'pricing_page' }, MVP_USER_ID);
    if (STRIPE_PUBLISHABLE_KEY === 'pk_test_PLACEHOLDER_MISSING_ENV_VAR') {
        alert("AVISO: Chave publicável do Stripe não configurada. A funcionalidade de pagamento não funcionará. Veja o console para detalhes.");
        console.warn("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in .env.local. Please add it.");
    }
    plans.forEach(plan => {
        if (plan.stripePriceId.includes('_placeholder')) {
            alert(`AVISO: Price ID do Stripe para o plano "${plan.name}" não configurado. A funcionalidade de pagamento para este plano não funcionará. Veja o console para detalhes.`);
            console.warn(`NEXT_PUBLIC_STRIPE_PRICE_ID_${plan.id.toUpperCase()} is not set in .env.local. Please add it.`);
        }
    });
  }, []);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setSubscriptionOutcome(null); // Clear previous outcome
    trackFrontendEvent('plan_selected', { userId: MVP_USER_ID, plan: plan.id });
  };

  const handleSubscriptionResult = (result) => {
    setSubscriptionOutcome(result);
    if (result.success) {
      setSelectedPlan(null); // Clear selection and hide form on success
      // In a real app, you might refetch user's subscription status here
      // and redirect or update UI more significantly.
      alert(`Assinatura do plano ${result.plan} ${result.status === 'active' ? 'ativada' : 'iniciada'} com sucesso!`);
      // Trigger global subscription status update if using React Context or similar
      window.dispatchEvent(new CustomEvent('subscription_updated'));
    } else {
      alert(`Falha na assinatura: ${result.error || 'Erro desconhecido'}`);
    }
  };

  if (subscriptionOutcome && subscriptionOutcome.success) {
    return (
      <div className={styles.container}>
        <Head><title>MassaFlow - Assinatura</title></Head>
        <main className={styles.main}>
          <h1 className={styles.pageTitle}>Assinatura Confirmada!</h1>
          <div className={styles.confirmationMessage}>
            <p>Parabéns! Sua assinatura do plano <strong>{subscriptionOutcome.plan}</strong> está agora {subscriptionOutcome.status === 'active' ? 'ativa' : 'sendo processada'}.</p>
            <p>Você pode gerenciar sua assinatura na <Link href="/account">sua conta</Link>.</p>
            <Link href="/" legacyBehavior><a className={styles.button}>Voltar ao Painel</a></Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>MassaFlow - Planos e Preços</title>
        <meta name="description" content="Escolha o plano MassaFlow ideal para você." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.pageTitle}>Nossos Planos</h1>
        <p className={styles.pageSubtitle}>
          Comece de graça e evolua conforme sua prática cresce. Cancele quando quiser.
        </p>

        <div className={styles.plansGrid}>
          {plans.map((plan) => (
            <div key={plan.id} className={`${styles.planCard} ${plan.recommended ? styles.recommended : ''}`}>
              {plan.recommended && <div className={styles.recommendedBadge}>MAIS POPULAR</div>}
              <h2>{plan.name}</h2>
              <div className={styles.priceContainer}>
                <span className={styles.price}>{plan.price}</span>
                <span className={styles.priceSuffix}>{plan.priceSuffix}</span>
              </div>
              <ul className={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              <button onClick={() => handleSelectPlan(plan)} className={styles.button}>
                Assinar Agora
              </button>
            </div>
          ))}
        </div>

        {selectedPlan && (
          <div className={styles.checkoutModal}> {/* Simple modal-like section */}
            <div className={styles.checkoutModalContent}>
              <button onClick={() => { setSelectedPlan(null); setSubscriptionOutcome(null);}} className={styles.closeModalButton}>X</button>
              <Elements stripe={stripePromise}>
                <CheckoutForm selectedPlan={selectedPlan} onSubscriptionResult={handleSubscriptionResult} />
              </Elements>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
