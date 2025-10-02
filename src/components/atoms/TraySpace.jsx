import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

const TraySpace = ({ 
  index,
  piece = null,
  onClick,
  setPosition,
  isEmpty = false,
  className = ''
}) => {
  const ref = useRef(null);
  
  // Update position tracking for reordering
  useEffect(() => {
    if (ref.current && setPosition) {
      const rect = ref.current.getBoundingClientRect();
      setPosition(index, {
        left: rect.left,
        width: rect.width,
      });
    }
  });
  
  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      className={`tray-space relative flex justify-center items-center w-[50px] h-[50px] rounded-full ${!isEmpty ? 'cursor-pointer' : ''} ${className}`}
      whileHover={!isEmpty ? { scale: 1.05, rotate: 3 } : {}}
      whileTap={!isEmpty ? { scale: 0.95 } : {}}
      transition={{ duration: 0.2 }}
    >
      {/* Empty state indicator - shows when no piece */}
      {!piece && (
        <div className='absolute h-[14px] w-[14px] bg-cyan-900 rounded-full'/>
      )}
      
      {/* GamePiece - shows when piece exists */}
      {piece && (
        <div className="flex items-center justify-center">
          {piece}
        </div>
      )}
    </motion.div>
  );
};

export default TraySpace;

