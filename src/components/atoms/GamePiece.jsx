import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  SWAP_FLY_DURATION, 
  RING_FADE_DURATION, 
  COLOR_FADE,
  OPACITY_FADE_DURATION,
  PIECE_SPRING,
  SIZE_SPRING 
} from '../../constants/animations';

const GamePiece = ({ 
  id, 
  imageSrc, 
  alt, 
  isSelected = false, 
  isDraggable = true,
  isDraggingInTray = false,
  dragDirectionLock = false,
  onDirectionLock,
  onDragStart,
  onDrag,
  onDragEnd,
  onClick,
  onPointerDown,
  fromType,
  fromIndex,
  feedback = null, // 'correct' | 'wrong' | null
  isCorrectLocked = false, // For starter piece and permanently correct pieces
  isWrongPersistent = false, // Piece is wrong and persists until moved
  swapOffset = { x: 0, y: 0 }, // Offset for swap preview animation
  swapAnimation = null, // Fly-fade animation during swap
  delayLayout = false, // Delay layout animation for dragged piece during swap
  className = ''
}) => {
  // Size based on location: 60px on board, 50px in tray
  const size = fromType === 'board' ? 60 : 50;
  
  // Track hover state and dragging state
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggingSelf, setIsDraggingSelf] = useState(false);
  
  // Background color based on feedback or correct/wrong locked state
  const getBgColor = () => {
    // Correct locked (starter or validated correct) - always teal
    if (isCorrectLocked) return 'bg-teal-100';
    // Temporary feedback during check
    if (feedback === 'correct') return 'bg-teal-100';
    // Wrong state (persistent until moved or temporary during check)
    if (feedback === 'wrong' || isWrongPersistent) {
      console.log(`Piece ${id} at ${fromIndex}: feedback=${feedback}, isWrongPersistent=${isWrongPersistent}`);
      return 'bg-red-100';
    }
    return 'bg-cotton-300'; // Default
  };

  // Get active ring SVG based on location
  const activeRingSvg = fromType === 'board' 
    ? '/images/piece-active-board.svg' 
    : '/images/piece-active-tray.svg';

  const ringSize = fromType === 'board' ? 68 : 56;
  const showHoverRing = isHovered && !isDraggingSelf && fromType === 'tray';
  
  return (
    <div 
      className="GamePiece relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover ring (z-0) - behind everything, only for tray pieces */}
      {showHoverRing && (
        <motion.img
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: RING_FADE_DURATION }}
          src="/images/piece-hover-tray.svg"
          alt="hover"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: '56px',
            height: '56px',
            minWidth: '56px',
            minHeight: '56px',
            maxWidth: '56px',
            maxHeight: '56px',
            zIndex: 0
          }}
        />
      )}

      {/* Active ring (z-1) - middle layer */}
      {isSelected && (
        <motion.img
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: RING_FADE_DURATION }}
          src={activeRingSvg}
          alt="selected"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-ring-active pointer-events-none"
          style={{
            width: `${ringSize}px`,
            height: `${ringSize}px`,
            minWidth: `${ringSize}px`,
            minHeight: `${ringSize}px`,
            maxWidth: `${ringSize}px`,
            maxHeight: `${ringSize}px`,
            zIndex: 1
          }}
        />
      )}

      {/* Draggable wrapper (z-2) - contains bg-color and image, moves during drag */}
      <motion.div
        layout={!delayLayout}
        drag={isDraggable}
        dragDirectionLock={dragDirectionLock}
        onDirectionLock={onDirectionLock}
        dragMomentum={false}
        dragElastic={0.1}
        dragSnapToOrigin
        onDragStart={(event, info) => {
          setIsDraggingSelf(true);
          if (onDragStart) {
            onDragStart(event, info, { id, fromType, fromIndex });
          }
        }}
        onDrag={(event, info) => {
          if (onDrag) {
            onDrag(event, info, { id, fromType, fromIndex });
          }
        }}
        onDragEnd={(event, info) => {
          setIsDraggingSelf(false);
          if (onDragEnd) {
            onDragEnd(event, info, { id, fromType, fromIndex });
          }
        }}

        onClick={onClick}
        onPointerDown={onPointerDown}
        className={`piece-that-drags box-shadow-piece-dragging rounded-full relative ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${className}`}
        whileDrag={{ scale: 1, zIndex: 9999, pointerEvents: 'none' }}
        initial={swapAnimation ? {
          x: swapAnimation.startX,
          y: swapAnimation.startY,
          scale: 0.84,
          opacity: 1
        } : false}
        animate={swapAnimation || {
          x: swapOffset.x,
          y: swapOffset.y,
          scale: swapOffset.scale || 1,
          opacity: 1
        }}
        transition={{ 
          x: { duration: swapAnimation ? SWAP_FLY_DURATION : undefined, ease: swapAnimation ? "easeOut" : undefined, type: swapAnimation ? "tween" : "spring", ...PIECE_SPRING },
          y: { duration: swapAnimation ? SWAP_FLY_DURATION : undefined, ease: swapAnimation ? "easeOut" : undefined, type: swapAnimation ? "tween" : "spring", ...PIECE_SPRING },
          scale: { type: "spring", ...PIECE_SPRING },
          opacity: { duration: swapAnimation ? SWAP_FLY_DURATION : OPACITY_FADE_DURATION }
        }}
        style={{ zIndex: 2 }}
      >
        {/* Background color div - behind image, animates with feedback */}
        <motion.div
          className="absolute top-0 left-0 rounded-full pointer-events-none"
          animate={{
            width: size,
            height: size,
            backgroundColor: isCorrectLocked || feedback === 'correct' 
              ? '#CCFBF1'  // teal-100
              : feedback === 'wrong' || isWrongPersistent
              ? '#FEE2E2'  // red-100 (temporary or persistent)
              : '#F6F4EE'  // cotton-300
          }}
          transition={{ 
            width: { type: "spring", ...SIZE_SPRING },
            height: { type: "spring", ...SIZE_SPRING },
            backgroundColor: { ...COLOR_FADE }
          }}
          style={{ zIndex: 0 }}
        />

        {/* Piece image - on top, transparent background */}
        <motion.img
          src={imageSrc}
          alt={alt || id}
          className="relative drop-shadow-item-xs select-none rounded-full pointer-events-none"
          animate={{
            width: size,
            height: size,
          }}
          transition={{ 
            type: "spring",
            ...SIZE_SPRING
          }}
          style={{ zIndex: 1 }}
        />
      </motion.div>
    </div>
  );
};

export default GamePiece;

