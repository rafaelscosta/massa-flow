import Head from 'next/head';
import { useState, useEffect } from 'react';
import styles from '../styles/Referrals.module.css'; // To be created
import { trackFrontendEvent } from '../lib/frontendAnalytics';

// Hardcoded userId for MVP
const MVP_USER_ID = 'user1';

export default function ReferralsPage() {
  const [referralInfo, setReferralInfo] = useState({ code: '', count: 0 });
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState('');

  const [applyCodeInput, setApplyCodeInput] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMessage, setApplyMessage] = useState({ type: '', text: '' }); // type: 'success' or 'error'

  const fetchReferralInfo = async () => {
    setLoadingInfo(true);
    setInfoError('');
    try {
      const response = await fetch(`/api/referrals/info?userId=${MVP_USER_ID}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao buscar informações de indicação.');
      }
      const data = await response.json();
      setReferralInfo({ code: data.referralCode, count: data.referralsMadeCount });
    } catch (err) {
      setInfoError(err.message);
    } finally {
      setLoadingInfo(false);
    }
  };

  useEffect(() => {
    trackFrontendEvent('screen_viewed', { screen_name: 'referrals_page', userId: MVP_USER_ID });
    fetchReferralInfo();
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralInfo.code)
      .then(() => {
        alert('Código copiado para a área de transferência!');
        trackFrontendEvent('referral_code_copied', { userId: MVP_USER_ID, code: referralInfo.code });
      })
      .catch(err => {
        console.error('Falha ao copiar código:', err);
        alert('Falha ao copiar código. Por favor, copie manualmente.');
      });
  };

  const handleApplyCode = async (e) => {
    e.preventDefault();
    if (!applyCodeInput.trim()) {
      setApplyMessage({ type: 'error', text: 'Por favor, insira um código de indicação.' });
      return;
    }
    setApplyLoading(true);
    setApplyMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/referrals/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: MVP_USER_ID, referralCodeAttempt: applyCodeInput }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Falha ao aplicar o código.');
      }
      setApplyMessage({ type: 'success', text: data.message });
      setApplyCodeInput(''); // Clear input on success
      // Optionally, re-fetch referral info if applying a code could change it (e.g., if user was referred)
      // fetchReferralInfo(); 
      // For this MVP, applying a code mainly benefits the referrer's count, which isn't displayed here for the applying user.
    } catch (err) {
      setApplyMessage({ type: 'error', text: err.message });
    } finally {
      setApplyLoading(false);
    }
  };


  return (
    <div className={styles.container}>
      <Head>
        <title>MassaFlow - Programa de Indicação</title>
        <meta name="description" content="Indique amigos para o MassaFlow e ganhe benefícios!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.pageTitle}>Programa de Indicação MassaFlow</h1>
        
        <section className={styles.section}>
          <h2>Seu Programa de Indicação</h2>
          {loadingInfo && <p>Carregando suas informações...</p>}
          {infoError && <p className={styles.errorText}>{infoError}</p>}
          {!loadingInfo && !infoError && (
            <div className={styles.yourReferralInfo}>
              <p>Compartilhe seu código com amigos e colegas massoterapeutas!</p>
              <div className={styles.referralCodeBox}>
                <span>Seu Código:</span>
                <strong className={styles.referralCode}>{referralInfo.code || 'N/A'}</strong>
                {referralInfo.code && (
                  <button onClick={handleCopyCode} className={styles.copyButton}>Copiar</button>
                )}
              </div>
              <p className={styles.referralCount}>Você já indicou com sucesso: <strong>{referralInfo.count}</strong> {referralInfo.count === 1 ? 'amigo' : 'amigos'}!</p>
            </div>
          )}
          <div className={styles.benefitsInfo}>
            <h3>🎉 Benefícios do Programa 🎉</h3>
            <p>Quando um amigo que você indicou assina um plano pago do MassaFlow:</p>
            <ul>
              <li>✨ <strong>Você ganha:</strong> R$ 50 de desconto na sua próxima fatura!</li>
              <li>✨ <strong>Seu amigo ganha:</strong> R$ 50 de desconto na primeira fatura dele!</li>
            </ul>
            <p><small>(Termos e condições se aplicam. Benefícios simulados para este MVP.)</small></p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Usar Código de Indicação Recebido</h2>
          <p>Se um amigo te indicou o MassaFlow, insira o código dele abaixo para receber seu desconto!</p>
          <form onSubmit={handleApplyCode} className={styles.applyCodeForm}>
            <div className={styles.formGroup}>
              <label htmlFor="applyCode">Código de Indicação</label>
              <input 
                type="text" 
                id="applyCode"
                value={applyCodeInput}
                onChange={(e) => setApplyCodeInput(e.target.value.toUpperCase())} // Codes are uppercase
                placeholder="Ex: MASSAFLOW_XXXXXX"
                className={styles.applyCodeInput}
              />
            </div>
            <button type="submit" disabled={applyLoading} className={styles.applyButton}>
              {applyLoading ? 'Aplicando...' : 'Aplicar Código'}
            </button>
            {applyMessage.text && (
              <p className={applyMessage.type === 'success' ? styles.successText : styles.errorText}>
                {applyMessage.text}
              </p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
