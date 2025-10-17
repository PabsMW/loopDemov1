import { motion } from 'framer-motion';
import { CHECK_PROGRESS_DURATION } from '../../constants/animations';

const WinCheckmark = ({ className = '' }) => {
  const pathLength = 80; // Approximate path length for simple stroke

  return (
    <div className="relative inline-block">
      {/* Blurred backdrop checkmark for glow effect */}
      <motion.svg 
        width="50" 
        height="42" 
        viewBox="0 0 50 42"
        fill="none"
        className="absolute top-0 left-0"
        style={{ 
          scale: 1.5, 
          filter: 'blur(15px)',
          pointerEvents: 'none'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <motion.path
          d="m4 22 16 16L46 4"
          fill="none"
          stroke="#99F6E4"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength}
          animate={{ strokeDashoffset: 0 }}
          transition={{ 
            duration: 0.8, 
            delay: 0, 
            ease: "easeOut" 
          }}
        />
      </motion.svg>

      {/* Main checkmark on top */}
      <motion.svg 
        width="50" 
        height="42" 
        viewBox="0 0 50 42"
        fill="none"
        className={`relative ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <motion.path
          d="m4 22 16 16L46 4"
          fill="none"
          stroke="#99F6E4"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength}
          animate={{ strokeDashoffset: 0 }}
          transition={{ 
            duration: 0.8, 
            delay: 0, 
            ease: "easeOut" 
          }}
        />
      </motion.svg>
    </div>
  );
};

export default WinCheckmark;

