import { motion } from 'framer-motion';
import { useEffect } from 'react';

const PieceModal = ({ 
  piece, 
  imageSrc, 
  feedback = null,
  isCorrectLocked = false,
  isWrongPersistent = false,
  onClose, 
  className = '' 
}) => {
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

  // Background color based on state
  const getBgColor = () => {
    if (isCorrectLocked) return '#CCFBF1'; // teal-100
    if (feedback === 'wrong' || isWrongPersistent) return '#FEE2E2'; // red-100 (persistent or temporary)
    return '#F6F4EE'; // cotton-300 default
  };

  // Border color based on state
  const getBorderColor = () => {
    if (isCorrectLocked) return 'border-teal-500'; // Correct position
    if (feedback === 'wrong' || isWrongPersistent) return 'border-red-500'; // Wrong position
    return 'border-cyan-900'; // Default unchecked
  };

  return (
    <motion.div
      initial={{ scale: 0.75, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.75, opacity: 0 }}
      transition={{ 
        duration: 0.20,
        ease: "easeInOut"
      }}
      className={`PieceModal absolute top-[80px] left-1/2 -translate-x-1/2 w-[228px] h-[228px] border-8 ${getBorderColor()} rounded-full bg-sky-975 flex items-center justify-center pointer-events-none ${className}`}
    >
      {/* Background color layer */}
      <div 
        className="absolute w-[212px] h-[212px] rounded-full pointer-events-none"
        style={{ backgroundColor: getBgColor() }}
      />
      
      {/* Piece image on top */}
      <img 
        src={imageSrc} 
        alt={piece}
        className="relative w-[212px] h-[212px] rounded-full object-cover drop-shadow-item-xl"
      />
    </motion.div>
  );
};

export default PieceModal;

