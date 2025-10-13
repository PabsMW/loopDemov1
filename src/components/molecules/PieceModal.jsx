import { motion } from 'framer-motion';
import { useEffect } from 'react';

const PieceModal = ({ piece, imageSrc, isVisible, onClose, className = '' }) => {
  // Handle ESC key press
  useEffect(() => {
    if (!isVisible) return; // Only listen when visible
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, isVisible]);

  if (!isVisible || !piece) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      className={`PieceModal absolute top-[80px] left-1/2 -translate-x-1/2 w-[228px] h-[228px] border-8 border-teal-300 rounded-full bg-sky-975 flex items-center justify-center pointer-events-none ${className}`}
    >
      <img 
        src={imageSrc} 
        alt={piece}
        className="w-[212px] h-[212px] rounded-full bg-cotton-300 object-cover"
      />
    </motion.div>
  );
};

export default PieceModal;

