import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameBoard from '../molecules/GameBoard';
import TraySpace from '../atoms/TraySpace';
import GamePiece from '../atoms/GamePiece';
import PieceModal from '../molecules/PieceModal';
import BackgroundLayer from '../molecules/BackgroundLayer';
import Controls from '../molecules/Controls';
import { SWAP_FLY_DURATION, CHECK_PROGRESS_DURATION, CHECK_SEGMENT_DURATION } from '../../constants/animations';

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
  const [wrongPositions, setWrongPositions] = useState(new Set()); // Positions that are wrong (persist until moved)
  const [hasChanges, setHasChanges] = useState(false); // Track if moves have been made since last check
  const [lastCheckedBoard, setLastCheckedBoard] = useState(null); // Store board state after each check
  const [activeBoardIndex, setActiveBoardIndex] = useState(null); // Track which board position is being dragged
  const [activeTrayIndex, setActiveTrayIndex] = useState(null); // Track which tray position is being dragged
  const [hoveredSwapTarget, setHoveredSwapTarget] = useState(null); // Track hover target during drag for swap preview
  const [swappingPiece, setSwappingPiece] = useState(null); // Track piece flying/fading during swap
  const [delayedLayoutPiece, setDelayedLayoutPiece] = useState(null); // Track dragged piece to delay layout animation
  const [hasEverChecked, setHasEverChecked] = useState(false); // Track if check has ever been run (for progress arcs)
  const [checkArcs, setCheckArcs] = useState([]); // Store arc results from last check (frozen)
  const [showTesting, setShowTesting] = useState(false); // Toggle testing buttons visibility
  

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
    setWrongPositions(new Set()); // Clear wrong positions on reset
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

    // Can't move locked pieces from board
    if (fromLocation.type === 'board' && correctPositions.has(fromLocation.index)) {
      console.log('Cannot move locked piece');
      // Close zoom but don't move piece
      setSelectedPiece(null);
      setSelectedFrom(null);
      return;
    }

    // Can't place on correct locked positions
    if (correctPositions.has(boardIndex)) {
      console.log('Cannot place on correct locked position');
      return;
    }

    // Clear wrong state from involved positions when piece is moved
    setWrongPositions(prev => {
      const updated = new Set(prev);
      if (fromLocation.type === 'board') {
        updated.delete(fromLocation.index); // Clear source position
      }
      updated.delete(boardIndex); // Clear target position
      return updated;
    });

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
    setHasEverChecked(true); // Mark that check has been run
    let allCorrect = true;

    // Calculate arc states (connections between adjacent pieces)
    const arcSegments = boardSpaces.map((piece, index) => {
      const nextIndex = (index + 1) % 12; // Wrap around for last arc
      const currentCorrect = piece === correctOrder[index];
      const nextCorrect = boardSpaces[nextIndex] === correctOrder[nextIndex];
      
      return {
        isCorrect: currentCorrect && nextCorrect, // Both must be correct for teal arc
        index
      };
    });
    
    setCheckArcs(arcSegments); // Freeze arc results for this check

    // Check correctness and schedule individual piece feedback with cascade
    boardSpaces.forEach((piece, index) => {
      const isCorrect = piece === correctOrder[index];
      
      if (!isCorrect) {
        allCorrect = false;
      }
      
      // Schedule state changes for this piece after its arc completes
      setTimeout(() => {
        // Set temporary feedback
        setFeedback(prev => ({
          ...prev,
          [index]: isCorrect ? 'correct' : 'wrong'
        }));
        
        // Set persistent state
        if (isCorrect) {
          setCorrectPositions(prev => new Set([...prev, index]));
        } else {
          setWrongPositions(prev => new Set([...prev, index]));
        }
      }, (index + 1) * CHECK_SEGMENT_DURATION * 1000);
    });

    // Clear feedback and finish check after all animations complete
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
    }, CHECK_PROGRESS_DURATION * 1000);
  };

  // Create board piece render function for GameBoard to use
  const createBoardPiece = (piece, index, swapOffset) => {
    const isCorrectLocked = correctPositions.has(index);
    const isWrongPersistent = wrongPositions.has(index);
    
    console.log(`createBoardPiece: index=${index}, piece=${piece}, isWrongPersistent=${isWrongPersistent}, wrongPositions has ${wrongPositions.size} items`);
    
    // Check if this piece is flying/fading during swap
    const isSwapping = swappingPiece?.type === 'board' && swappingPiece.index === index;
    const swapAnimation = isSwapping 
      ? { 
          x: swappingPiece.targetX, // Final position (includes starting offset)
          y: swappingPiece.targetY, 
          opacity: 1,
          startX: swappingPiece.startX, // Starting offset position
          startY: swappingPiece.startY
        }
      : null;
    
    // Check if this is the dragged piece that should delay layout animation
    const shouldDelayLayout = delayedLayoutPiece?.type === 'board' && delayedLayoutPiece.index === index;
    
    return (
      <GamePiece
        key={`board-${index}-${piece}`}
        id={piece}
        imageSrc={allPieces[piece]}
        alt={piece}
        isSelected={!isCorrectLocked && selectedPiece === piece && selectedFrom?.type === 'board' && selectedFrom?.index === index}
        isDraggable={gameStatus === 'playing' && !isCorrectLocked}
        fromType="board"
        fromIndex={index}
        feedback={feedback[index]}
        isCorrectLocked={isCorrectLocked}
        isWrongPersistent={isWrongPersistent}
        swapOffset={swapOffset}
        swapAnimation={swapAnimation}
        delayLayout={shouldDelayLayout}
        onDrag={(event, info) => {
            // Detect hover target for swap preview
            const draggedRect = event.target.getBoundingClientRect();
            const draggedCenterX = draggedRect.left + draggedRect.width / 2;
            const draggedCenterY = draggedRect.top + draggedRect.height / 2;
            
            const boardSpaceElements = document.querySelectorAll('.board-space');
            let closestIndex = null;
            let minDistance = 60;
            
            boardSpaceElements.forEach((space) => {
              const rect = space.getBoundingClientRect();
              const centerX = rect.left + rect.width / 2;
              const centerY = rect.top + rect.height / 2;
              const distance = Math.sqrt(
                Math.pow(draggedCenterX - centerX, 2) + 
                Math.pow(draggedCenterY - centerY, 2)
              );
              
              if (distance < minDistance) {
                minDistance = distance;
                closestIndex = parseInt(space.dataset.dropIndex);
              }
            });
            
            // Set hover target if over occupied space (for swap) and not self and not locked
            if (closestIndex !== null && closestIndex !== index && boardSpaces[closestIndex] && !correctPositions.has(closestIndex)) {
              setHoveredSwapTarget({ type: 'board', index: closestIndex });
            } else {
              setHoveredSwapTarget(null);
            }
          }}
          onDragStart={() => {
            console.log(`Dragging board piece: ${piece} from index ${index}, isLocked: ${isCorrectLocked}`);
            setIsDragging(true);
            setActiveBoardIndex(index); // Mark this board position as active
          }}
          onDragEnd={(event, info, pieceData) => {
            // If hovering over valid swap target, trigger fly-fade animation
            if (hoveredSwapTarget && hoveredSwapTarget.type === 'board') {
              const targetIndex = hoveredSwapTarget.index;
              const boardSpaceElements = document.querySelectorAll('.board-space');
              const targetSpace = Array.from(boardSpaceElements).find(el => parseInt(el.dataset.dropIndex) === targetIndex);
              const originSpace = Array.from(boardSpaceElements).find(el => parseInt(el.dataset.dropIndex) === index);
              
              if (targetSpace && originSpace) {
                const targetRect = targetSpace.getBoundingClientRect();
                const originRect = originSpace.getBoundingClientRect();
                const dx = originRect.left - targetRect.left;
                const dy = originRect.top - targetRect.top;
                
                // Calculate starting offset for bottom piece
                const isLeftSide = targetIndex >= 6 && targetIndex <= 11;
                const offsetX = isLeftSide ? 30 : -30;
                const offsetY = -10;
                
                // After swap, Piano will be at position 'index' (Worm's origin)
                // But it needs to START from position 'targetIndex' + offset (where it currently is)
                // So: initial = distance from new position back to old position + offset
                const startX = -dx + offsetX; // Reverse direction + offset
                const startY = -dy + offsetY;
                
                // Trigger fly-fade on bottom piece (Piano)
                setSwappingPiece({
                  type: 'board',
                  index: index, // Where Piano will be AFTER swap (position 3)
                  startX: startX, // Absolute start position (from 9 o'clock + offset)
                  startY: startY,
                  targetX: 0, // Fly to center (0, 0 relative to new position)
                  targetY: 0
                });
                
                // Mark dragged piece (Worm) to delay its layout animation
                // After swap, Worm will be at drop target (targetIndex)
                setDelayedLayoutPiece({
                  type: 'board',
                  index: targetIndex // Where Worm will be AFTER swap
                });
                
                // Perform swap immediately (state changes)
                handleDragEnd(event, info, pieceData);
                
                // After animation completes, clear and enable layout
                setTimeout(() => {
                  setSwappingPiece(null);
                  setDelayedLayoutPiece(null);
                }, SWAP_FLY_DURATION * 1000);
                
                setHoveredSwapTarget(null);
                setIsDragging(false);
                setActiveBoardIndex(null);
                return;
              }
            }
            
            setHoveredSwapTarget(null); // Clear hover on drag end
            setIsDragging(false);
            setActiveBoardIndex(null); // Clear active on drag end
            handleDragEnd(event, info, pieceData);
          }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent BoardSpace click
            
            // Correct locked pieces can be clicked for zoom, but not moved
            if (isCorrectLocked) {
              // Select for zoom (opens PieceModal)
              setSelectedPiece(piece);
              setSelectedFrom({ type: 'board', index });
              return; // Can't place or swap locked pieces
            }
            
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
    );
  };

  // Handle clicks on background to close modal
  const handleBackgroundClick = (e) => {
    // Close modal if NOT clicking on game pieces, board spaces, tray, controls, or nav
    const clickedElement = e.target;
    const isGameElement = clickedElement.closest('.board-space') || 
                         clickedElement.closest('.tray-space') ||
                         clickedElement.closest('.piece-that-drags') ||
                         clickedElement.closest('.Controls') ||
                         clickedElement.closest('.Nav');
    
    if (!isGameElement && selectedPiece) {
      setSelectedPiece(null);
      setSelectedFrom(null);
    }
  };

  return (
    <div 
      className="GameContainer-wrapper flex flex-col justify-start relative min-h-screen flex items-start justify-center p-0 gap-y-2 h-dvh"
      onClick={handleBackgroundClick}
    >
        {/* Sticky Nav at top */}
        <nav className="Nav flex top-0 h-[50px] bg-[#050d1c] z-50 w-full items-center px-4">
          {/* toggle Testing */}          
          <button 
            onClick={() => setShowTesting(!showTesting)}
          className='ToggleTesting flex items-center justify-center w-[44px] h-[44px] bg-transparent hover:bg-sky-800 rounded-full transition-colors cursor-pointer'
          >
            <span className="text-xs text-[#050d1c]">
              {showTesting ? '✕' : 'ON'}
            </span>
          </button>
        </nav>
      
      {/* Main content wrapper */}
      <div className="GameContainer relative flex flex-col items-center justify-center text-center space-y-8 max-w-sm w-full">

      {/* Layer 0: Background (gradient + ring) */}
      <BackgroundLayer 
        gameStatus={gameStatus}
        isChecking={isChecking}
        hasEverChecked={hasEverChecked}
        checkArcs={checkArcs}
      />
        
        {/* Layer 10: Controls (includes Win/Fail messages) */}
        <Controls 
          gameStatus={gameStatus}
          hasChanges={hasChanges}
          triesRemaining={triesRemaining}
          totalTries={5}
          isChecking={isChecking}
          onCheck={handleCheck}
          className="z-10"
        />

        {/* Layer 20: Piece Zoom Modal */}
        <AnimatePresence mode="wait">
          {selectedPiece && selectedFrom && (
            <PieceModal
              key={selectedPiece}
              piece={selectedPiece}
              imageSrc={allPieces[selectedPiece]}
              feedback={selectedFrom.type === 'board' ? feedback[selectedFrom.index] : null}
              isCorrectLocked={selectedFrom.type === 'board' && correctPositions.has(selectedFrom.index)}
              isWrongPersistent={selectedFrom.type === 'board' && wrongPositions.has(selectedFrom.index)}
              onClose={() => {
                setSelectedPiece(null);
                setSelectedFrom(null);
              }}
              className="PieceModal z-20"
            />
          )}
        </AnimatePresence>
        
        {/* Layer: Game Board - Dynamic z-index based on state */}
        <div 
          className="gameBoard-wrapper relative" 
          style={{ 
            zIndex: activeBoardIndex !== null ? 50  // Dragging from board, boost to z-50
              : activeTrayIndex !== null ? 30      // Dragging from tray, above controls
              : selectedPiece ? 30                 // Modal open, above controls
              : 5                                  // Default, below controls (clickable)
          }}
        >
          <GameBoard
            boardSpaces={boardSpaces}
            allPieces={allPieces}
            createBoardPiece={createBoardPiece}
            feedback={feedback}
            onBoardSpaceClick={handleBoardSpaceClick}
            isLocked={gameStatus !== 'playing'}
            isDragging={isDragging}
            correctPositions={Array.from(correctPositions)}
            wrongPositions={Array.from(wrongPositions)}
            activeBoardIndex={activeBoardIndex}
            hoveredSwapTarget={hoveredSwapTarget}
            hasSelectedPiece={selectedPiece !== null}
          />
        </div>
        
        {/* Layer 40: Game Tray - z-50 when dragging from tray, z-40 otherwise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative flex place-items-center place-content-center justify-center flex-wrap gap-x-2 gap-y-2 w-full p-3 [background:var(--bg-tray)] rounded-2xl"
          style={{ zIndex: activeTrayIndex !== null ? 50 : 40 }}
        >
 
          {traySpaces.map((piece, index) => {
            // Calculate how many empty slots to remove from end
            const lockedCount = correctPositions.size - 1; // Exclude starter
            
            // Count empty slots from end to this index
            let emptyFromEnd = 0;
            for (let i = traySpaces.length - 1; i > index; i--) {
              if (!traySpaces[i]) emptyFromEnd++;
            }
            
            // Hide this slot if it's empty and within removal range
            const shouldHide = !piece && emptyFromEnd < lockedCount;
            
            if (shouldHide) return null;
            
            return (
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
                  onDrag={(event, info) => {
                    // Detect hover target for swap preview (same logic as board pieces)
                    const draggedRect = event.target.getBoundingClientRect();
                    const draggedCenterX = draggedRect.left + draggedRect.width / 2;
                    const draggedCenterY = draggedRect.top + draggedRect.height / 2;
                    
                    const boardSpaceElements = document.querySelectorAll('.board-space');
                    let closestIndex = null;
                    let minDistance = 60;
                    
                    boardSpaceElements.forEach((space) => {
                      const rect = space.getBoundingClientRect();
                      const centerX = rect.left + rect.width / 2;
                      const centerY = rect.top + rect.height / 2;
                      const distance = Math.sqrt(
                        Math.pow(draggedCenterX - centerX, 2) + 
                        Math.pow(draggedCenterY - centerY, 2)
                      );
                      
                      if (distance < minDistance) {
                        minDistance = distance;
                        closestIndex = parseInt(space.dataset.dropIndex);
                      }
                    });
                    
                    // Set hover target if over occupied board space (for swap) and not locked
                    if (closestIndex !== null && boardSpaces[closestIndex] && !correctPositions.has(closestIndex)) {
                      setHoveredSwapTarget({ type: 'board', index: closestIndex });
                    } else {
                      setHoveredSwapTarget(null);
                    }
                  }}
                  onDragStart={() => {
                    setIsDragging(true);
                    setActiveTrayIndex(index); // Mark tray position as active
                  }}
                  onDragEnd={(event, info, pieceData) => {
                    // For tray → board swaps, just do simple swap (no fly-fade animation)
                    // Board piece moves to tray (different container), animation is complex
                    setHoveredSwapTarget(null); // Clear hover on drag end
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
          );
        })}
        </motion.div>

        {/* TEMPORARY: Testing buttons - REMOVE AFTER TESTING */}
        {showTesting && (
          <div className="Testing flex gap-4 mt-4">
          <button
            onClick={() => {
              setIsChecking(true);
              setHasEverChecked(true);
              // Set mock check arcs (all teal for win)
              const mockArcs = Array.from({ length: 12 }, (_, i) => ({ isCorrect: true, index: i }));
              setCheckArcs(mockArcs);
              setTimeout(() => {
                setIsChecking(false);
                setGameStatus('won');
              }, CHECK_PROGRESS_DURATION * 1000);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded font-comfortaa"
          >
            Test Win
          </button>
          <button
            onClick={() => {
              setIsChecking(true);
              setHasEverChecked(true);
              // Set mock check arcs (all red for fail)
              const mockArcs = Array.from({ length: 12 }, (_, i) => ({ isCorrect: false, index: i }));
              setCheckArcs(mockArcs);
              setTimeout(() => {
                setIsChecking(false);
                setGameStatus('failed');
              }, CHECK_PROGRESS_DURATION * 1000);
            }}
            className="px-4 py-2 bg-red-500 text-white rounded font-comfortaa"
          >
            Test Fail
          </button>
          <button
            onClick={() => setGameStatus('playing')}
            className="px-4 py-2 bg-blue-500 text-white rounded font-comfortaa"
          >
            Back to Playing
          </button>
        </div>
        )}
      </div>


    </div>
  );
};

export default GameContainer;

