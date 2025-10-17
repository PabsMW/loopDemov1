import { motion } from 'framer-motion';
import { CHECK_PROGRESS_DURATION } from '../../constants/animations';

const FailX = ({ className = '' }) => {
  const pathLength = 45; // Approximate path length for diagonal stroke
  const strokeDuration = 0.4;

  return (
    <div className="relative inline-block">
      {/* Blurred backdrop X for glow effect */}
      <motion.svg 
        width="39" 
        height="39" 
        viewBox="0 0 39 39"
        fill="none"
        className="absolute top-0 left-0"
        style={{ 
          scale: 1.3, 
          filter: 'blur(15px)',
          pointerEvents: 'none'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Blurred first diagonal stroke */}
        <motion.path
          d="M35 4 L3.5 35.5"
          fill="none"
          stroke="#EF4444"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength}
          animate={{ strokeDashoffset: 0 }}
          transition={{ 
            duration: strokeDuration, 
            delay: 0, 
            ease: "easeOut" 
          }}
        />
        
        {/* Blurred second diagonal stroke */}
        <motion.path
          d="M4 4 L35.5 35.5"
          fill="none"
          stroke="#EF4444"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength}
          animate={{ strokeDashoffset: 0 }}
          transition={{ 
            duration: strokeDuration, 
            delay: strokeDuration, 
            ease: "easeOut" 
          }}
        />
      </motion.svg>

      {/* Main X on top */}
      <motion.svg 
        width="39" 
        height="39" 
        viewBox="0 0 39 39"
        fill="none"
        className={`relative ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* First diagonal stroke (top-right to bottom-left) */}
        <motion.path
          d="M35 4 L3.5 35.5"
          fill="none"
          stroke="#EF4444"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength}
          animate={{ strokeDashoffset: 0 }}
          transition={{ 
            duration: strokeDuration, 
            delay: 0, 
            ease: "easeOut" 
          }}
        />
        
        {/* Second diagonal stroke (top-left to bottom-right) - draws after first */}
        <motion.path
          d="M4 4 L35.5 35.5"
          fill="none"
          stroke="#EF4444"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength}
          animate={{ strokeDashoffset: 0 }}
          transition={{ 
            duration: strokeDuration, 
            delay: strokeDuration, 
            ease: "easeOut" 
          }}
        />
      </motion.svg>
    </div>
  );
};

export default FailX;

