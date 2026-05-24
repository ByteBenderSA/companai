import { useState, useEffect } from 'react';
import Joyride, { Step, STATUS, CallBackProps } from 'react-joyride';

interface ProductTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const ProductTour = ({ isActive, onComplete, onSkip }: ProductTourProps) => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (isActive) {
      // Start the tour after a small delay to ensure elements are rendered
      setTimeout(() => setRun(true), 500);
    }
  }, [isActive]);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div>
                          <h3 className="text-lg font-semibold mb-2">Welcome to CompanAI! 🚀</h3>
          <p>Let's take a quick tour to help you get started. This will only take 2 minutes!</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="progress-card"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">Track Your Progress 📊</h3>
          <p>Here you can see your learning progress, level, and achievements. As you complete lessons and build projects, you'll level up!</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="quick-actions"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">Quick Actions ⚡</h3>
          <p>These are your main tools: Generate app ideas, learn essential technologies, build projects, and get AI help anytime.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="learn-essentials"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">Learn Essentials 📚</h3>
          <p>Start here! Learn about the modern tools that power your apps: Lovable, Cursor, Firebase, GitHub, TypeScript, and Tailwind CSS.</p>
        </div>
      ),
      placement: 'top',
      spotlightClicks: true,
    },
    {
      target: '[data-tour="recent-activity"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">Recent Activity 📅</h3>
          <p>Keep track of your recent actions, completed lessons, and project updates.</p>
        </div>
      ),
      placement: 'left',
    },
    {
      target: '[data-tour="achievements"]',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">Achievements 🏆</h3>
          <p>Unlock achievements as you learn and build. Complete your first lesson to get started!</p>
        </div>
      ),
      placement: 'left',
    },
    {
      target: 'body',
      content: (
        <div>
          <h3 className="text-lg font-semibold mb-2">You're All Set! 🎉</h3>
          <p>Ready to start your journey? We recommend beginning with the "Learn Essentials" to understand your tech stack.</p>
        </div>
      ),
      placement: 'center',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      setStepIndex(0);
      if (status === STATUS.FINISHED) {
        onComplete();
      } else {
        onSkip();
      }
    } else if (type === 'step:after') {
      setStepIndex(index + 1);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#7c3aed', // Purple-600
          textColor: '#374151', // Gray-700
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.4)',
          spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
          beaconSize: 36,
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          padding: 20,
        },
        buttonNext: {
          backgroundColor: '#7c3aed',
          borderRadius: 6,
          color: '#ffffff',
          fontSize: 14,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#6b7280',
          fontSize: 14,
          padding: '8px 16px',
        },
        buttonSkip: {
          color: '#6b7280',
          fontSize: 14,
        },
      }}
      locale={{
        back: 'Previous',
        close: 'Close',
        last: 'Finish Tour',
        next: 'Next',
        open: 'Open',
        skip: 'Skip Tour',
      }}
    />
  );
};

export default ProductTour; 