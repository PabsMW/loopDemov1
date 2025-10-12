import { motion } from 'framer-motion';
import BoardSpace from '../atoms/BoardSpace';

const GameBoard = ({ 
  boardSpaces,
  feedback,
  onBoardSpaceClick,
  isLocked,
  isDragging = false,
  correctPositions = [],
  activeBoardIndex = null,
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
    <div className={`relative flex items-center justify-center w-[390px] h-[390px] [background:var(--bg-primary)] ${className}`}>
      {/* Background Ring */}
      <div 
        className="flex items-center justify-center -z-10 pointer-events-none w-[326px] h-[326px] bg-[url(/images/bg-ring-sm.svg)] bg-contain bg-center bg-no-repeat z-0"
      />
      
      {/* BoardSpaces positioned in circle */}
      {boardSpaces.map((piece, index) => {
        const { x, y } = getPosition(index);
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
              piece={piece}
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

