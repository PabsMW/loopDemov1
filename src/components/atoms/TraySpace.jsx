import { motion } from 'framer-motion';

const TraySpace = ({ 
  index,
  piece = null,
  onClick,
  isEmpty = false,
  className = '',
  style = {}
}) => {
  return (
    <motion.div
      onClick={onClick}
      className={`tray-space relative flex justify-center items-center w-[50px] h-[50px] rounded-full ${!isEmpty ? 'cursor-pointer' : ''} ${className}`}
      style={style}
      whileHover={!isEmpty ? { scale: 1, rotate: 3 } : {}}
      whileTap={!isEmpty ? { scale: 1 } : {}}
      transition={{ duration: 0.2 }}
    >
      {/* Permanent dot indicator - always visible, behind the piece */}
      <div className='absolute h-[14px] w-[14px] bg-cyan-900 rounded-full z-0'/>
      
      {/* GamePiece - shows when piece exists, above the dot */}
      {piece && (
        <div className="flex items-center justify-center z-10 relative">
          {piece}
        </div>
      )}
    </motion.div>
  );
};

export default TraySpace;

