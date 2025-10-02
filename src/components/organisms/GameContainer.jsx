import { useState, useEffect, useRef } from 'react';
import { motion, Reorder } from 'framer-motion';
import GameBoard from '../molecules/GameBoard';
import TryIndicator from '../molecules/TryIndicator';
import TrayItem from '../molecules/TrayItem';
import GamePiece from '../atoms/GamePiece';
import Button from '../atoms/Button';
import { arrayMove, findDragIndex } from '../../utils/arrayMove';

const GameContainer = () => {
  // Game data
  const correctOrder = [
    'popcorn', 'corn', 'ear', 'tunning-fork', 'piano', 'key',
    'cage', 'bird', 'worm', 'book', 'script', 'movie'
  ];

  const allPieces = {
    'popcorn': '/images/items-1/popcorn.webp',
    'corn': '/images/items-1/corn.webp',
    'ear': '/images/items-1/ear.webp',
    'tunning-fork': '/images/items-1/tunning-fork.webp',
    'piano': '/images/items-1/piano.webp',
    'key': '/images/items-1/key.webp',
    'cage': '/images/items-1/cage.webp',
    'bird': '/images/items-1/bird.webp',
    'worm': '/images/items-1/worm.webp',
    'book': '/images/items-1/book.webp',
    'script': '/images/items-1/script.webp',
    'movie': '/images/items-1/movie.webp'
  };

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
  
  // Tray reordering state
  const [isDraggingInTray, setIsDraggingInTray] = useState(false);
  const trayPositions = useRef([]).current;

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const shuffledPieces = shuffleArray(Object.keys(allPieces));
    setTraySpaces(shuffledPieces);
    setBoardSpaces(Array(12).fill(null));
    setSelectedPiece(null);
    setSelectedFrom(null);
    setTriesRemaining(5);
    setGameStatus('playing');
    setFeedback({});
    setIsChecking(false);
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

  // Set tray position for reordering
  const setTrayPosition = (index, position) => {
    trayPositions[index] = position;
  };

  // Handle tray reordering during drag
  const lastReorderTime = useRef(0);
  const handleTrayReorder = (dragIndex, dragOffsetX) => {
    // Throttle reordering to prevent too frequent updates
    const now = Date.now();
    if (now - lastReorderTime.current < 50) return; // 50ms throttle
    
    const targetIndex = findDragIndex(dragIndex, dragOffsetX, trayPositions);
    if (targetIndex !== dragIndex && targetIndex >= 0 && targetIndex < traySpaces.length) {
      lastReorderTime.current = now;
      setTraySpaces(arrayMove(traySpaces, dragIndex, targetIndex));
    }
  };

  // Handle Framer Motion drag end
  const handleDragEnd = (event, info, pieceData) => {
    if (gameStatus !== 'playing') return;
    
    setIsDraggingInTray(false);

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
    
    // Get all board spaces
    const boardSpaces = document.querySelectorAll('.board-space');
    const draggedElement = event.target.getBoundingClientRect();
    const draggedCenterX = draggedElement.left + draggedElement.width / 2;
    const draggedCenterY = draggedElement.top + draggedElement.height / 2;

    // Find which board space the piece was dropped on
    let targetBoardIndex = null;
    let minDistance = Infinity;
    
    boardSpaces.forEach((space) => {
      const rect = space.getBoundingClientRect();
      const spaceCenterX = rect.left + rect.width / 2;
      const spaceCenterY = rect.top + rect.height / 2;
      const distance = Math.sqrt(
        Math.pow(draggedCenterX - spaceCenterX, 2) + 
        Math.pow(draggedCenterY - spaceCenterY, 2)
      );
      
      // Find the closest board space within 60px
      if (distance < 60 && distance < minDistance) {
        minDistance = distance;
        targetBoardIndex = parseInt(space.dataset.dropIndex);
      }
    });

    // If dropped on a board space and it's not the same position
    if (targetBoardIndex !== null && !(fromType === 'board' && fromIndex === targetBoardIndex)) {
      placePiece(targetBoardIndex, id, { type: fromType, index: fromIndex });
      // Clear selection state after drag operation
      setSelectedPiece(null);
      setSelectedFrom(null);
    }
    // If not dropped on board, piece will snap back automatically
  };

  // Check answers
  const handleCheck = () => {
    if (gameStatus !== 'playing' || isChecking) return;

    setIsChecking(true);
    const newFeedback = {};
    let allCorrect = true;

    boardSpaces.forEach((piece, index) => {
      if (piece === correctOrder[index]) {
        newFeedback[index] = 'correct';
      } else {
        newFeedback[index] = 'wrong';
        allCorrect = false;
      }
    });

    setFeedback(newFeedback);

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
    return boardSpaces.map((piece, index) => 
      piece ? (
        <GamePiece
          key={`board-${index}-${piece}`}
          id={piece}
          imageSrc={allPieces[piece]}
          alt={piece}
          isSelected={selectedPiece === piece && selectedFrom?.type === 'board' && selectedFrom?.index === index}
          isDraggable={gameStatus === 'playing'}
          fromType="board"
          fromIndex={index}
          onDragEnd={handleDragEnd}
          onClick={(e) => {
            e.stopPropagation(); // Prevent BoardSpace click
            
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
      ) : null
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center space-y-8 max-w-4xl w-full"
      >
        {/* Header */}
        <h1 className="text-5xl font-bold text-white mb-8">
          Loop Sequence Game
        </h1>

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

        {/* Game Board */}
        <GameBoard
          boardSpaces={renderBoardPieces()}
          feedback={feedback}
          onBoardSpaceClick={handleBoardSpaceClick}
          isLocked={gameStatus !== 'playing'}
        />

        {/* Game Tray - Using Reorder for smooth reordering */}
        <Reorder.Group
          axis="x"
          values={traySpaces.filter(p => p !== null)}
          onReorder={(newOrder) => {
            // Merge reordered pieces back with null placeholders
            const newTray = [...traySpaces];
            let newOrderIndex = 0;
            for (let i = 0; i < newTray.length; i++) {
              if (newTray[i] !== null) {
                newTray[i] = newOrder[newOrderIndex];
                newOrderIndex++;
              }
            }
            setTraySpaces(newTray);
          }}
          className="flex flex-wrap gap-3 justify-center p-4 bg-slate-800/30 rounded-2xl backdrop-blur-sm"
          style={{ listStyle: 'none', margin: 0, padding: '1rem' }}
        >
          {traySpaces.map((piece, index) => 
            piece ? (
              <TrayItem
                key={piece}
                piece={piece}
                index={index}
                allPieces={allPieces}
                selectedPiece={selectedPiece}
                selectedFrom={selectedFrom}
                gameStatus={gameStatus}
                handleTraySpaceClick={handleTraySpaceClick}
                handleDragToBoard={handleDragEnd}
                handleTrayReorder={handleTrayReorder}
                traySpaces={traySpaces}
                setPosition={setTrayPosition}
              />
            ) : (
              <div key={`empty-${index}`} className="w-[50px] h-[50px]">
                <TraySpace
                  index={index}
                  piece={null}
                  isEmpty={true}
                  setPosition={setTrayPosition}
                />
              </div>
            )
          )}
        </Reorder.Group>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4 mt-8">
          {/* Try Indicator */}
          <TryIndicator triesRemaining={triesRemaining} totalTries={5} />

          {/* Check Button */}
          {gameStatus === 'playing' && (
            <Button onClick={handleCheck} disabled={isChecking}>
              Check
            </Button>
          )}

          {/* Reset Button */}
          {gameStatus !== 'playing' && (
            <Button onClick={initializeGame}>
              Reset
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default GameContainer;

