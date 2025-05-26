import Head from 'next/head';
import { useState } from 'react';
import styles from '../../styles/Onboarding.module.css'; // Will create this file later
import { useEffect, useState } from 'react';
import Step0PracticeType from '../../components/onboarding/Step0PracticeType';
import Step1Objectives from '../../components/onboarding/Step1Objectives';
// Step2Tools and Step3Routines are removed from the initial onboarding flow
import Step2FinalValidation from '../../components/onboarding/Step2FinalValidation'; // New final step
import { useRouter } from 'next/router';
import { trackFrontendEvent } from '../../lib/frontendAnalytics';

const TOTAL_STEPS = 3; // Reduced to 3 steps

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [startTime, setStartTime] = useState(null);
  const [onboardingData, setOnboardingData] = useState({
    practiceType: '',
    objectives: [],
    toolsConnected: [], // Will remain empty for initial onboarding
    routinesActivated: ['confirm_24h', 'reminder_1h'], // Pre-activated basic routines
  });
  const router = useRouter();

  useEffect(() => {
    trackFrontendEvent('screen_viewed', { screen_name: 'onboarding_step_' + currentStep, step_number: currentStep });
    if (currentStep === 1 && !startTime) {
      setStartTime(Date.now());
      trackFrontendEvent('onboarding_started', { flow_type: 'progressive' });
    }
  }, [currentStep, startTime]);

  const updateOnboardingData = (stepData) => {
    setOnboardingData((prevData) => ({ ...prevData, ...stepData }));
  };

  const nextStep = () => {
    if (currentStep === 1 && !onboardingData.practiceType) {
      alert("Por favor, selecione seu tipo de prática para continuar.");
      return;
    }
    if (currentStep === 2 && onboardingData.objectives.length === 0) {
      // Optional: could prompt user to select at least one objective, or allow skipping
      // For a more agile flow, allow skipping for now.
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      const timeTakenSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
      // Simulate saving onboardingData to a user profile or backend
      console.log("Progressive Onboarding Completed. Data:", onboardingData);
      
      trackFrontendEvent('onboarding_completed', {
        flow_type: 'progressive',
        practice_type: onboardingData.practiceType,
        objectives: onboardingData.objectives,
        // tools_connected will be empty or not sent
        routines_activated: onboardingData.routinesActivated, // Basic pre-activated routines
        time_taken_seconds: timeTakenSeconds,
      });
      router.push('/'); // Redirect to dashboard
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    const commonProps = { data: onboardingData, updateData: updateOnboardingData };
    switch (currentStep) {
      case 1:
        return <Step0PracticeType {...commonProps} />;
      case 2:
        return <Step1Objectives {...commonProps} />;
      case 3:
        // Pass practiceType to Step2FinalValidation to display relevant info
        return <Step2FinalValidation practiceType={onboardingData.practiceType} />;
      default:
        return <Step0PracticeType {...commonProps} />;
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>MassaFlow - Onboarding</title>
        <meta name="description" content="Bem-vindo ao MassaFlow! Configure sua conta." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.progressBar}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`${styles.progressStep} ${i + 1 === currentStep ? styles.activeStep : ''} ${i + 1 < currentStep ? styles.completedStep : ''}`}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className={styles.stepContent}>
          {renderStep()}
        </div>

        <div className={styles.navigation}>
          {currentStep > 1 && (
            <button onClick={prevStep} className={styles.navButton}>
              Voltar
            </button>
          )}
          <button onClick={nextStep} className={`${styles.navButton} ${styles.nextButton}`}>
            {currentStep === TOTAL_STEPS ? 'Começar a usar o MassaFlow!' : 'Próximo'}
          </button>
        </div>
      </main>
    </div>
  );
}
