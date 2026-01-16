import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

const TryIndicator = ({ triesRemaining, totalTries = 5, hasChanges = true, skipAnimation = false, className = '' }) => {
  // Track previous tries to detect when one is lost
  const prevTriesRef = useRef(triesRemaining);
  const [animatingIndex, setAnimatingIndex] = useState(null);

  useEffect(() => {
    if (triesRemaining < prevTriesRef.current) {
      // A try was just lost - animate the dot at index `triesRemaining`
      setAnimatingIndex(triesRemaining);
      const timer = setTimeout(() => setAnimatingIndex(null), 500);
      return () => clearTimeout(timer);
    }
    prevTriesRef.current = triesRemaining;
  }, [triesRemaining]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: .3 }}
        className={`flex gap-1 ${className}`}
      >
        {Array.from({ length: totalTries }, (_, i) => {
          const isAnimating = animatingIndex === i;
          const isActive = i < triesRemaining;
          
          return (
            <motion.div
              key={i}
              initial={skipAnimation ? false : { scale: 0 }}
              animate={isAnimating 
                ? {
                    scale: [1, 1.25, 1],
                    backgroundColor: ['#2DD4BF', '#EF4444', '#164E63'] // teal-400 → red-500 → cyan-900
                  }
                : { scale: 1 }
              }
              transition={isAnimating ? { duration: 0.45 } : { duration: 0 }}
              className={`w-2.5 h-2.5 rounded-full ${
                isAnimating 
                  ? '' // Let framer-motion control color during animation
                  : isActive 
                    ? 'bg-teal-400 shadow-lg' 
                    : 'bg-cyan-900'
              }`}
            />
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
};

export default TryIndicator;

