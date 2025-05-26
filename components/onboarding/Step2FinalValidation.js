import styles from '../../styles/Onboarding.module.css'; // Shared onboarding styles
import Link from 'next/link'; // For linking to other pages

export default function Step2FinalValidation({ practiceType }) {
  let practiceTypeDisplay = "Sua Prática";
  if (practiceType === 'autonomo') practiceTypeDisplay = "Profissional Autônomo";
  else if (practiceType === 'clinica') practiceTypeDisplay = "Clínica/Centro de Estética";
  else if (practiceType === 'spa') practiceTypeDisplay = "Spa/Hotel";

  return (
    <>
      <div className={styles.rocketIcon}>🎉</div> {/* Changed icon */}
      <h2 className={styles.stepTitle}>Configuração Inicial Concluída!</h2>
      <p className={styles.stepSubtitle}>
        O essencial para começar com o MassaFlow está pronto. Personalizamos algumas configurações para {practiceTypeDisplay}.
      </p>
      <div className={styles.summaryBox}> {/* New class for a summary box */}
        <p><strong>O que fizemos por você:</strong></p>
        <ul>
          <li>Ativamos automaticamente as rotinas de <strong>confirmação (24h antes)</strong> e <strong>lembrete (1h antes)</strong>.</li>
          <li>Preparamos sugestões de mensagens com base no seu tipo de prática.</li>
        </ul>
        <p><strong>Próximos passos recomendados (no seu tempo):</strong></p>
        <ul>
          <li>
            <Link href="/integrations" legacyBehavior><a>Conecte suas ferramentas</a></Link> (como Google Agenda) para automatizar seus agendamentos.
          </li>
          <li>
            <Link href="/automations" legacyBehavior><a>Explore e personalize suas rotinas</a></Link>, incluindo follow-ups e mensagens específicas.
          </li>
        </ul>
      </div>
      <p className={styles.stepSubtitle} style={{ marginTop: '1.5rem' }}>
        Clique no botão abaixo para acessar seu painel e começar a explorar!
      </p>
    </>
  );
}
