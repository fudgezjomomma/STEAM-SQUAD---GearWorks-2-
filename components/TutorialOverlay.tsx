
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
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ steps, isOpen, onClose, lang }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStepIndex];
  
  // Labels
  const nextLabel = lang === 'zh-TW' ? "下一步" : "Next";
  const backLabel = lang === 'zh-TW' ? "上一步" : "Back";
  const finishLabel = lang === 'zh-TW' ? "開始建造！" : "Let's Build!";
  const skipLabel = lang === 'zh-TW' ? "跳過" : "Skip";

  useEffect(() => {
    if (!isOpen) return;
    const updateRect = () => {
      if (step.targetId) {
        const el = document.getElementById(step.targetId);
        if (el) {
          const r = el.getBoundingClientRect();
          setRect(r);
          // Ensure element is scrolled into view if needed
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          return;
        }
      }
      // Default centered if no target or target not found
      setRect(null);
    };

    // Small delay to allow UI to render/settle
    const timeout = setTimeout(updateRect, 100);
    window.addEventListener('resize', updateRect);
    
    return () => {
      window.removeEventListener('resize', updateRect);
      clearTimeout(timeout);
    };
  }, [currentStepIndex, isOpen, step.targetId]);

  if (!isOpen) return null;

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
          className="absolute transition-all duration-500 ease-in-out rounded-xl pointer-events-none"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
            border: '2px solid rgba(255, 255, 255, 0.5)'
          }}
        ></div>
      ) : (
        <div className="absolute inset-0 bg-black/75 transition-opacity duration-500"></div>
      )}

      {/* Tooltip Card */}
      <div 
        ref={containerRef}
        className="absolute bg-[#0F2437] text-white p-6 rounded-2xl shadow-2xl border-2 border-[#22D3EE] max-w-sm w-full transition-all duration-500 flex flex-col gap-4"
        style={tooltipStyle}
      >
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-[#22D3EE]">{step.title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xs uppercase font-bold tracking-wider mt-1">
                {skipLabel}
            </button>
        </div>
        
        <p className="text-gray-200 leading-relaxed text-sm">
            {step.description}
        </p>

        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-700">
            <span className="text-xs font-mono text-gray-500">{currentStepIndex + 1} / {steps.length}</span>
            <div className="flex gap-3">
                {currentStepIndex > 0 && (
                    <button onClick={handleBack} className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-bold transition-colors">
                        {backLabel}
                    </button>
                )}
                <button onClick={handleNext} className="px-6 py-2 rounded-lg bg-[#22D3EE] hover:bg-[#06b6d4] text-[#0F2437] text-sm font-bold transition-colors shadow-lg shadow-cyan-500/20">
                    {currentStepIndex === steps.length - 1 ? finishLabel : nextLabel}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
