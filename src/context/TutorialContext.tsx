import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from '../services/navigation';

interface TutorialContextType {
  currentStep: number;
  isVisible: boolean;
  startTutorial: () => void;
  stopTutorial: () => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    async function checkTutorialStatus() {
      try {
        const hasSeen = await AsyncStorage.getItem('@rjv_metal_has_seen_tutorial');
        if (hasSeen !== 'true') {
          // Trigger the tutorial automatically for new users
          startTutorial();
        }
      } catch (error) {
        console.warn('Error checking tutorial status:', error);
      }
    }
    checkTutorialStatus();
  }, []);

  const startTutorial = () => {
    setCurrentStep(0);
    setIsVisible(true);
    navigate('Dashboard');
  };

  const stopTutorial = async () => {
    setIsVisible(false);
    try {
      await AsyncStorage.setItem('@rjv_metal_has_seen_tutorial', 'true');
    } catch (error) {
      console.warn('Error saving tutorial status:', error);
    }
    navigate('Dashboard');
  };

  const nextStep = () => {
    if (currentStep < 4) {
      const nextVal = currentStep + 1;
      setCurrentStep(nextVal);
      const tabs = ['Dashboard', 'Products', 'Management', 'Stock', 'History'];
      navigate(tabs[nextVal]);
    } else {
      stopTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevVal = currentStep - 1;
      setCurrentStep(prevVal);
      const tabs = ['Dashboard', 'Products', 'Management', 'Stock', 'History'];
      navigate(tabs[prevVal]);
    }
  };

  return (
    <TutorialContext.Provider
      value={{
        currentStep,
        isVisible,
        startTutorial,
        stopTutorial,
        nextStep,
        prevStep,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};
