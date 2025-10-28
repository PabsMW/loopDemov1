import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Tooltip from './Tooltip';

const Button = ({ children, onClick, disabled = false, tooltipText = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleClick = (e) => {
    if (disabled) {
      setShowTooltip(true);
      setIsShaking(true);
      setTimeout(() => setShowTooltip(false), 2000);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    onClick(e);
  };

  return (
    <div className="relative inline-block">
      <motion.button
        onClick={handleClick}
        //disabled={disabled}
        className={`
          px-10 py-3 pt-3.5 font-comfortaa font-bold rounded-full text-lg leading-none border shadow-lg 
          ${disabled 
            ? 'bg-sky-950 border-teal-600 text-teal-600 cursor-not-allowed' 
            : 'bg-sky-975 text-teal-300 border-teal-300 hover:bg-teal-400 hover:text-sky-975 hover:shadow-xl'
          }
          transition-colors duration-500
        `}
        whileTap={!disabled ? { 
          scale: 1.05,
          transition: {
            duration: 0.2,
            ease: "easeInOut"
          }
        } : {}}
        animate={isShaking ? {
          x: [0, -10, 10, -10, 10, 0]
        } : {
          x: 0
        }}
        transition={isShaking ? {
          duration: 0.5,
          ease: "easeInOut"
        } : {}}
      >
        {children}
      </motion.button>
      
      {/* Tooltip */}
      <AnimatePresence>
        <Tooltip text={tooltipText} show={showTooltip && disabled} />
      </AnimatePresence>
    </div>
  );
};

export default Button;

