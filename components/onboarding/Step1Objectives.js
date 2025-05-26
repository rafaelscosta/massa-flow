import styles from '../../styles/Onboarding.module.css'; // Shared onboarding styles
import { trackFrontendEvent } from '../../lib/frontendAnalytics';

const objectivesOptions = [
  { id: 'reduce_noshows', label: 'Reduzir no-shows (faltas de clientes)' },
  { id: 'increase_revenue', label: 'Aumentar receita por cliente' },
  { id: 'save_time', label: 'Economizar tempo administrativo' },
  { id: 'improve_communication', label: 'Melhorar a comunicação com clientes' },
];

export default function Step1Objectives({ data, updateData, userId }) {
  const handleObjectiveChange = (objectiveId) => {
    const currentObjectives = data.objectives || [];
    const newObjectives = currentObjectives.includes(objectiveId)
      ? currentObjectives.filter((id) => id !== objectiveId)
      : [...currentObjectives, objectiveId];
    updateData({ objectives: newObjectives });
    
    // It's better to track when the user moves to the next step,
    // or on a specific "save" action for this step, to avoid too many events.
    // However, if granular tracking per selection is desired:
    // trackFrontendEvent(
    //   'onboarding_objective_toggled',
    //   { objective: objectiveId, selected: newObjectives.includes(objectiveId) },
    //   userId
    // );
  };

  // It's common to track the final selection when the user proceeds.
  // This event will be triggered from pages/onboarding/index.js 'nextStep' or
  // implicitly when 'onboarding_completed' event is sent with all data.
  // For this task, let's assume 'onboarding_objectives_selected' means the final set.
  // This can be fired when the user leaves this step.
  // We'll rely on the 'onboarding_completed' event to capture the final state for this MVP,
  // but if a step-specific "finalized" event is needed, it would be added to the nextStep logic in parent.

  return (
    <>
      <h2 className={styles.stepTitle}>Qual seu maior desafio hoje?</h2>
      <p className={styles.stepSubtitle}>
        Selecione um ou mais objetivos que você gostaria de alcançar com o MassaFlow.
        Isso nos ajudará a personalizar sua experiência.
      </p>
      <ul className={styles.objectivesList}>
        {objectivesOptions.map((objective) => (
          <li key={objective.id} className={styles.objectiveItem}>
            <label>
              <input
                type="checkbox"
                checked={(data.objectives || []).includes(objective.id)}
                onChange={() => handleObjectiveChange(objective.id)}
              />
              {objective.label}
            </label>
          </li>
        ))}
      </ul>
    </>
  );
}
