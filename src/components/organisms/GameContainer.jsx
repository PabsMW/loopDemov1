import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import GameBoard from '../molecules/GameBoard';
import TryIndicator from '../molecules/TryIndicator';
import TraySpace from '../atoms/TraySpace';
import GamePiece from '../atoms/GamePiece';
import Button from '../atoms/Button';
import PieceModal from '../molecules/PieceModal';

const GameContainer = () => {
  // Game data - single source of truth
  const gameData = [
    { id: 'popcorn', image: '/images/items-1/popcorn.webp', isStarter: true },
    { id: 'corn', image: '/images/items-1/corn.webp' },
    { id: 'ear', image: '/images/items-1/ear.webp' },
    { id: 'tunning-fork', image: '/images/items-1/tunning-fork.webp' },
    { id: 'piano', image: '/images/items-1/piano.webp' },
    { id: 'key', image: '/images/items-1/key.webp' },
    { id: 'cage', image: '/images/items-1/cage.webp' },
    { id: 'bird', image: '/images/items-1/bird.webp' },
    { id: 'worm', image: '/images/items-1/worm.webp' },
    { id: 'book', image: '/images/items-1/book.webp' },
    { id: 'script', image: '/images/items-1/script.webp' },
    { id: 'movie', image: '/images/items-1/movie.webp' }
  ];

  // Derived data
  const starterIndex = gameData.findIndex(item => item.isStarter);
  const starterPiece = {
    piece: gameData[starterIndex].id,
    position: starterIndex
  };

  const correctOrder = gameData.map(item => item.id);
  
  const allPieces = gameData.reduce((acc, item) => {
    acc[item.id] = item.image;
    return acc;
  }, {});

  // Shuffle function
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Initialize state
  const [boardSpaces, setBoardSpaces] = useState(Array(12).fill(null));
  const [traySpaces, setTraySpaces] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [selectedFrom, setSelectedFrom] = useState(null); // {type: 'tray'|'board', index: number}
  const [triesRemaining, setTriesRemaining] = useState(5);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing' | 'won' | 'failed'
  const [feedback, setFeedback] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [correctPositions, setCorrectPositions] = useState(new Set([starterPiece.position])); // Positions that are correct and locked
  const [hasChanges, setHasChanges] = useState(false); // Track if moves have been made since last check
  const [lastCheckedBoard, setLastCheckedBoard] = useState(null); // Store board state after each check
  const [activeBoardIndex, setActiveBoardIndex] = useState(null); // Track which board position is being dragged
  const [activeTrayIndex, setActiveTrayIndex] = useState(null); // Track which tray position is being dragged
  

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, []);

  // Detect board changes compared to last check
  useEffect(() => {
    if (!lastCheckedBoard) return; // Wait for initialization
    
    // Compare current board with last checked board
    const boardChanged = boardSpaces.some((piece, index) => piece !== lastCheckedBoard[index]);
    setHasChanges(boardChanged);
  }, [boardSpaces, lastCheckedBoard]);

  const initializeGame = () => {
    // Filter out starter piece from tray
    const piecesForTray = Object.keys(allPieces).filter(p => p !== starterPiece.piece);
    const shuffledPieces = shuffleArray(piecesForTray);
    setTraySpaces(shuffledPieces);
    
    // Initialize board with starter piece in correct position
    const initialBoard = Array(12).fill(null);
    initialBoard[starterPiece.position] = starterPiece.piece;
    setBoardSpaces(initialBoard);
    
    setSelectedPiece(null);
    setSelectedFrom(null);
    setTriesRemaining(5);
    setGameStatus('playing');
    setFeedback({});
    setIsChecking(false);
    setCorrectPositions(new Set([starterPiece.position])); // Reset to just starter
    setHasChanges(false); // No changes at start
    setLastCheckedBoard([...initialBoard]); // Set initial board as baseline for comparison
  };

  // Handle tray piece click
  const handleTraySpaceClick = (trayIndex) => {
    const piece = traySpaces[trayIndex];
    if (!piece || gameStatus !== 'playing') return;

    if (selectedPiece === piece && selectedFrom?.type === 'tray' && selectedFrom?.index === trayIndex) {
      // Deselect
      setSelectedPiece(null);
      setSelectedFrom(null);
    } else {
      // Select
      setSelectedPiece(piece);
      setSelectedFrom({ type: 'tray', index: trayIndex });
    }
  };

  // Handle board space click
  const handleBoardSpaceClick = (boardIndex) => {
    if (gameStatus !== 'playing') return;

    const currentPiece = boardSpaces[boardIndex];

    // If no piece selected
    if (!selectedPiece) {
      if (currentPiece) {
        // Select piece from board
        setSelectedPiece(currentPiece);
        setSelectedFrom({ type: 'board', index: boardIndex });
      }
      return;
    }

    // If piece is selected, place it
    placePiece(boardIndex);
  };

  // Place piece logic - can use state or passed params
  const placePiece = (boardIndex, piece = null, from = null) => {
    const pieceToPlace = piece || selectedPiece;
    const fromLocation = from || selectedFrom;

    if (!pieceToPlace || !fromLocation) return;

    // Can't place on correct locked positions
    if (correctPositions.has(boardIndex)) {
      console.log('Cannot place on correct locked position');
      return;
    }

    const targetPiece = boardSpaces[boardIndex];

    if (fromLocation.type === 'tray') {
      // Moving from tray to board
      // Find the piece by ID, not by index (more reliable)
      const actualTrayIndex = traySpaces.findIndex(p => p === pieceToPlace);
      
      if (actualTrayIndex === -1) {
        console.warn('Piece not found in tray:', pieceToPlace);
        return; // Piece not in tray, abort
      }
      
      if (targetPiece) {
        // Swap: board piece goes to tray
        const newTray = [...traySpaces];
        newTray[actualTrayIndex] = targetPiece;
        setTraySpaces(newTray);

        const newBoard = [...boardSpaces];
        newBoard[boardIndex] = pieceToPlace;
        setBoardSpaces(newBoard);
      } else {
        // Empty space: move piece from tray
        const newTray = [...traySpaces];
        newTray[actualTrayIndex] = null;
        setTraySpaces(newTray);

        const newBoard = [...boardSpaces];
        newBoard[boardIndex] = pieceToPlace;
        setBoardSpaces(newBoard);
      }
    } else if (fromLocation.type === 'board') {
      // Moving from board to board
      if (targetPiece) {
        // Swap two board pieces
        const newBoard = [...boardSpaces];
        newBoard[fromLocation.index] = targetPiece;
        newBoard[boardIndex] = pieceToPlace;
        setBoardSpaces(newBoard);
      } else {
        // Move to empty board space
        const newBoard = [...boardSpaces];
        newBoard[fromLocation.index] = null;
        newBoard[boardIndex] = pieceToPlace;
        setBoardSpaces(newBoard);
      }
    }

    // Deselect only if using state (click-to-move)
    if (!piece && !from) {
      setSelectedPiece(null);
      setSelectedFrom(null);
    }
  };

  // Handle Framer Motion drag end
  const handleDragEnd = (event, info, pieceData) => {
    if (gameStatus !== 'playing') return;

    const { id, fromType, fromIndex } = pieceData;
    
    // Verify piece still exists in source location
    if (fromType === 'tray') {
      const currentTrayIndex = traySpaces.findIndex(p => p === id);
      if (currentTrayIndex === -1) {
        console.warn('Piece not in tray, aborting drop:', id);
        return; // Piece already moved, prevent duplicate
      }
    } else if (fromType === 'board') {
      const currentBoardPiece = boardSpaces[fromIndex];
      if (currentBoardPiece !== id) {
        console.warn('Piece not at expected board position, aborting drop:', id);
        return; // Piece already moved, prevent duplicate
      }
    }
    
    // Get all drop zone DOM elements
    const boardSpaceElements = document.querySelectorAll('.board-space');
    const traySpaceElements = document.querySelectorAll('.tray-space');
    const draggedElement = event.target.getBoundingClientRect();
    const draggedCenterX = draggedElement.left + draggedElement.width / 2;
    const draggedCenterY = draggedElement.top + draggedElement.height / 2;

    // Find which board space the piece was dropped on
    let targetBoardIndex = null;
    let minBoardDistance = Infinity;
    
    boardSpaceElements.forEach((space) => {
      const rect = space.getBoundingClientRect();
      const spaceCenterX = rect.left + rect.width / 2;
      const spaceCenterY = rect.top + rect.height / 2;
      const distance = Math.sqrt(
        Math.pow(draggedCenterX - spaceCenterX, 2) + 
        Math.pow(draggedCenterY - spaceCenterY, 2)
      );
      
      // Find the closest board space within 60px
      if (distance < 60 && distance < minBoardDistance) {
        minBoardDistance = distance;
        targetBoardIndex = parseInt(space.dataset.dropIndex);
      }
    });

    // Find which tray space was dropped on (for board-to-tray)
    let targetTrayIndex = null;
    let minTrayDistance = Infinity;
    
    traySpaceElements.forEach((space, idx) => {
      const rect = space.getBoundingClientRect();
      const spaceCenterX = rect.left + rect.width / 2;
      const spaceCenterY = rect.top + rect.height / 2;
      const distance = Math.sqrt(
        Math.pow(draggedCenterX - spaceCenterX, 2) + 
        Math.pow(draggedCenterY - spaceCenterY, 2)
      );
      
      // Find the closest tray space within 40px
      if (distance < 40 && distance < minTrayDistance) {
        minTrayDistance = distance;
        targetTrayIndex = idx;
      }
    });

    // Handle drop on board space
    if (targetBoardIndex !== null && !(fromType === 'board' && fromIndex === targetBoardIndex)) {
      placePiece(targetBoardIndex, id, { type: fromType, index: fromIndex });
      setSelectedPiece(null);
      setSelectedFrom(null);
    }
    // Handle drop on tray (board-to-tray)
    else if (targetTrayIndex !== null && fromType === 'board') {
      // Use state variables
      const newBoard = [...boardSpaces];
      const newTray = [...traySpaces];
      
      const targetTrayPiece = newTray[targetTrayIndex];
      
      // Remove piece from board
      newBoard[fromIndex] = null;
      
      // If tray spot has a piece, swap it to board
      if (targetTrayPiece) {
        newBoard[fromIndex] = targetTrayPiece;
      }
      
      // Place board piece in tray
      newTray[targetTrayIndex] = id;
      
      setBoardSpaces(newBoard);
      setTraySpaces(newTray);
      setSelectedPiece(null);
      setSelectedFrom(null);
    }
    // If not dropped anywhere valid, piece will snap back automatically
  };

  // Check answers
  const handleCheck = () => {
    if (gameStatus !== 'playing' || isChecking) return;

    // Store current board state and reset hasChanges immediately
    setLastCheckedBoard([...boardSpaces]);
    setHasChanges(false);
    
    setIsChecking(true);
    const newFeedback = {};
    const newCorrectPositions = new Set(correctPositions);
    let allCorrect = true;

    boardSpaces.forEach((piece, index) => {
      if (piece === correctOrder[index]) {
        newFeedback[index] = 'correct';
        newCorrectPositions.add(index); // Mark as permanently correct
      } else {
        newFeedback[index] = 'wrong';
        allCorrect = false;
      }
    });

    setFeedback(newFeedback);
    setCorrectPositions(newCorrectPositions); // Lock correct pieces

    // Animate feedback
    setTimeout(() => {
      setFeedback({});
      setIsChecking(false);

      if (allCorrect) {
        setGameStatus('won');
      } else {
        const newTries = triesRemaining - 1;
        setTriesRemaining(newTries);
        if (newTries === 0) {
          setGameStatus('failed');
        }
      }
    }, 2000);
  };

  // Render game pieces in board
  const renderBoardPieces = () => {
    return boardSpaces.map((piece, index) => {
      const isCorrectLocked = correctPositions.has(index);
      console.log(`Board piece ${piece} at index ${index}: isDraggable=${gameStatus === 'playing' && !isCorrectLocked}, gameStatus=${gameStatus}, isCorrectLocked=${isCorrectLocked}`);
      
      return piece ? (
        <GamePiece
          key={`board-${index}-${piece}`}
          id={piece}
          imageSrc={allPieces[piece]}
          alt={piece}
          isSelected={!isCorrectLocked && selectedPiece === piece && selectedFrom?.type === 'board' && selectedFrom?.index === index}
          isDraggable={gameStatus === 'playing' && !isCorrectLocked}
          fromType="board"
          fromIndex={index}
          feedback={feedback[index]} // Pass feedback for color changes
          isCorrectLocked={isCorrectLocked} // Pass correct locked state for teal background
          onDragStart={() => {
            console.log(`Dragging board piece: ${piece} from index ${index}, isLocked: ${isCorrectLocked}`);
            setIsDragging(true);
            setActiveBoardIndex(index); // Mark this board position as active
          }}
          onDragEnd={(event, info, pieceData) => {
            setIsDragging(false);
            setActiveBoardIndex(null); // Clear active on drag end
            handleDragEnd(event, info, pieceData);
          }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent BoardSpace click
            
            // Correct locked pieces can't be selected or moved
            if (isCorrectLocked) return;
            
            // If clicking the same selected piece, deselect it
            if (selectedPiece === piece && selectedFrom?.type === 'board' && selectedFrom?.index === index) {
              setSelectedPiece(null);
              setSelectedFrom(null);
              return;
            }
            
            // If no piece selected, select this piece
            if (!selectedPiece) {
              setSelectedPiece(piece);
              setSelectedFrom({ type: 'board', index });
              return;
            }
            
            // If different piece is selected, place it here
            if (selectedPiece && selectedPiece !== piece) {
              placePiece(index);
            }
          }}
        />
      ) : null;
    });
  };

  // Handle clicks on background to close modal
  const handleBackgroundClick = (e) => {
    // Only close if clicking directly on the background (not on game elements)
    if (e.target === e.currentTarget) {
      setSelectedPiece(null);
      setSelectedFrom(null);
    }
  };

  return (
    <div 
      className="max-w-sm w-full  flex flex-col items-center justify-center"
      onClick={handleBackgroundClick}
    >
      <div className="relative flex flex-col items-center justify-center text-center space-y-8 max-w-sm w-full">
        {/* Win/Fail Message */}
        {gameStatus !== 'playing' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`text-3xl font-bold mb-4 ${gameStatus === 'won' ? 'text-green-400' : 'text-red-400'}`}
          >
            {gameStatus === 'won' ? '🎉 You Win!' : '😞 Failed - Try Again!'}
          </motion.div>
        )}
       {/* Piece Zoom Modal - always rendered, visibility controlled by prop */}
       <PieceModal
         piece={selectedPiece}
         imageSrc={selectedPiece ? allPieces[selectedPiece] : ''}
         isVisible={!!(selectedPiece && selectedFrom)}
         onClose={() => {
           setSelectedPiece(null);
           setSelectedFrom(null);
         }}
       />
        {/* Game Board */}
        <GameBoard
          boardSpaces={renderBoardPieces()}
          feedback={feedback}
          onBoardSpaceClick={handleBoardSpaceClick}
          isLocked={gameStatus !== 'playing'}
          isDragging={isDragging}
          correctPositions={Array.from(correctPositions)}
          activeBoardIndex={activeBoardIndex}
        />
        
        {/* Controls */}
        <div className="absolute flex flex-col items-center gap-2 m-0 top-[176px] left-1/2 -translate-x-1/2">
          {/* Check Button */}
          {gameStatus === 'playing' && (
            <Button 
              onClick={handleCheck} 
              disabled={!hasChanges || isChecking}
              tooltipText="Make a move first!"
            >
              CHECK
            </Button>
          )}
          {/* Try Indicator */}
          <TryIndicator 
            triesRemaining={triesRemaining} 
            totalTries={5} 
            hasChanges={hasChanges}
          />

          {/* Reset Button */}
          {gameStatus !== 'playing' && (
            <Button onClick={initializeGame}>
              Reset
            </Button>
          )}
        </div>{/* END Controls */}
        
        {/* Game Tray - CSS Grid layout: 6 columns, auto-wraps to 2 rows (6 + 5), centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex place-items-center place-content-center justify-center flex-wrap  gap-x-2 gap-y-2 w-full p-3 [background:var(--bg-tray)] rounded-2xl "
        >
 
          {traySpaces.map((piece, index) => (
            <TraySpace
              key={`tray-space-${index}`}
              index={index}
              style={{ zIndex: activeTrayIndex === index ? 50 : 0 }}
              piece={piece ? (
                <GamePiece
                  key={`tray-${piece}`}
                  id={piece}
                  imageSrc={allPieces[piece]}
                  alt={piece}
                  isSelected={selectedPiece === piece && selectedFrom?.type === 'tray' && selectedFrom?.index === index}
                  isDraggable={gameStatus === 'playing'}
                  fromType="tray"
                  fromIndex={index}
                  dragSnapToOrigin={true}
                  onDragStart={() => {
                    setIsDragging(true);
                    setActiveTrayIndex(index); // Mark tray position as active
                  }}
                  onDragEnd={(event, info, pieceData) => {
                    setIsDragging(false);
                    setActiveTrayIndex(null); // Clear active
                    handleDragEnd(event, info, pieceData);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTraySpaceClick(index);
                  }}
                />
              ) : null}
              isEmpty={!piece}
              onClick={() => handleTraySpaceClick(index)}
            />
          ))}
        </motion.div>
      </div>


    </div>
  );
};

export default GameContainer;

