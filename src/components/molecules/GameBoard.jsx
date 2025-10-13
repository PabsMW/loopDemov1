import { motion } from 'framer-motion';
import BoardSpace from '../atoms/BoardSpace';

const GameBoard = ({ 
  boardSpaces,
  allPieces,
  createBoardPiece,
  feedback,
  onBoardSpaceClick,
  isLocked,
  isDragging = false,
  correctPositions = [],
  activeBoardIndex = null,
  hoveredSwapTarget = null,
  className = ''
}) => {
  // Calculate position for each BoardSpace around the circle
  const getPosition = (index) => {
    const totalSpaces = 12;
    const angle = (index * (360 / totalSpaces) - 90) * (Math.PI / 180); // -90 to start at 12 o'clock
    const radius = 159; // Distance from center to place BoardSpaces (overlapping ring)
    const containerCenter = 195; // Half of 390px
    const boardSpaceSize = 68; // BoardSpace dimensions
    
    const x = containerCenter + radius * Math.cos(angle) - (boardSpaceSize / 2);
    const y = containerCenter + radius * Math.sin(angle) - (boardSpaceSize / 2);
    
    return { x, y };
  };

  return (
    <div className={`GameBoard relative flex items-center justify-center w-[390px] h-[390px] ${className}`}>
      {/* BoardSpaces positioned in circle */}
      {boardSpaces.map((piece, index) => {
        const { x, y } = getPosition(index);
        
        // Calculate swap offset for this piece if it's being hovered during drag
        const isHoverTarget = hoveredSwapTarget?.type === 'board' && hoveredSwapTarget.index === index;
        const isLeftSide = index >= 6 && index <= 11;
        const swapOffset = isHoverTarget 
          ? { x: isLeftSide ? 30 : -30, y: -10, scale: 0.84 }
          : { x: 0, y: 0, scale: 1 };
        
        // Create the piece component with swapOffset
        const pieceComponent = piece ? createBoardPiece(piece, index, swapOffset) : null;
        
        return (
          <div
            key={index}
            className="absolute"
            style={{ 
              left: `${x}px`, 
              top: `${y}px`,
              zIndex: activeBoardIndex === index ? 50 : 0
            }}
          >
            <BoardSpace
              index={index}
              piece={pieceComponent}
              feedback={feedback[index]}
              onClick={onBoardSpaceClick}
              isLocked={isLocked}
              isDragging={isDragging}
              isCorrectLocked={correctPositions.includes(index)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default GameBoard;

