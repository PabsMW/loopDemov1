import { motion } from 'framer-motion';
import { CHECK_PROGRESS_DURATION } from '../../constants/animations';

const CheckProgressRing = ({ 
  segments = [],
  previousSegments = [],
  isChecking,
  hasEverChecked = false,
  className = '' 
}) => {
  // Match bg-ring-sm.svg dimensions for perfect alignment
  // BG ring: outer 163px, inner 153.6px, thickness 9.4px
  // Center of stroke: (163 + 153.6) / 2 = 158.3px
  const radius = 158.3;
  const strokeWidth = 9.4;
  const centerX = 163;
  const centerY = 163;
  const circumference = 2 * Math.PI * radius; // ~994.7px
  const arcLength = circumference / 12; // ~82.9px - length of each 30° arc
  const segmentDuration = CHECK_PROGRESS_DURATION / 12; // Duration per segment
  
  // Don't render if never checked or no segments
  if (!isChecking && !hasEverChecked) return null;
  if (segments.length === 0) return null;
  
  // #region agent log
  const partialArcs = segments.filter(s => s.isPartial);
  if (partialArcs.length > 0) {
    fetch('http://127.0.0.1:7242/ingest/f251af1e-faaf-4486-88d3-157c9976b4ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckProgressRing.jsx:render',message:'Rendering with partial arcs',data:{isChecking,partialArcs:partialArcs.map(a=>({index:a.index,isPartial:a.isPartial})),allSegments:segments.map(s=>({index:s.index,isCorrect:s.isCorrect,isPartial:s.isPartial}))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion
  
  // Helper function to create arc path for each segment
  const createArcPath = (startIndex) => {
    const startAngle = (startIndex * 30 - 90) * (Math.PI / 180); // -90 to start at 12 o'clock
    const endAngle = ((startIndex + 1) * 30 - 90) * (Math.PI / 180);
    
    const startX = centerX + radius * Math.cos(startAngle);
    const startY = centerY + radius * Math.sin(startAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);
    
    // Create arc path (small arc, 30 degrees)
    return `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
  };
  
  return (
    <svg 
      width="326" 
      height="326" 
      viewBox="0 0 326 326"
      className={`absolute inset-0 pointer-events-none z-10 ${className}`}
      style={{ top: 0, left: 0 }}
    >
      {segments.map((segment, index) => {
        // Check if this arc was already persistent (correct or partial) in previous check
        const previousArc = previousSegments.find(s => s.index === index);
        const wasAlreadyPersistent = previousArc && (
          (previousArc.isCorrect && segment.isCorrect) ||
          (previousArc.isPartial && segment.isPartial)
        );
        
        // Count how many non-persistent arcs come before this one (for adjusted delay)
        const nonPersistentArcsBefore = segments
          .slice(0, index)
          .filter((s, i) => {
            const prevArc = previousSegments.find(ps => ps.index === i);
            const alreadyPersistent = prevArc && (
              (prevArc.isCorrect && s.isCorrect) ||
              (prevArc.isPartial && s.isPartial)
            );
            return !alreadyPersistent;  // Count only arcs that need animation
          }).length;
        
        const adjustedDelay = wasAlreadyPersistent ? 0 : (nonPersistentArcsBefore * segmentDuration);
        
        // Determine stroke color: teal for correct, amber for partial, red for wrong
        const getStrokeColor = () => {
          if (segment.isCorrect) return "#5EEAD4"; // teal
          if (segment.isPartial) return "#FCD34D"; // amber-300
          return "#EF4444"; // red
        };
        
        // Should this arc persist after check? (correct and partial persist, wrong fades)
        const shouldPersist = segment.isCorrect || segment.isPartial;
        
        return (
          <motion.path
            key={index}
            d={createArcPath(index)}
            fill="none"
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={arcLength}
            initial={{ 
              strokeDashoffset: wasAlreadyPersistent ? 0 : arcLength,
              opacity: wasAlreadyPersistent ? 1 : 0 
            }}
            animate={isChecking ? {
              strokeDashoffset: 0,
              opacity: 1
            } : {
              strokeDashoffset: shouldPersist ? 0 : arcLength,
              opacity: shouldPersist ? 1 : 0
            }}
            transition={isChecking ? { 
              strokeDashoffset: {
                delay: adjustedDelay,
                duration: wasAlreadyPersistent ? 0 : segmentDuration,
                ease: "linear"
              },
              opacity: { duration: 0.2 }
            } : {
              strokeDashoffset: { duration: 0 },
              opacity: { duration: 0.5 }
            }}
          />
        );
      })}
    </svg>
  );
};

export default CheckProgressRing;

