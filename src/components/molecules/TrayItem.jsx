import { Reorder, useDragControls } from 'framer-motion';
import TraySpace from '../atoms/TraySpace';
import GamePiece from '../atoms/GamePiece';

const TrayItem = ({ 
  piece,
  index,
  allPieces,
  selectedPiece,
  selectedFrom,
  gameStatus,
  handleTraySpaceClick,
  handleDragToBoard,
  setPosition
}) => {
  const controls = useDragControls();

  if (!piece) {
    // Empty tray space
    return (
      <div className="w-[50px] h-[50px]">
        <TraySpace
          index={index}
          piece={null}
          isEmpty={true}
          setPosition={setPosition}
        />
      </div>
    );
  }

  return (
    <Reorder.Item
      value={piece}
      dragListener={false}
      dragControls={controls}
      className="relative"
      whileDrag={{ scale: 1.1, zIndex: 1000 }}
    >
      <div
        onPointerDown={(e) => {
          if (gameStatus === 'playing') {
            controls.start(e);
          }
        }}
        style={{ cursor: gameStatus === 'playing' ? 'grab' : 'default' }}
      >
        <TraySpace
          index={index}
          piece={
            <GamePiece
              id={piece}
              imageSrc={allPieces[piece]}
              alt={piece}
              isSelected={selectedPiece === piece && selectedFrom?.type === 'tray'}
              isDraggable={false}
              fromType="tray"
              fromIndex={index}
              onClick={(e) => {
                e.stopPropagation();
                handleTraySpaceClick(index);
              }}
            />
          }
          isEmpty={false}
          setPosition={setPosition}
        />
      </div>
    </Reorder.Item>
  );
};

export default TrayItem;

