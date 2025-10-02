import { motion } from 'framer-motion';

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
  className = ''
}) => {
  return (
    <motion.img
      src={imageSrc}
      alt={alt || id}
      drag={isDraggable}
      dragDirectionLock={dragDirectionLock}
      onDirectionLock={onDirectionLock}
      dragMomentum={false}
      dragElastic={0.1}
      dragSnapToOrigin
      onDragStart={(event, info) => {
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
        if (onDragEnd) {
          onDragEnd(event, info, { id, fromType, fromIndex });
        }
      }}
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={`drop-shadow-item-xs cursor-grab active:cursor-grabbing select-none bg-cotton-300 rounded-full ${isSelected ? 'ring-4 ring-cyan-500 ring-offset-2' : ''} ${fromType === 'tray' ? 'pointer-events-none' : ''} ${className}`}
      whileHover={isDraggable ? { scale: 1.05 } : {}}
      whileTap={isDraggable ? { scale: 0.95 } : {}}
      whileDrag={{ scale: 1.1, zIndex: 1000 }}
      animate={isSelected ? { scale: 1.05 } : {}}
      transition={{ 
        type: "spring",
        stiffness: 500,
        damping: 30
      }}
      style={{
        maxWidth: '50px',
        maxHeight: '50px',
        width: 'auto',
        height: 'auto',
      }}
    />
  );
};

export default GamePiece;

