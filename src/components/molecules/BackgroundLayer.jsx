import { motion } from 'framer-motion';

const BackgroundLayer = ({ gameStatus, className = '' }) => {
  return (
    <div className={`BackgroundLayer absolute inset-0 z-1 w-[390px] h-[390px] ${className}`}>
      {/* Radial gradient background */}
      <div className="absolute inset-0 [background:var(--bg-primary)]" />
      
      {/* Game board ring - centered */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[326px] h-[326px] bg-[url(/images/bg-ring-sm.svg)] bg-contain bg-center bg-no-repeat" />
      </div>
    </div>
  );
};

export default BackgroundLayer;

