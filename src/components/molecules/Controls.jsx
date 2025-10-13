import Button from '../atoms/Button';
import TryIndicator from './TryIndicator';

const Controls = ({ 
  gameStatus,
  hasChanges,
  triesRemaining,
  totalTries = 5,
  isChecking,
  onCheck,
  onReset,
  className = ''
}) => {
  return (
    <div className={`absolute flex flex-col items-center gap-2 top-[176px] left-1/2 -translate-x-1/2 ${className}`}>
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
      
      {/* Try Indicator */}
      <TryIndicator 
        triesRemaining={triesRemaining} 
        totalTries={totalTries} 
        hasChanges={hasChanges}
      />

      {/* Reset Button */}
      {gameStatus !== 'playing' && (
        <Button onClick={onReset}>
          Reset
        </Button>
      )}
    </div>
  );
};

export default Controls;

