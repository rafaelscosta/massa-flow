import styles from '../../styles/Onboarding.module.css'; // Shared onboarding styles

export default function Step4Validation({ data }) {
  // Placeholder values for MVP
  const hoursSaved = 10;
  const noShowReduction = 15;

  let personalizedMessage = "O MassaFlow está pronto para otimizar sua rotina e ajudar você a alcançar seus objetivos!";

  if (data.objectives && data.objectives.length > 0) {
    personalizedMessage = "Com base nos seus objetivos, o MassaFlow pode te ajudar a ";
    const messages = [];
    if (data.objectives.includes('save_time')) {
      messages.push(`economizar aproximadamente ${hoursSaved} horas por semana`);
    }
    if (data.objectives.includes('reduce_noshows')) {
      messages.push(`reduzir no-shows em até ${noShowReduction}%`);
    }
    if (data.objectives.includes('increase_revenue')) {
      messages.push(`aumentar sua receita por cliente`);
    }
    if (data.objectives.includes('improve_communication')) {
      messages.push(`melhorar significativamente a comunicação com seus clientes`);
    }

    if (messages.length > 0) {
      personalizedMessage += messages.join(messages.length > 2 ? ', ' : ' e ');
      personalizedMessage += "!";
    } else {
       personalizedMessage = "O MassaFlow está pronto para otimizar sua rotina e ajudar você a alcançar seus objetivos!";
    }
  }


  return (
    <>
      <div className={styles.rocketIcon}>🚀</div> {/* Simple emoji, can be replaced with an actual icon */}
      <h2 className={styles.stepTitle}>Tudo pronto para decolar!</h2>
      <p className={styles.stepSubtitle}>
        Você configurou o essencial para transformar a gestão do seu atendimento.
      </p>
      <p className={styles.validationMessage}>
        {personalizedMessage}
      </p>
      <p className={styles.stepSubtitle}>
        Clique no botão abaixo para acessar seu painel e explorar todas as funcionalidades.
      </p>
    </>
  );
}
