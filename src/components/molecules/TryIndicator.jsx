import { motion, AnimatePresence } from 'framer-motion';

const TryIndicator = ({ triesRemaining, totalTries = 5, hasChanges = true, className = '' }) => {
  // Hide when inactive (no changes)
  if (!hasChanges) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex gap-1 ${className}`}
      >
        {Array.from({ length: totalTries }, (_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i < triesRemaining 
                ? 'bg-teal-400 shadow-lg' 
                : 'bg-cyan-900 '
            }`}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

export default TryIndicator;

