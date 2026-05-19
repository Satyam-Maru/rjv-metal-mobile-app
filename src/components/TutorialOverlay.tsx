import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTutorial } from '../context/TutorialContext';
import { useLanguage } from '../context/LanguageContext';
import { theme } from '../theme';

const R = 36; // Spotlight radius
const BORDER_SIZE = 2000; // Giant border to dim screen
const ARROW_WIDTH = 14;

export const TutorialOverlay = () => {
  const { currentStep, isVisible, nextStep, prevStep, stopTutorial } = useTutorial();
  const { language, t } = useLanguage();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const pulseAnim = useState(new Animated.Value(0))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(15))[0];

  useEffect(() => {
    if (isVisible) {
      // Fade in overlay & slide up card
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulsing spotlight halo
      pulseAnim.setValue(0);
      Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    } else {
      // Fade out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, currentStep]);

  if (!isVisible) return null;

  // Calculate coordinates for bottom tab buttons
  const tabWidth = screenWidth / 5;
  const centerX = tabWidth * (currentStep + 0.5);
  // Bottom tab bar height is 65. The icons are centered vertically in it.
  const centerY = screenHeight - insets.bottom - 65 / 2;

  // Mask positions
  const maskLeft = centerX - R - BORDER_SIZE;
  const maskTop = centerY - R - BORDER_SIZE;

  // Pulse interpolations for glowing halo
  const haloScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });
  const haloOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 0],
  });

  // Steps data
  const steps = [
    {
      title: t.tutorialTitleDashboard,
      desc: t.tutorialDescDashboard,
    },
    {
      title: t.tutorialTitleProducts,
      desc: t.tutorialDescProducts,
    },
    {
      title: t.tutorialTitleManagement,
      desc: t.tutorialDescManagement,
    },
    {
      title: t.tutorialTitleStock,
      desc: t.tutorialDescStock,
    },
    {
      title: t.tutorialTitleHistory,
      desc: t.tutorialDescHistory,
    },
  ];

  const step = steps[currentStep] || steps[0];

  // Tooltip card bottom offset is just above the tab bar (65 + insets.bottom + margin)
  const cardBottom = 65 + insets.bottom + 15;
  // Align arrow directly to the active tab icon
  const arrowLeft = centerX - 20 - ARROW_WIDTH / 2; // Offset by card padding/margin of 20

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]} pointerEvents="box-none">
      {/* Background Dim with Spotlight Cutout */}
      <View
        style={[
          styles.mask,
          {
            left: maskLeft,
            top: maskTop,
            width: (R + BORDER_SIZE) * 2,
            height: (R + BORDER_SIZE) * 2,
            borderRadius: R + BORDER_SIZE,
            borderWidth: BORDER_SIZE,
          },
        ]}
        pointerEvents="none"
      />

      {/* Pulsing Highlight Halo */}
      <Animated.View
        style={[
          styles.halo,
          {
            left: centerX - R,
            top: centerY - R,
            width: R * 2,
            height: R * 2,
            borderRadius: R,
            transform: [{ scale: haloScale }],
            opacity: haloOpacity,
          },
        ]}
        pointerEvents="none"
      />

      {/* Glassmorphism Tooltip Card */}
      <Animated.View
        style={[
          styles.cardContainer,
          {
            bottom: cardBottom,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.desc}>{step.desc}</Text>

          {/* Controls Row */}
          <View style={styles.controlsRow}>
            {/* Skip Button */}
            <TouchableOpacity onPress={stopTutorial} style={styles.skipButton}>
              <Text style={styles.skipText}>{t.tutorialSkip}</Text>
            </TouchableOpacity>

            {/* Step Indicators */}
            <View style={styles.indicatorContainer}>
              {steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicatorDot,
                    index === currentStep && styles.indicatorDotActive,
                  ]}
                />
              ))}
            </View>

            {/* Back & Next / Finish Buttons */}
            <View style={styles.navButtons}>
              {currentStep > 0 && (
                <TouchableOpacity onPress={prevStep} style={styles.backButton}>
                  <Text style={styles.backText}>{t.tutorialBack}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={nextStep}
                style={[
                  styles.nextButton,
                  currentStep === steps.length - 1 && styles.finishButton,
                ]}
              >
                <Text
                  style={[
                    styles.nextText,
                    currentStep === steps.length - 1 && styles.finishText,
                  ]}
                >
                  {currentStep === steps.length - 1 ? t.tutorialFinish : t.tutorialNext}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Downward pointing arrow indicator */}
        <View style={[styles.arrow, { left: arrowLeft }]} />
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  mask: {
    position: 'absolute',
    borderColor: 'rgba(0, 0, 0, 0.72)', // Soft elegant dim
  },
  halo: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: theme.colors.accent,
    backgroundColor: 'transparent',
  },
  cardContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)', // Glassmorphism translucent back
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)', // Bright edge highlight
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  arrow: {
    position: 'absolute',
    bottom: -7,
    width: ARROW_WIDTH,
    height: ARROW_WIDTH,
    backgroundColor: 'rgba(255, 255, 255, 0.88)', // Matches card body
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)', // Matches card border
    transform: [{ rotate: '45deg' }],
    zIndex: -1,
  },
  title: {
    ...theme.typography.h3,
    fontSize: 18,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  desc: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipText: {
    ...theme.typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  indicatorDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.sm,
  },
  nextText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  finishButton: {
    backgroundColor: theme.colors.accent,
  },
  finishText: {
    color: theme.colors.primary,
  },
});
