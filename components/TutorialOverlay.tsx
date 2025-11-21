
import React, { useEffect, useState, useRef } from 'react';

export interface TutorialStep {
  targetId?: string; // DOM ID to highlight. If undefined, center modal.
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'zh-TW';
  onStepChange?: (index: number) => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ steps, isOpen, onClose, lang, onStepChange }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset index when opening or when steps change to prevent out-of-bounds errors
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen, steps]);

  // Notify parent when step changes
  useEffect(() => {
      if (isOpen && onStepChange) {
          onStepChange(currentStepIndex);
      }
  }, [currentStepIndex, isOpen, onStepChange]);

  const step = steps[currentStepIndex];
  
  // Labels
  const nextLabel = lang === 'zh-TW' ? "下一步" : "Next";
  const backLabel = lang === 'zh-TW' ? "上一步" : "Back";
  const finishLabel = lang === 'zh-TW' ? "開始建造！" : "Let's Build!";
  const skipLabel = lang === 'zh-TW' ? "跳過" : "Skip";

  useEffect(() => {
    if (!isOpen || !step) return;

    let animationFrameId: number;

    const updateRect = () => {
      if (step.targetId) {
        const el = document.getElementById(step.targetId);
        if (el) {
          const newRect = el.getBoundingClientRect();
          
          // Only update state if values have changed to prevent infinite loops/excessive renders
          setRect(prev => {
              if (!prev) return newRect;
              if (
                  Math.abs(prev.x - newRect.x) < 1 && 
                  Math.abs(prev.y - newRect.y) < 1 && 
                  Math.abs(prev.width - newRect.width) < 1 && 
                  Math.abs(prev.height - newRect.height) < 1
              ) {
                  return prev;
              }
              return newRect;
          });
          
          // Only scroll into view once or if significantly off screen, handled by browser mostly
          // el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          return;
        }
      }
      // Default centered if no target or target not found
      setRect(null);
    };

    // Start tracking loop to handle animations (sliding panels, etc.)
    const loop = () => {
        updateRect();
        animationFrameId = requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener('resize', updateRect);
    
    return () => {
      window.removeEventListener('resize', updateRect);
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentStepIndex, isOpen, step]);

  // Safety check: If step is undefined (e.g. index mismatch during transition), don't render
  if (!isOpen || !step) return null;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onClose();
      // Reset for next time
      setTimeout(() => setCurrentStepIndex(0), 500);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Calculate tooltip position relative to the highlight rect
  let tooltipStyle: React.CSSProperties = {};
  const tooltipWidth = 320; // Approx width used for calculations
  
  if (rect) {
    const padding = 20;
    
    // Default to bottom if plenty of space, otherwise flip
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceRight = window.innerWidth - rect.right;
    
    if (step.position === 'center') {
       // Explicit center over target
       tooltipStyle = {
          top: rect.top + rect.height / 2,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, -50%)'
       };
    } else if (step.position === 'right' && spaceRight > 350) {
       tooltipStyle = { top: rect.top, left: rect.right + padding };
    } else if (step.position === 'left') {
       tooltipStyle = { top: rect.top, left: rect.left - tooltipWidth - padding };
    } else if (spaceBelow > 250 || step.position === 'bottom') {
       tooltipStyle = { top: rect.bottom + padding, left: rect.left + (rect.width/2) - (tooltipWidth/2) };
    } else {
       // Default to Top
       tooltipStyle = { bottom: window.innerHeight - rect.top + padding, left: rect.left + (rect.width/2) - (tooltipWidth/2) };
    }
    
    // --- Boundary Clamping ---
    // Prevent going off left edge
    if (tooltipStyle.left && typeof tooltipStyle.left === 'number') {
        if (tooltipStyle.left < 20) {
            tooltipStyle.left = 20;
        } else if (tooltipStyle.left + tooltipWidth > window.innerWidth - 20) {
            // Prevent going off right edge
            tooltipStyle.left = window.innerWidth - tooltipWidth - 20;
        }
    }

    // Prevent going off top/bottom (basic checks)
    if (tooltipStyle.top && typeof tooltipStyle.top === 'number') {
       if (tooltipStyle.top < 20) tooltipStyle.top = 20;
    }

  } else {
    // Center screen if no target
    tooltipStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Background Dimmer with Cutout Effect */}
      {/* We use a massive box-shadow on the highlight element to create the cutout effect */}
      {rect ? (
        <div 
          className="absolute transition-all duration-75 ease-linear rounded-xl pointer-events-none"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
            border: '2px solid var(--text-accent)'
          }}
        ></div>
      ) : (
        <div className="absolute inset-0 bg-black/75 transition-opacity duration-500"></div>
      )}

      {/* Tooltip Card */}
      <div 
        ref={containerRef}
        className="absolute p-6 rounded-2xl shadow-2xl border-2 max-w-sm w-full transition-all duration-300 flex flex-col gap-4"
        style={{
            ...tooltipStyle,
            backgroundColor: 'var(--bg-panel)',
            borderColor: 'var(--text-accent)',
            color: 'var(--text-primary)'
        }}
      >
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-accent)' }}>{step.title}</h3>
            <button onClick={onClose} className="text-xs uppercase font-bold tracking-wider mt-1 opacity-50 hover:opacity-100" style={{ color: 'var(--text-secondary)' }}>
                {skipLabel}
            </button>
        </div>
        
        <p className="leading-relaxed text-sm opacity-90" style={{ color: 'var(--text-primary)' }}>
            {step.description}
        </p>

        <div className="flex justify-between items-center pt-2 mt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-xs font-mono opacity-60" style={{ color: 'var(--text-secondary)' }}>{currentStepIndex + 1} / {steps.length}</span>
            <div className="flex gap-3">
                {currentStepIndex > 0 && (
                    <button onClick={handleBack} className="px-4 py-2 rounded-lg text-sm font-bold transition-colors hover:brightness-110" style={{ backgroundColor: 'var(--button-bg)', color: 'var(--text-primary)' }}>
                        {backLabel}
                    </button>
                )}
                <button 
                    onClick={handleNext} 
                    className="px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg hover:brightness-110"
                    style={{ backgroundColor: 'var(--text-accent)', color: 'var(--bg-panel)' }}
                >
                    {currentStepIndex === steps.length - 1 ? finishLabel : nextLabel}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
