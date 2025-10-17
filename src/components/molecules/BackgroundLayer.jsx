import { motion } from 'framer-motion';
import CheckProgressRing from './CheckProgressRing';

const BackgroundLayer = ({ 
  gameStatus, 
  isChecking = false,
  hasEverChecked = false,
  checkArcs = [],
  className = '' 
}) => {
  return (
    <div className={`BackgroundLayer absolute inset-0 z-1 w-[390px] h-[390px] ${className}`}>
      {/* Radial gradient background */}
      <div className="absolute inset-0 [background:var(--bg-primary)]" />
      
      {/* Game board ring - centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[326px] h-[326px]">
          {/* Static background ring */}
          <div className="w-full h-full bg-[url(/images/bg-ring-sm.svg)] bg-contain bg-center bg-no-repeat" />
          
          {/* Animated progress ring */}
          <CheckProgressRing 
            segments={checkArcs}
            isChecking={isChecking}
            hasEverChecked={hasEverChecked}
          />
        </div>
      </div>
    </div>
  );
};

export default BackgroundLayer;

