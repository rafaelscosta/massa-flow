import styles from '../../styles/Onboarding.module.css'; // Shared onboarding styles
import { useEffect, useState } from 'react';
import { trackFrontendEvent } from '../../lib/frontendAnalytics';

// Import the JSON templates
import autonomoTemplate from '../../data/practiceTemplates/autonomo.json';
import clinicaTemplate from '../../data/practiceTemplates/clinica.json';
import spaTemplate from '../../data/practiceTemplates/spa.json';

const templateMap = {
  autonomo: autonomoTemplate,
  clinica: clinicaTemplate,
  spa: spaTemplate,
};

// Define base routine keys that match JSON structure for easier mapping
const baseRoutineKeys = ['confirm_24h', 'reminder_1h', 'follow_up_24h'];

export default function Step3Routines({ data, updateData, userId }) {
  const [currentRoutines, setCurrentRoutines] = useState([]);
  const [initialLoadDone, setInitialLoadDone] = useState(false); // To track initial activation event

  useEffect(() => {
    const selectedPracticeType = data.practiceType || 'autonomo'; // Default to 'autonomo' if not set
    const template = templateMap[selectedPracticeType] || templateMap.autonomo;
    
    const loadedRoutines = baseRoutineKeys.map(key => {
        const routineData = template.routines[key];
        return {
            id: key,
            name: routineData.name,
            description: routineData.description,
        };
    });
    setCurrentRoutines(loadedRoutines);

    // Pre-activate all routines and fire event only on initial load of this step for a user
    if ((!data.routinesActivated || data.routinesActivated.length === 0) && !initialLoadDone) {
      const allRoutineIds = loadedRoutines.map(r => r.id);
      updateData({ routinesActivated: allRoutineIds });
      trackFrontendEvent(
        'onboarding_routines_activated_initial',
        { routines: allRoutineIds.map(id => ({ routine_name: id, status: 'activated' })) }, // Send more details
        userId
      );
      setInitialLoadDone(true); // Ensure this block runs only once per component mount effectively
    }
    // Note: If user navigates back and forth, initialLoadDone might prevent re-tracking.
    // For true "initial for this step" logic, state might need to be in parent or reset differently.
    // For MVP, this captures the first time routines are defaulted.

  }, [data.practiceType, updateData, userId, data.routinesActivated, initialLoadDone]);

  const handleRoutineToggle = (routineId, routineName) => {
    const currentActivated = data.routinesActivated || [];
    const isActivating = !currentActivated.includes(routineId);
    const newActivated = isActivating
      ? [...currentActivated, routineId]
      : currentActivated.filter((id) => id !== routineId);
    
    updateData({ routinesActivated: newActivated });

    // Track individual routine status changes during onboarding
    trackFrontendEvent(
      'routine_status_changed', // Using the more general event name
      { 
        routine_name: routineName, // or routineId if preferred
        status: isActivating ? 'activated' : 'deactivated',
        context: 'onboarding' 
      },
      userId
    );
  };

  if (currentRoutines.length === 0) {
    return <p>Carregando rotinas...</p>;
  }

  return (
    <>
      <h2 className={styles.stepTitle}>Ative suas primeiras rotinas</h2>
      <p className={styles.stepSubtitle}>
        Estas são sugestões de rotinas com base no seu tipo de prática. Você pode personalizar tudo depois.
      </p>
      <div className={styles.routinesList}>
        {currentRoutines.map((routine) => (
          <div key={routine.id} className={styles.routineCard}>
            <div className={styles.routineInfo}>
              <h3>{routine.name}</h3>
              <p>{routine.description}</p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={(data.routinesActivated || []).includes(routine.id)}
                onChange={() => handleRoutineToggle(routine.id, routine.name)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
        ))}
      </div>
    </>
  );
}
