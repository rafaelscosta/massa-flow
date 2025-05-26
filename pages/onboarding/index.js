import Head from 'next/head';
import { useState } from 'react';
import styles from '../../styles/Onboarding.module.css'; // Will create this file later
import { useEffect, useState } from 'react'; // Added useEffect
import Step0PracticeType from '../../components/onboarding/Step0PracticeType'; // New Step
import Step1Objectives from '../../components/onboarding/Step1Objectives';
import Step2Tools from '../../components/onboarding/Step2Tools';
import Step3Routines from '../../components/onboarding/Step3Routines';
import Step4Validation from '../../components/onboarding/Step4Validation';
import { useRouter } from 'next/router';
import { trackFrontendEvent } from '../../lib/frontendAnalytics'; // Import analytics helper

const TOTAL_STEPS = 5; // Increased total steps

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [startTime, setStartTime] = useState(null); // For time_taken_seconds
  const [onboardingData, setOnboardingData] = useState({
    practiceType: '', // Added practiceType
    objectives: [],
    toolsConnected: [],
    routinesActivated: [],
    // We can store loaded template messages here if needed, or load them directly in Step3
  });
  const router = useRouter();

  useEffect(() => {
    // Track start of onboarding and record start time
    trackFrontendEvent('screen_viewed', { screen_name: 'onboarding_step_' + currentStep });
    if (currentStep === 1 && !startTime) {
        setStartTime(Date.now());
        trackFrontendEvent('onboarding_started');
    }
     // Track each step view
    trackFrontendEvent('screen_viewed', { screen_name: `onboarding_step_${currentStep}`, step_number: currentStep });

  }, [currentStep, startTime]);


  const updateOnboardingData = (stepData) => {
    setOnboardingData((prevData) => ({ ...prevData, ...stepData }));
  };

  const nextStep = () => {
    // Basic validation for practice type selection
    if (currentStep === 1 && !onboardingData.practiceType) {
      alert("Por favor, selecione seu tipo de prática para continuar.");
      return;
    }
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finish onboarding - redirect to dashboard or a success page
      const timeTakenSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
      trackFrontendEvent('onboarding_completed', {
        // userId: 'user123_mvp', // Replace with actual userId if available
        practice_type: onboardingData.practiceType,
        objectives: onboardingData.objectives,
        tools_connected: onboardingData.toolsConnected,
        routines_activated: onboardingData.routinesActivated,
        time_taken_seconds: timeTakenSeconds,
      });
      router.push('/');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    // Pass userId if available, for now it's handled by trackFrontendEvent default
    const commonProps = { data: onboardingData, updateData: updateOnboardingData /* userId: 'user123_mvp' */ };
    switch (currentStep) {
      case 1: // New Step 0 is now Step 1
        return <Step0PracticeType {...commonProps} />;
      case 2:
        return <Step1Objectives {...commonProps} />;
      case 3:
        return <Step2Tools {...commonProps} />;
      case 4:
        return <Step3Routines {...commonProps} />;
      case 5:
        return <Step4Validation {...commonProps} />; // Validation step might not need updateData
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
