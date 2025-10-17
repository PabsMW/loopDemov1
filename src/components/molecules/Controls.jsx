import { motion } from 'framer-motion';
import Button from '../atoms/Button';
import TryIndicator from './TryIndicator';
import WinCheckmark from './WinCheckmark';
import FailX from './FailX';

const Controls = ({ 
  gameStatus,
  hasChanges,
  triesRemaining,
  totalTries = 5,
  isChecking,
  onCheck,
  className = ''
}) => {
  return (
    <div className={`Controls absolute flex flex-col items-center gap-2 top-[176px] left-1/2 -translate-x-1/2 ${className}`}>
      {/* Win Message */}
      {gameStatus === 'won' && (
        <div className="flex flex-col items-center gap-2 mt-[-42px]">
          <WinCheckmark />
          <motion.h2 
            className="text-4xl font-comfortaa text-white"
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            Perfect!
          </motion.h2>
        </div>
      )}
      
      {/* Fail Message */}
      {gameStatus === 'failed' && (
        <div className="flex flex-col items-center gap-2 mt-[-42px]">
          <FailX />
          <motion.h2 
            className="text-3xl font-comfortaa text-white"
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            Out of Tries
          </motion.h2>
        </div>
      )}
      
      {/* Check Button */}
      {gameStatus === 'playing' && (
        <Button 
          onClick={onCheck} 
          disabled={!hasChanges || isChecking}
          tooltipText="Make a move first!"
        >
          CHECK
        </Button>
      )}
      
      {/* Try Indicator - Always show when active or game over */}
      <TryIndicator 
        triesRemaining={triesRemaining} 
        totalTries={totalTries} 
        hasChanges={hasChanges || gameStatus !== 'playing'}
        skipAnimation={gameStatus !== 'playing'}
      />
    </div>
  );
};

export default Controls;

