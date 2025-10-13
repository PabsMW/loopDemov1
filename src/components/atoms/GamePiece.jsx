import { motion } from 'framer-motion';
import { useState } from 'react';

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
  swapOffset = { x: 0, y: 0 }, // Offset for swap preview animation
  className = ''
}) => {
  // Size based on location: 60px on board, 50px in tray
  const size = fromType === 'board' ? 60 : 50;
  
  // Track hover state and dragging state
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggingSelf, setIsDraggingSelf] = useState(false);
  
  // Background color based on feedback or correct locked state
  const getBgColor = () => {
    // Correct locked (starter or validated correct) - always teal
    if (isCorrectLocked) return 'bg-teal-100';
    // Temporary feedback during check
    if (feedback === 'correct') return 'bg-teal-100';
    if (feedback === 'wrong') return 'bg-red-100';
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
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover ring (z-0) - behind everything, only for tray pieces */}
      {showHoverRing && (
        <motion.img
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
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
          transition={{ duration: 0.2 }}
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
        layout
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
        className={`piece-that-drags box-shadow-piece-dragging rounded-full relative cursor-grab active:cursor-grabbing ${className}`}
        whileDrag={{ scale: 1, zIndex: 9999, pointerEvents: 'none' }}
        animate={{
          x: swapOffset.x,
          y: swapOffset.y,
          scale: swapOffset.scale || 1
        }}
        transition={{ 
          x: { type: "spring", stiffness: 400, damping: 25 },
          y: { type: "spring", stiffness: 400, damping: 25 },
          scale: { type: "spring", stiffness: 400, damping: 25 }
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
              : feedback === 'wrong' 
              ? '#FEE2E2'  // red-100
              : '#F6F4EE'  // cotton-300
          }}
          transition={{ 
            width: { type: "spring", stiffness: 500, damping: 30 },
            height: { type: "spring", stiffness: 500, damping: 30 },
            backgroundColor: { duration: 0.5, ease: "easeInOut" }
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
            stiffness: 500,
            damping: 30
          }}
          style={{ zIndex: 1 }}
        />
      </motion.div>
    </div>
  );
};

export default GamePiece;

