import styles from '../../styles/Onboarding.module.css';
import { trackFrontendEvent } from '../../lib/frontendAnalytics';

const practiceTypes = [
  { id: 'autonomo', label: 'Autônomo/Consultório Individual' },
  { id: 'clinica', label: 'Clínica/Centro de Estética' },
  { id: 'spa', label: 'Spa/Hotel' },
];

export default function Step0PracticeType({ data, updateData, userId }) { // Assuming userId might be passed
  const handlePracticeTypeChange = (typeId) => {
    updateData({ practiceType: typeId });
    trackFrontendEvent(
      'onboarding_practice_type_selected',
      { practice_type: typeId },
      userId
    );
  };

  return (
    <>
      <h2 className={styles.stepTitle}>Qual o seu tipo de prática?</h2>
      <p className={styles.stepSubtitle}>
        Entender seu modelo de negócio nos ajuda a sugerir as melhores configurações e rotinas para você.
      </p>
      <div className={styles.practiceTypeList}> {/* Using a new class for styling if needed, can reuse objectivesList styling too */}
        {practiceTypes.map((type) => (
          <div
            key={type.id}
            className={`${styles.practiceTypeItem} ${data.practiceType === type.id ? styles.selected : ''}`}
            onClick={() => handlePracticeTypeChange(type.id)}
          >
            <label>
              <input
                type="radio"
                name="practiceType"
                value={type.id}
                checked={data.practiceType === type.id}
                onChange={() => handlePracticeTypeChange(type.id)} // onChange is good for accessibility
              />
              {type.label}
            </label>
          </div>
        ))}
      </div>
    </>
  );
}
