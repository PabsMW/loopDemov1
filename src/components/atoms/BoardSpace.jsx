import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

const BoardSpace = ({ 
  index, 
  piece = null,
  feedback = null, // 'correct' | 'wrong' | null
  onClick,
  isLocked = false,
  isDragging = false,
  isCorrectLocked = false,
  isWrongPersistent = false,
  hasSelectedPiece = false,
  interactionMode = 'option1',
  className = ''
}) => {
  const dropZoneRef = useRef(null);

  const handleClick = () => {
    // Option 2 & 3: Block clicks on BoardSpace
    if (interactionMode === 'option2' || interactionMode === 'option3') return;
    
    if (!isLocked && !isCorrectLocked && onClick) {
      onClick(index);
    }
  };

  // Get background image URL based on state
  const getBgImageUrl = () => {
    // Correct locked (starter or validated correct)
    if (isCorrectLocked) {
      return '/images/board-space-correct.svg';
    }
    // Wrong state (only temporary during check animation)
    if (feedback === 'wrong') {
      return '/images/board-space-wrong.svg';
    }
    // Drop zone state during drag (highlight background)
    if (isDragging && !isLocked && !isCorrectLocked) {
      return '/images/board-space-highlight.svg';
    }
    // Default (occupied but unchecked, or empty)
    return '/images/item-default.svg';
  };

  const currentBgImage = getBgImageUrl();

  // Show hover ring when dragging, space has piece, or piece selected for placement
  const canShowHoverRing = !isLocked && !isCorrectLocked && (isDragging || piece || hasSelectedPiece);
  
  // Show cursor pointer when there's something to interact with
  const showPointer = !isLocked && !isCorrectLocked && (
    piece ||           // Has piece (can click to select)
    isDragging ||      // Dragging over (can drop)
    hasSelectedPiece   // Piece selected elsewhere (can place via click)
  );

  return (
    <motion.div
      ref={dropZoneRef}
      onClick={handleClick}
      data-drop-index={index}
      className={`board-space group relative flex shrink-0 justify-center items-center w-[68px] h-[68px] rounded-full ${showPointer ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Base background layer - always visible */}
      <div 
        className="absolute inset-0 rounded-full bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/item-default.svg)' }}
      />
      
      {/* Overlay background layer - fades in when not default */}
      <AnimatePresence>
        {currentBgImage !== '/images/item-default.svg' && (
          <motion.div
            key={currentBgImage}
            className="absolute inset-0 rounded-full bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${currentBgImage})`,
              boxShadow: isCorrectLocked 
                ? '0 0 10px 0 #14B8A6' 
                : feedback === 'wrong' 
                  ? '0 0 12px 0 #9F1239' 
                  : 'none'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>
      
      {/* Hover Ring - appears on hover */}
      {canShowHoverRing && (
        <div
          className="hover-ring absolute inset-0 -m-[5px] w-[78px] h-[78px] z-10 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out pointer-events-none"
          style={{
            backgroundImage: 'url(/images/board-space-hover.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}

      {/* Game Piece - highest z-index */}
      {piece && (
        <div className="game-piece-wrapper absolute inset-0 flex items-center justify-center z-20">
          {piece}
        </div>
      )}
      
    </motion.div>
  );
};

export default BoardSpace;

