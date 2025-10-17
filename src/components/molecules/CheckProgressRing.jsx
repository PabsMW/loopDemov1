import { motion } from 'framer-motion';
import { CHECK_PROGRESS_DURATION } from '../../constants/animations';

const CheckProgressRing = ({ 
  segments = [],
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
      {segments.map((segment, index) => (
        <motion.path
          key={index}
          d={createArcPath(index)}
          fill="none"
          stroke={segment.isCorrect ? "#5EEAD4" : "#EF4444"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          initial={{ strokeDashoffset: arcLength, opacity: 1 }}
          animate={isChecking ? {
            strokeDashoffset: 0,
            opacity: 1
          } : {
            strokeDashoffset: 0,
            opacity: segment.isCorrect ? 1 : 0  // Keep teal, fade red
          }}
          transition={isChecking ? { 
            strokeDashoffset: {
              delay: index * segmentDuration,
              duration: segmentDuration,
              ease: "linear"
            }
          } : {
            opacity: { duration: 1 }
          }}
        />
      ))}
    </svg>
  );
};

export default CheckProgressRing;

