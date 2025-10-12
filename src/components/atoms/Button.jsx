import { motion } from 'framer-motion';
import { useState } from 'react';

const Button = ({ children, onClick, disabled = false, tooltipText = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = (e) => {
    if (disabled) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }
    onClick(e);
  };

  return (
    <div className="relative inline-block">
      <motion.button
        onClick={handleClick}
        disabled={disabled}
        className={`
          px-10 py-3 pt-3.5 font-comfortaa font-bold rounded-full text-lg leading-none border shadow-lg 
          ${disabled 
            ? 'bg-sky-950 text-sky-900 border-sky-950 cursor-not-allowed' 
            : 'bg-sky-975 text-teal-300 border-teal-300 hover:shadow-xl'
          }
          transition-all duration-500
        `}
        whileTap={!disabled ? { 
          rotate: 720, // 2 full rotations
          scale: 1.2,
          transition: {
            duration: 0.6,
            ease: "easeInOut"
          }
        } : {}}
      >
        {children}
      </motion.button>
      
      {/* Tooltip */}
      {showTooltip && disabled && tooltipText && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-sky-950 text-teal-300 text-sm rounded-lg whitespace-nowrap font-comfortaa"
        >
          {tooltipText}
        </motion.div>
      )}
    </div>
  );
};

export default Button;

