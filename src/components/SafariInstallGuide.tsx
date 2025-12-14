import { useState } from 'react';

interface SafariInstallGuideProps {
  isOpen: boolean;
  onClose: () => void;
  platform: 'ios' | 'android' | 'desktop';
}

/**
 * Interactive install guide modal for Safari and other browsers
 * that don't support programmatic PWA installation
 */
export default function SafariInstallGuide({ isOpen, onClose, platform }: SafariInstallGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const iosSteps = [
    {
      number: 1,
      title: 'Tap the Share Button',
      description: 'Look for the share icon (square with arrow) at the bottom of your screen',
      icon: '📤',
      highlight: 'bottom-center',
    },
    {
      number: 2,
      title: 'Find "Add to Home Screen"',
      description: 'Scroll down in the share menu and tap "Add to Home Screen"',
      icon: '➕',
      highlight: 'center',
    },
    {
      number: 3,
      title: 'Confirm Installation',
      description: 'Tap "Add" in the top-right corner to complete installation',
      icon: '✅',
      highlight: 'top-right',
    },
  ];

  const androidSteps = [
    {
      number: 1,
      title: 'Open Browser Menu',
      description: 'Tap the three dots (⋮) in the top-right corner of your browser',
      icon: '⋮',
      highlight: 'top-right',
    },
    {
      number: 2,
      title: 'Select Install',
      description: 'Tap "Install app" or "Add to Home screen" from the menu',
      icon: '📱',
      highlight: 'center',
    },
  ];

  const desktopSteps = [
    {
      number: 1,
      title: 'Look for Install Icon',
      description: 'Check your browser\'s address bar for an install icon',
      icon: '🔽',
      highlight: 'top',
    },
  ];

  const steps = platform === 'ios' ? iosSteps : platform === 'android' ? androidSteps : desktopSteps;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step - close and mark as shown
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[var(--color-bg-card)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] border border-[var(--color-border)] max-w-md w-full pointer-events-auto animate-slide-up"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-guide-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-accent-primary)]/20 rounded-[var(--radius-md)] flex items-center justify-center">
                <span className="text-2xl">{currentStepData.icon}</span>
              </div>
              <div>
                <h3 id="install-guide-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Install Finance Buddy
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-bg-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close install guide"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className={`flex items-center ${
                    index < steps.length - 1 ? 'flex-1' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      index === currentStep
                        ? 'bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] scale-110'
                        : index < currentStep
                        ? 'bg-[var(--color-income)] text-[var(--color-text-primary)]'
                        : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {index < currentStep ? '✓' : step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-all ${
                        index < currentStep
                          ? 'bg-[var(--color-income)]'
                          : 'bg-[var(--color-border)]'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{currentStepData.icon}</div>
              <h4 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                {currentStepData.title}
              </h4>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Visual Guide for iOS */}
            {platform === 'ios' && currentStep === 0 && (
              <div className="bg-[var(--color-bg-elevated)] rounded-[var(--radius-md)] p-4 mb-6 border border-[var(--color-border)]">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-accent-primary)]/20 rounded-[var(--radius-md)] mb-3">
                    <svg className="w-8 h-8 text-[var(--color-accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    The share button is at the bottom of your screen
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center gap-3 p-4 sm:p-6 border-t border-[var(--color-border)]">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="flex-1 px-4 py-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] rounded-[var(--radius-md)] transition-all font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] min-h-[44px]"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className={`${
                currentStep > 0 ? 'flex-1' : 'w-full'
              } px-4 py-2.5 bg-[var(--color-accent-primary)] text-[var(--color-text-primary)] rounded-[var(--radius-md)] hover:bg-[var(--color-accent-hover)] transition-all font-medium shadow-[var(--shadow-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg-card)] min-h-[44px]`}
            >
              {currentStep === steps.length - 1 ? 'Got it!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
