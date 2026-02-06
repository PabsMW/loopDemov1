import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Close button icon component
const CloseIcon = ({ color = '#64748B' }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const PieceModal = ({ 
  piece, 
  imageSrc, 
  feedback = null,
  isCorrectLocked = false,
  isWrongPersistent = false,
  isPartialPersistent = false,
  interactionMode = 'option1',
  onClose, 
  className = '' 
}) => {
  const [isCloseHovered, setIsCloseHovered] = useState(false);

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Option 1 and Option 4 share the same visual style (large, no border, close button)
  const isOption1Style = interactionMode === 'option1' || interactionMode === 'option4';

  // Background color based on state
  const getBgColor = () => {
    if (isCorrectLocked) {
      // Option 2/3: soft teal, Option 1/4: teal
      return !isOption1Style ? '#DBFCF5' : '#CCFBF1';
    }
    if (feedback === 'partial' || isPartialPersistent) return '#FEF3C7'; // amber-100
    if (feedback === 'wrong') return '#FEE2E2'; // red-100 (only during check)
    return '#F6F4EE'; // cotton-300 default
  };

  // Border color based on state (only used in Option 2/3)
  const getBorderColor = () => {
    if (isCorrectLocked) return 'border-teal-500';
    if (feedback === 'partial' || isPartialPersistent) return 'border-amber-500';
    if (feedback === 'wrong') return 'border-red-500';
    return 'border-cyan-900';
  };

  // Sizes based on interaction mode
  const outerSize = isOption1Style ? 'w-[236px] h-[236px]' : 'w-[228px] h-[228px]';
  const innerSize = isOption1Style ? 'w-[220px] h-[220px]' : 'w-[212px] h-[212px]';
  const borderStyle = isOption1Style ? 'border-0' : `border-8 ${getBorderColor()}`;

  return (
    <motion.div
      initial={{ scale: 0.75, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.75, opacity: 0 }}
      transition={{ 
        duration: 0.20,
        ease: "easeInOut"
      }}
      className={`PieceModal absolute z-40 ${isOption1Style ? 'top-[76px]' : 'top-[80px]'} left-1/2 -translate-x-1/2 ${outerSize} ${borderStyle} rounded-full bg-sky-975 flex items-center justify-center pointer-events-none ${className}`}
      style={{
        backgroundColor: getBgColor(),
        boxShadow: '0 44px 17px 0 rgba(2, 7, 24, 0.14), 0 25px 15px 0 rgba(2, 7, 24, 0.20), 0 11px 11px 0 rgba(2, 7, 24, 0.30), 0 3px 6px 0 rgba(2, 7, 24, 0.40)'
      }}
    >
      {/* Background color layer */}
      <div 
        className={`absolute ${innerSize} rounded-full pointer-events-none`}
      />
      
      {/* Piece image on top */}
      <img 
        src={imageSrc} 
        alt={piece}
        className={`relative ${innerSize} rounded-full object-cover drop-shadow-item-xl`}
      />

      {/* Close button - Option 1 & 4 only */}
      {isOption1Style && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.15 }}
          onClick={onClose}
          onMouseEnter={() => setIsCloseHovered(true)}
          onMouseLeave={() => setIsCloseHovered(false)}
          className="absolute top-[20px] right-[20px] w-9 h-9 rounded-full flex items-center justify-center pointer-events-auto cursor-pointer transition-colors duration-150"
          style={{ 
            backgroundColor: isCloseHovered ? '#FFFFFF' : '#EFEBE1',
          }}
          aria-label="Close"
        >
          <CloseIcon color={isCloseHovered ? '#1E293B' : '#64748B'} />
        </motion.button>
      )}
    </motion.div>
  );
};

export default PieceModal;
