import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import Tooltip from '../atoms/Tooltip';
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
  onCloseZoom,
  onPointerDown,
  fromType,
  fromIndex,
  feedback = null, // 'correct' | 'wrong' | 'partial' | null
  isCorrectLocked = false, // For starter piece and permanently correct pieces
  isWrongPersistent = false, // Piece is wrong and persists until moved
  isPartialPersistent = false, // Piece is correctly connected but wrong position
  interactionMode = 'option1', // 'option1' = Tap & Drag, 'option2' = Drag Only
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
  const [hasDragged, setHasDragged] = useState(false);
  
  // Tooltip for locked pieces
  const [showLockedTooltip, setShowLockedTooltip] = useState(false);
  const longPressTimerRef = useRef(null);
  const zoomOpenedViaLongPress = useRef(false);
  const dragZoomTimerRef = useRef(null);
  const lastDragPosition = useRef({ x: 0, y: 0 });
  
  // Background color based on feedback or correct/wrong/partial locked state
  const getBgColor = () => {
    // Correct locked (starter or validated correct)
    if (isCorrectLocked) {
      // Option 2: Use cotton (neutral), Option 1: Use teal
      return interactionMode === 'option2' ? 'bg-cotton-300' : 'bg-teal-100';
    }
    // Temporary feedback during check
    if (feedback === 'correct') {
      return interactionMode === 'option2' ? 'bg-cotton-300' : 'bg-teal-100';
    }
    // Partial state (correctly connected but wrong position) - amber/yellow background
    if (feedback === 'partial' || isPartialPersistent) {
      return 'bg-amber-100';
    }
    // Wrong state (persistent until moved or temporary during check)
    if (feedback === 'wrong' || isWrongPersistent) {
      return 'bg-red-100';
    }
    return 'bg-cotton-300'; // Default
  };

  // Get active ring SVG based on location
  const activeRingSvg = fromType === 'board' 
    ? '/images/piece-active-board.svg' 
    : '/images/piece-active-tray.svg';
  
  // Handle pointer down for locked pieces and Option 2 long-press zoom
  const handlePointerDownInternal = (e) => {
    // Option 2: Long press triggers zoom for all pieces (Option 3 uses drag timer instead)
    if (interactionMode === 'option2') {
      const boardSpace = e.currentTarget?.closest('.board-space');
      
      longPressTimerRef.current = setTimeout(() => {
        // Open zoom for all pieces
        if (onClick) {
          onClick(e);
          zoomOpenedViaLongPress.current = true;  // Track that zoom was opened
        }
        
        // If locked, also show tooltip and shake
        if (isCorrectLocked && !isDraggable) {
          setShowLockedTooltip(true);
          
          // Trigger shake on parent BoardSpace
          if (boardSpace) {
            boardSpace.classList.add('shake-animation');
            setTimeout(() => boardSpace.classList.remove('shake-animation'), 500);
          }
          
          setTimeout(() => setShowLockedTooltip(false), 2000);
        }
      }, 500);
      return;
    }
    
    // Option 1: Locked piece long press for shake
    if (isCorrectLocked && !isDraggable) {
      const boardSpace = e.currentTarget?.closest('.board-space');
      
      longPressTimerRef.current = setTimeout(() => {
        setShowLockedTooltip(true);
        
        // Trigger shake on parent BoardSpace
        if (boardSpace) {
          boardSpace.classList.add('shake-animation');
          setTimeout(() => boardSpace.classList.remove('shake-animation'), 500);
        }
        
        setTimeout(() => setShowLockedTooltip(false), 2000);
      }, 500);
      return;
    }
    
    // Call original handler if provided
    if (onPointerDown) onPointerDown(e);
  };
  
  // Handle pointer up/leave - cancel long press timer and close zoom in Option 2
  const handlePointerUpInternal = (e) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    
    // Option 2: Close zoom on release if opened via long-press (and not currently dragging)
    if (interactionMode === 'option2' && !isDraggingSelf && zoomOpenedViaLongPress.current && onCloseZoom) {
      onCloseZoom();
      zoomOpenedViaLongPress.current = false;  // Reset flag
    }
  };

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
      {isSelected && interactionMode === 'option1' && (
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
          setHasDragged(true);
          
          // Cancel long-press timer when drag starts
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
          }
          
          // Option 3: Initialize drag position tracking
          if (interactionMode === 'option3') {
            lastDragPosition.current = { x: info.point.x, y: info.point.y };
          }
          
          if (onDragStart) {
            onDragStart(event, info, { id, fromType, fromIndex });
          }
        }}
        onDrag={(event, info) => {
          // Option 2: Close zoom when user starts moving (if opened via long-press)
          if (interactionMode === 'option2' && zoomOpenedViaLongPress.current && onCloseZoom) {
            onCloseZoom();
            zoomOpenedViaLongPress.current = false;
          }
          
          // Option 3: Zoom triggers when paused during drag (not moving for 0.5s)
          if (interactionMode === 'option3') {
            const currentX = info.point.x;
            const currentY = info.point.y;
            
            // Calculate movement distance from last position
            const deltaX = Math.abs(currentX - lastDragPosition.current.x);
            const deltaY = Math.abs(currentY - lastDragPosition.current.y);
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Two thresholds: wiggle vs intentional movement
            const hasWiggled = distance > 2;   // Any movement resets pause timer
            const hasMoved = distance > 3;     // Only larger movement closes zoom
            
            if (hasWiggled) {
              // Clear timer on any movement
              if (dragZoomTimerRef.current) {
                clearTimeout(dragZoomTimerRef.current);
                dragZoomTimerRef.current = null;
              }
              
              // Only close zoom on intentional movement (>5px total distance)
              if (hasMoved && zoomOpenedViaLongPress.current && onCloseZoom) {
                onCloseZoom();
                zoomOpenedViaLongPress.current = false;
              }
              
              lastDragPosition.current = { x: currentX, y: currentY };
            } else if (!dragZoomTimerRef.current && !zoomOpenedViaLongPress.current) {
              // Stationary - start timer for zoom
              dragZoomTimerRef.current = setTimeout(() => {
                if (onClick) {
                  onClick(event);
                  zoomOpenedViaLongPress.current = true;
                }
              }, 500);
            }
          }
          
          if (onDrag) {
            onDrag(event, info, { id, fromType, fromIndex });
          }
        }}
        onDragEnd={(event, info) => {
          setIsDraggingSelf(false);
          
          // Clear drag zoom timer (Option 3)
          if (dragZoomTimerRef.current) {
            clearTimeout(dragZoomTimerRef.current);
            dragZoomTimerRef.current = null;
          }
          
          // Option 2 & 3: Close zoom when drag ends (if opened via long-press or drag)
          if ((interactionMode === 'option2' || interactionMode === 'option3') && zoomOpenedViaLongPress.current && onCloseZoom) {
            onCloseZoom();
            zoomOpenedViaLongPress.current = false;
          }
          
          // Reset drag flag after a delay (after onClick might fire)
          setTimeout(() => setHasDragged(false), 100);
          
          if (onDragEnd) {
            onDragEnd(event, info, { id, fromType, fromIndex });
          }
        }}

        onClick={(e) => {
          // Block if just finished dragging
          if (hasDragged) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          
          // Option 1 & 4: Click opens zoom
          if ((interactionMode === 'option1' || interactionMode === 'option4') && onClick) {
            onClick(e);
          }
          // Option 2 & 3: Block all clicks
          if (interactionMode === 'option2' || interactionMode === 'option3') {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onPointerDown={handlePointerDownInternal}
        onPointerUp={handlePointerUpInternal}
        onPointerLeave={handlePointerUpInternal}
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
              ? (interactionMode === 'option2' ? '#DBFCF5' : '#CCFBF1')  // Option 2: soft teal, Option 1: teal
              : feedback === 'wrong'
              ? '#FEE2E2'  // red-100 (only during check animation)
              : '#F6F4EE'  // cotton-300 (default + wrong after check)
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
      
      {/* Locked piece tooltip */}
      {fromType === 'board' && (
        <AnimatePresence>
          <Tooltip text=" 🔒 Correct Place" show={showLockedTooltip && isCorrectLocked} />
        </AnimatePresence>
      )}
    </div>
  );
};

export default GamePiece;

