import { motion } from 'framer-motion';
import BoardSpace from '../atoms/BoardSpace';

const GameBoard = ({ 
  boardSpaces,
  feedback,
  onBoardSpaceClick,
  isLocked,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex gap-3 mb-8 ${className}`}
    >
      {boardSpaces.map((piece, index) => (
        <BoardSpace
          key={index}
          index={index}
          piece={piece}
          feedback={feedback[index]}
          onClick={onBoardSpaceClick}
          isLocked={isLocked}
        />
      ))}
    </motion.div>
  );
};

export default GameBoard;

