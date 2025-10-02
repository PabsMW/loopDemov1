import { motion } from 'framer-motion';
import { useRef } from 'react';

const BoardSpace = ({ 
  index, 
  piece = null,
  feedback = null, // 'correct' | 'wrong' | null
  onClick,
  isLocked = false,
  className = ''
}) => {
  const dropZoneRef = useRef(null);

  const handleClick = () => {
    if (!isLocked && onClick) {
      onClick(index);
    }
  };

  // Background color based on feedback
  const getBgColor = () => {
    if (feedback === 'correct') return 'bg-green-400';
    if (feedback === 'wrong') return 'bg-red-400';
    return 'bg-[url(/images/item-default.svg)]';
  };

  return (
    <motion.div
      ref={dropZoneRef}
      onClick={handleClick}
      data-drop-index={index}
      className={`board-space relative flex justify-center items-center w-[68px] h-[68px] ${getBgColor()} bg-cover bg-center rounded-full ${!isLocked ? 'cursor-pointer' : ''} ${className}`}
      animate={feedback === 'wrong' ? {
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 }
      } : {}}
      whileHover={!isLocked && !piece ? { scale: 1.05 } : {}}
    >
      {piece && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {piece}
        </div>
      )}
      
      {/* Empty state indicator */}
      {!piece && !feedback && (
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      )}
    </motion.div>
  );
};

export default BoardSpace;

