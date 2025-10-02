import { motion } from 'framer-motion';

const TryIndicator = ({ triesRemaining, totalTries = 5, className = '' }) => {
  return (
    <div className={`flex gap-2 ${className}`}>
      {Array.from({ length: totalTries }, (_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            i < triesRemaining 
              ? 'bg-cotton-500 shadow-lg' 
              : 'bg-cotton-200 opacity-50'
          }`}
        />
      ))}
    </div>
  );
};

export default TryIndicator;

