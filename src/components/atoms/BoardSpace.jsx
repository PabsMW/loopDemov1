import { motion } from 'framer-motion';
import { useRef } from 'react';

const BoardSpace = ({ 
  index, 
  piece = null,
  feedback = null, // 'correct' | 'wrong' | null
  onClick,
  isLocked = false,
  isDragging = false,
  isCorrectLocked = false,
  className = ''
}) => {
  const dropZoneRef = useRef(null);

  const handleClick = () => {
    if (!isLocked && !isCorrectLocked && onClick) {
      onClick(index);
    }
  };

  // Background SVG based on state
  const getBgImage = () => {
    // Correct locked (starter or validated correct)
    if (isCorrectLocked) {
      return 'bg-[url(/images/board-space-correct.svg)]';
    }
    // Wrong feedback (temporary, 2 seconds)
    if (feedback === 'wrong') {
      return 'bg-[url(/images/board-space-wrong.svg)]';
    }
    // Drop zone state during drag (highlight background)
    if (isDragging && !isLocked && !isCorrectLocked) {
      return 'bg-[url(/images/board-space-highlight.svg)]';
    }
    // Default (occupied but unchecked, or empty)
    return 'bg-[url(/images/item-default.svg)]';
  };

  // Show hover ring when hovering over valid spaces (empty or occupied, not locked)
  const canShowHoverRing = !isLocked && !isCorrectLocked;

  return (
    <motion.div
      ref={dropZoneRef}
      onClick={handleClick}
      data-drop-index={index}
      className={`board-space group relative flex shrink-0 justify-center items-center w-[68px] h-[68px] ${getBgImage()} bg-cover bg-center rounded-full ${!isLocked && !isCorrectLocked ? 'cursor-pointer' : ''} ${className}`}
      animate={feedback === 'wrong' ? {
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 }
      } : {}}
    >
      {/* Hover Ring - appears on hover (always, not just when dragging) */}
      {canShowHoverRing && (
        <div
          className="absolute inset-0 -m-[5px] w-[78px] h-[78px] z-0 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out pointer-events-none"
          style={{
            backgroundImage: 'url(/images/board-space-hover.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}

      {/* Game Piece - higher z-index */}
      {piece && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {piece}
        </div>
      )}
      
    </motion.div>
  );
};

export default BoardSpace;

