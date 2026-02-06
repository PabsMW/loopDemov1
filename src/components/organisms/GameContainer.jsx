import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameBoard from '../molecules/GameBoard';
import TraySpace from '../atoms/TraySpace';
import GamePiece from '../atoms/GamePiece';
import PieceModal from '../molecules/PieceModal';
import BackgroundLayer from '../molecules/BackgroundLayer';
import Controls from '../molecules/Controls';
import { SWAP_FLY_DURATION, CHECK_PROGRESS_DURATION, CHECK_SEGMENT_DURATION } from '../../constants/animations';
import { playSound } from '../../utils/audio';

// Games configuration
const GAMES = {
  game1: {
    name: 'Game 1',
    data: [
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
    ]
  },
  game2: {
    name: 'Game 2',
    data: [
      { id: 'pig', image: '/images/items-2/pig.webp', isStarter: true },
      { id: 'football', image: '/images/items-2/football.webp' },
      { id: 'baseball', image: '/images/items-2/baseball.webp' },
      { id: 'baseball_pitcher', image: '/images/items-2/baseball_pitcher.webp' },
      { id: 'beer', image: '/images/items-2/beer.webp' },
      { id: 'bar', image: '/images/items-2/bar.webp' },
      { id: 'crowbar', image: '/images/items-2/crowbar.webp' },
      { id: 'crow', image: '/images/items-2/crow.webp' },
      { id: 'feather', image: '/images/items-2/feather.webp' },
      { id: 'pillow', image: '/images/items-2/pillow.webp' },
      { id: 'blanket', image: '/images/items-2/blanket.webp' },
      { id: 'pigs_in_blankets', image: '/images/items-2/pigs_in_blankets.webp' }
    ]
  }
};

const GameContainer = () => {
  // Selected game state
  const [selectedGame, setSelectedGame] = useState('game1');
  
  // Game data derived from selected game
  const gameData = GAMES[selectedGame].data;

  // Derived data
  const starterIndex = gameData.findIndex(item => item.isStarter);
  const starterPiece = {
    piece: gameData[starterIndex].id,
    position: starterIndex
  };

  const correctOrderForward = gameData.map(item => item.id);
  // Reverse order: starter stays at 0, but sequence goes backward
  const correctOrderReverse = [
    correctOrderForward[0], // starter stays at position 0
    ...correctOrderForward.slice(1).reverse() // reverse the rest
  ];
  
  // Function to get the correct order based on play direction
  // Returns forward order by default, reverse if playDirection is 'reverse'
  const getCorrectOrder = (direction) => {
    return direction === 'reverse' ? correctOrderReverse : correctOrderForward;
  };
  
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
  const [partialPositions, setPartialPositions] = useState(new Set()); // Positions that are correctly connected but in wrong place
  const [playDirection, setPlayDirection] = useState(null); // null = undetermined, 'forward' = A→B, 'reverse' = B→A
  const [hasChanges, setHasChanges] = useState(false); // Track if moves have been made since last check
  const [lastCheckedBoard, setLastCheckedBoard] = useState(null); // Store board state after each check
  const [activeBoardIndex, setActiveBoardIndex] = useState(null); // Track which board position is being dragged
  const [activeTrayIndex, setActiveTrayIndex] = useState(null); // Track which tray position is being dragged
  const [hoveredSwapTarget, setHoveredSwapTarget] = useState(null); // Track hover target during drag for swap preview
  const [swappingPiece, setSwappingPiece] = useState(null); // Track piece flying/fading during swap
  const [delayedLayoutPiece, setDelayedLayoutPiece] = useState(null); // Track dragged piece to delay layout animation
  const [hasEverChecked, setHasEverChecked] = useState(false); // Track if check has ever been run (for progress arcs)
  const [checkArcs, setCheckArcs] = useState([]); // Store arc results from last check (frozen)
  const [previousCheckArcs, setPreviousCheckArcs] = useState([]); // Track arcs from previous check to skip re-animation
  const [showTesting, setShowTesting] = useState(false); // Toggle testing buttons visibility
  const [interactionMode, setInteractionMode] = useState('option1'); // 'option1' = Tap & Drag, 'option2' = Drag Only, 'option3' = While Drag
  const [animationOption, setAnimationOption] = useState('option1'); // 'option1' = fade to neutral, 'option2' = keep wrong red
  const [modeTooltip, setModeTooltip] = useState(null); // Tooltip for mode changes
  const [animTooltip, setAnimTooltip] = useState(null); // Tooltip for animation option changes
  
  // Refs for toggle button widths
  const option1Ref = useRef(null);
  const option2Ref = useRef(null);
  const option3Ref = useRef(null);
  const option4Ref = useRef(null);
  const modeTooltipTimerRef = useRef(null);
  const animTooltipTimerRef = useRef(null);
  
  // Tooltip descriptions for each interaction mode
  const modeDescriptions = {
    option1: 'Tap & Drag. Click to zoom.',
    option2: 'Drag only. Hold to zoom.',
    option3: 'Drag to move. Pause to zoom.',
    option4: 'Drag only. Click to zoom.'
  };
  
  // Tooltip descriptions for animation options
  const animDescriptions = {
    option1: 'Fade away Wrong/Red after Check',
    option2: 'Keep Wrong/Red after Check'
  };
  const [toggleDimensions, setToggleDimensions] = useState({ option1Width: 0, option2Width: 0, option3Width: 0, option4Width: 0 });
  

  // Initialize game on mount and check URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Check URL parameter for game selection
    const game = params.get('game');
    if (game && GAMES[game]) {
      setSelectedGame(game);
    }
    
    // Check URL parameter for interaction mode
    const mode = params.get('mode');
    if (mode === 'option2') {
      setInteractionMode('option2');
    } else if (mode === 'option3') {
      setInteractionMode('option3');
    } else if (mode === 'option4') {
      setInteractionMode('option4');
    }
    
    // Check URL parameter for animation option
    const anim = params.get('anim');
    if (anim === 'option2') {
      setAnimationOption('option2');
    }
    
    initializeGame();
  }, []);

  // Reset game when switching games
  useEffect(() => {
    // Skip initial mount (handled by above effect)
    if (selectedGame) {
      initializeGame();
      setHasEverChecked(false);
      setCheckArcs([]);
      setPreviousCheckArcs([]);
    }
  }, [selectedGame]);
  
  // Measure toggle button widths
  useEffect(() => {
    if (option1Ref.current && option2Ref.current && option3Ref.current && option4Ref.current) {
      setToggleDimensions({
        option1Width: option1Ref.current.offsetWidth,
        option2Width: option2Ref.current.offsetWidth,
        option3Width: option3Ref.current.offsetWidth,
        option4Width: option4Ref.current.offsetWidth
      });
    }
  }, [interactionMode]);

  // Detect board changes compared to last check
  useEffect(() => {
    if (!lastCheckedBoard) return; // Wait for initialization
    
    // Compare current board with last checked board
    const boardChanged = boardSpaces.some((piece, index) => piece !== lastCheckedBoard[index]);
    setHasChanges(boardChanged);
  }, [boardSpaces, lastCheckedBoard]);

  // Show tooltip when interaction mode changes
  useEffect(() => {
    // Clear existing timer
    if (modeTooltipTimerRef.current) {
      clearTimeout(modeTooltipTimerRef.current);
    }
    
    // Show tooltip
    setModeTooltip(modeDescriptions[interactionMode]);
    
    // Hide after 3 seconds
    modeTooltipTimerRef.current = setTimeout(() => {
      setModeTooltip(null);
    }, 3000);
    
    return () => {
      if (modeTooltipTimerRef.current) {
        clearTimeout(modeTooltipTimerRef.current);
      }
    };
  }, [interactionMode]);

  // Show tooltip when animation option changes
  useEffect(() => {
    // Clear existing timer
    if (animTooltipTimerRef.current) {
      clearTimeout(animTooltipTimerRef.current);
    }
    
    // Show tooltip
    setAnimTooltip(animDescriptions[animationOption]);
    
    // Hide after 3 seconds
    animTooltipTimerRef.current = setTimeout(() => {
      setAnimTooltip(null);
    }, 3000);
    
    return () => {
      if (animTooltipTimerRef.current) {
        clearTimeout(animTooltipTimerRef.current);
      }
    };
  }, [animationOption]);

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
    setPartialPositions(new Set()); // Clear partial positions on reset
    setPlayDirection(null); // Reset play direction (will be determined on first check)
    setHasChanges(false); // No changes at start
    setLastCheckedBoard([...initialBoard]); // Set initial board as baseline for comparison
  };

  // Handle tray piece click
  const handleTraySpaceClick = (trayIndex) => {
    const piece = traySpaces[trayIndex];
    if (!piece || gameStatus !== 'playing') return;
    
    // Option 2 & 3: Block tray clicks
    if (interactionMode === 'option2' || interactionMode === 'option3') return;

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

    // Option 4: No tap-to-switch, only allow selecting (not placing)
    if (interactionMode === 'option4') {
      // If clicking on a different piece, just select it instead
      if (currentPiece && currentPiece !== selectedPiece) {
        setSelectedPiece(currentPiece);
        setSelectedFrom({ type: 'board', index: boardIndex });
      }
      return;
    }

    // If piece is selected, place it (Option 1 only)
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

    // Clear partial state from involved positions when piece is moved
    setPartialPositions(prev => {
      const updated = new Set(prev);
      if (fromLocation.type === 'board') {
        updated.delete(fromLocation.index); // Clear source position
      }
      updated.delete(boardIndex); // Clear target position
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f251af1e-faaf-4486-88d3-157c9976b4ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameContainer.jsx:placePiece',message:'Clearing partialPositions',data:{fromIndex:fromLocation.index,toIndex:boardIndex,prevPartial:Array.from(prev),newPartial:Array.from(updated)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return updated;
    });

    // Clear partial arcs connected to moved positions (so amber arcs fade)
    setCheckArcs(prev => {
      const updated = [...prev];
      const indicesToClear = new Set();
      if (fromLocation.type === 'board') {
        // Arc ending at source position (arc index = position - 1, wrapping)
        indicesToClear.add((fromLocation.index + 11) % 12);
        // Arc starting at source position (arc index = position)
        indicesToClear.add(fromLocation.index);
      }
      // Arc ending at target position
      indicesToClear.add((boardIndex + 11) % 12);
      // Arc starting at target position
      indicesToClear.add(boardIndex);
      
      indicesToClear.forEach(idx => {
        if (updated[idx]) {
          updated[idx] = { ...updated[idx], isPartial: false };
        }
      });
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

    // Play item placement sound
    playSound('item-place');

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
      
      // Clear wrong state from the board position when piece is moved to tray
      setWrongPositions(prev => {
        const updated = new Set(prev);
        updated.delete(fromIndex);
        return updated;
      });
      
      // Clear partial state from the board position when piece is moved to tray
      setPartialPositions(prev => {
        const updated = new Set(prev);
        updated.delete(fromIndex);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f251af1e-faaf-4486-88d3-157c9976b4ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameContainer.jsx:handleDragEnd-boardToTray',message:'Clearing partialPositions on board-to-tray',data:{fromIndex,prevPartial:Array.from(prev),newPartial:Array.from(updated)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return updated;
      });
      
      // Clear partial arcs connected to the moved position (so amber arcs fade)
      setCheckArcs(prev => {
        const updated = [...prev];
        // Arc ending at this position (arc index = position - 1, wrapping)
        const leftArcIdx = (fromIndex + 11) % 12;
        // Arc starting at this position (arc index = position)
        const rightArcIdx = fromIndex;
        
        if (updated[leftArcIdx]) {
          updated[leftArcIdx] = { ...updated[leftArcIdx], isPartial: false };
        }
        if (updated[rightArcIdx]) {
          updated[rightArcIdx] = { ...updated[rightArcIdx], isPartial: false };
        }
        return updated;
      });
      
      setBoardSpaces(newBoard);
      setTraySpaces(newTray);
      playSound('item-place');
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
    setWrongPositions(new Set()); // Clear persistent wrong state at start of check
    setPartialPositions(new Set()); // Clear persistent partial state at start of check
    let allCorrect = true;

    // Determine play direction if not yet set
    // Direction is determined by the first piece adjacent to the starter (position 1)
    let currentDirection = playDirection;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f251af1e-faaf-4486-88d3-157c9976b4ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameContainer.jsx:handleCheck:direction-start',message:'Direction check starting',data:{playDirection,pieceAtPos1:boardSpaces[1],forwardExpected:correctOrderForward[1],reverseExpected:correctOrderReverse[1]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (currentDirection === null && boardSpaces[1]) {
      const pieceAtPos1 = boardSpaces[1];
      // Check if it matches forward order (A→B)
      if (pieceAtPos1 === correctOrderForward[1]) {
        currentDirection = 'forward';
        setPlayDirection('forward');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f251af1e-faaf-4486-88d3-157c9976b4ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameContainer.jsx:handleCheck:direction-set',message:'Direction set to FORWARD',data:{pieceAtPos1,matchedForward:correctOrderForward[1]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      }
      // Check if it matches reverse order (B→A) - the last non-starter item in forward is first in reverse
      else if (pieceAtPos1 === correctOrderReverse[1]) {
        currentDirection = 'reverse';
        setPlayDirection('reverse');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f251af1e-faaf-4486-88d3-157c9976b4ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameContainer.jsx:handleCheck:direction-set',message:'Direction set to REVERSE',data:{pieceAtPos1,matchedReverse:correctOrderReverse[1]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      }
      // If neither matches exactly, leave direction as null and use forward as default
    }
    
    // Get the correct order based on determined direction
    const correctOrder = getCorrectOrder(currentDirection);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f251af1e-faaf-4486-88d3-157c9976b4ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameContainer.jsx:handleCheck:direction-result',message:'Using correct order',data:{currentDirection,correctOrderUsed:correctOrder},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Helper to check if two pieces are correctly connected (in either direction)
    const areCorrectlyConnected = (pieceA, pieceB) => {
      if (!pieceA || !pieceB) return false;
      const indexA = correctOrder.indexOf(pieceA);
      const indexB = correctOrder.indexOf(pieceB);
      // They're connected if A is immediately before B OR B is immediately before A (wrapping for loop)
      // This allows both directions: corn→ear AND ear→corn are both valid connections
      return (indexA + 1) % 12 === indexB || (indexB + 1) % 12 === indexA;
    };

    // Calculate arc states (connections between adjacent pieces)
    const arcSegments = boardSpaces.map((piece, index) => {
      const nextIndex = (index + 1) % 12; // Wrap around for last arc
      const nextPiece = boardSpaces[nextIndex];
      const currentCorrect = piece === correctOrder[index];
      const nextCorrect = nextPiece === correctOrder[nextIndex];
      const isCorrect = currentCorrect && nextCorrect; // Both must be correct for teal arc
      
      // Partial: pieces are correctly connected but not in correct absolute positions
      const correctlyConnected = areCorrectlyConnected(piece, nextPiece);
      const isPartial = !isCorrect && correctlyConnected;
      
      return {
        isCorrect,
        isPartial,
        index
      };
    });
    
    setPreviousCheckArcs(checkArcs); // Store previous for comparison
    setCheckArcs(arcSegments); // Freeze arc results for this check
    // #region agent log
    const partialArcsInCheck = arcSegments.filter(s => s.isPartial);
    fetch('http://127.0.0.1:7242/ingest/f251af1e-faaf-4486-88d3-157c9976b4ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameContainer.jsx:handleCheck',message:'Setting checkArcs with partial arcs',data:{partialArcs:partialArcsInCheck.map(a=>({index:a.index}))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Calculate total animation duration (based on arcs that need animation - not already correct/partial)
    const nonPersistentArcsCount = arcSegments.filter((s, i) => {
      const prevArc = checkArcs.find(ps => ps.index === i);
      // Skip if was already correct/partial and still is
      const alreadyPersistent = prevArc && (
        (prevArc.isCorrect && s.isCorrect) || 
        (prevArc.isPartial && s.isPartial)
      );
      return !alreadyPersistent;
    }).length;
    const actualAnimationDuration = nonPersistentArcsCount * CHECK_SEGMENT_DURATION;

    // Build array of items to check with their properties
    const itemsToCheck = boardSpaces.map((piece, index) => {
      const isCorrect = piece === correctOrder[index];
      // #region agent log
      if (index === 1) {
        fetch('http://127.0.0.1:7242/ingest/f251af1e-faaf-4486-88d3-157c9976b4ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameContainer.jsx:handleCheck:pos1-check',message:'Checking position 1',data:{piece,expected:correctOrder[1],isCorrect,currentDirection},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
      }
      // #endregion
      if (!isCorrect) allCorrect = false;
      
      // Check if this arc should be skipped (already correct or partial from previous check)
      const prevArc = checkArcs.find(ps => ps.index === index);
      const currentArc = arcSegments[index];
      const shouldSkipArc = prevArc && (
        (prevArc.isCorrect && currentArc.isCorrect) ||
        (prevArc.isPartial && currentArc.isPartial)
      );
      
      // A piece is partial if it has at least one correctly-connected neighbor
      // Check the arc to the left (index-1 -> index) and the arc to the right (index -> index+1)
      const leftArcIndex = (index + 11) % 12; // Arc that ends at this piece
      const rightArcIndex = index; // Arc that starts at this piece
      const hasPartialConnection = arcSegments[leftArcIndex].isPartial || arcSegments[rightArcIndex].isPartial;
      const isPartial = !isCorrect && hasPartialConnection;
      
      return {
        piece,
        index,
        isCorrect,
        isPartial,
        shouldSkipArc
      };
    });

    // Schedule visual feedback and sound for each piece (synced together)
    itemsToCheck.forEach((item) => {
      const { piece, index, isCorrect, isPartial, shouldSkipArc } = item;
      
      // Skip already-correct/partial arcs entirely
      if (shouldSkipArc) return;
      
      // Calculate adjusted delay (matching arc delay logic from CheckProgressRing)
      const nonPersistentArcsBefore = itemsToCheck
        .slice(0, index)
        .filter(i => !i.shouldSkipArc).length;
      
      const adjustedPieceDelay = nonPersistentArcsBefore * CHECK_SEGMENT_DURATION * 1000;
      
      // Schedule state changes and sound for this piece after its arc completes
      setTimeout(() => {
        // Play sound when visual changes (synced with border color change)
        if (!correctPositions.has(index)) {
          playSound('check-item');
        }
        
        // Set temporary feedback: correct > partial > wrong
        const feedbackType = isCorrect ? 'correct' : (isPartial ? 'partial' : 'wrong');
        setFeedback(prev => ({
          ...prev,
          [index]: feedbackType
        }));
        
        // Set persistent state
        if (isCorrect) {
          setCorrectPositions(prev => new Set([...prev, index]));
        } else if (isPartial) {
          // Add to partialPositions
          setPartialPositions(prev => new Set([...prev, index]));
        } else {
          // Add to wrongPositions (includes empty spaces for anim option2)
          setWrongPositions(prev => new Set([...prev, index]));
        }
      }, adjustedPieceDelay);
    });

    // Clear feedback and finish check after all animations complete + 1s pause
    setTimeout(() => {
      setFeedback({});
      setIsChecking(false);

      if (allCorrect) {
        playSound('game-success', 0.15);
        setGameStatus('won');
      } else {
        playSound('game-try-again', 0.45);
        const newTries = triesRemaining - 1;
        setTriesRemaining(newTries);
        if (newTries === 0) {
          setGameStatus('failed');
        }
      }
    }, (actualAnimationDuration + 1) * 1000);  // Actual animation time + 1s pause
  };

  // Create board piece render function for GameBoard to use
  const createBoardPiece = (piece, index, swapOffset) => {
    const isCorrectLocked = correctPositions.has(index);
    const isWrongPersistent = wrongPositions.has(index);
    const isPartialPersistent = partialPositions.has(index);
    
    
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
        isPartialPersistent={isPartialPersistent}
        interactionMode={interactionMode}
        onCloseZoom={() => {
          setSelectedPiece(null);
          setSelectedFrom(null);
        }}
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
            
            // Option 4: No tap-to-switch, just select the clicked piece
            if (interactionMode === 'option4') {
              setSelectedPiece(piece);
              setSelectedFrom({ type: 'board', index });
              return;
            }
            
            // If different piece is selected, place it here (Option 1 only)
            if (selectedPiece && selectedPiece !== piece) {
              placePiece(index);
            }
          }}
        />
    );
  };

  // Handle clicks on background to close modal
  const handleBackgroundClick = (e) => {
    // Close modal if NOT clicking on game pieces, board spaces, tray, controls, nav, or modal
    const clickedElement = e.target;
    const isGameElement = clickedElement.closest('.board-space') || 
                         clickedElement.closest('.tray-space') ||
                         clickedElement.closest('.piece-that-drags') ||
                         clickedElement.closest('.Controls') ||
                         clickedElement.closest('.Nav') ||
                         clickedElement.closest('.PieceModal');
    
    if (!isGameElement && selectedPiece) {
      setSelectedPiece(null);
      setSelectedFrom(null);
    }
  };

  return (
    <div 
      className="GameContainer-wrapper flex flex-col justify-start relative min-h-screen w-full items-center justify-center p-0 gap-y-2 h-dvh "
      onClick={handleBackgroundClick}
    >
        {/* Sticky Nav at top */}
        <nav className="Nav flex top-0 h-[50px] z-0 w-full items-start justify-center px-0 gap-2">
          {/* Left: Toggle Testing */}          
          <button 
            onClick={() => setShowTesting(!showTesting)}
            className='ToggleTesting flex items-center justify-center w-[40px] h-[40px] bg-transparent hover:bg-sky-800 rounded-full transition-colors cursor-pointer'
          >
            <span className="text-xs text-[#050d1c]">
              {showTesting ? '✕' : 'ON'}
            </span>
          </button>

          {/* Game Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="appearance-none h-[40px] pl-3 pr-8 bg-gray-800 text-gray-300 text-sm font-comfortaa rounded-full border border-slate-600 cursor-pointer focus:outline-none focus:border-teal-500 transition-colors"
            >
              {Object.entries(GAMES).map(([key, game]) => (
                <option key={key} value={key}>
                  {game.name}
                </option>
              ))}
            </select>
            {/* Custom chevron */}
            <svg 
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Animation Option Dropdown */}
          <div className="relative">
            <select
              value={animationOption}
              onChange={(e) => setAnimationOption(e.target.value)}
              className="appearance-none h-[40px] pl-3 pr-8 bg-gray-800 text-gray-300 text-sm font-comfortaa rounded-full border border-slate-600 cursor-pointer focus:outline-none focus:border-teal-500 transition-colors"
            >
              <option value="option1">Anim 1</option>
              <option value="option2">Anim 2</option>
            </select>
            {/* Custom chevron */}
            <svg 
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-gray-400"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {/* Right: Draggable Interaction Mode Toggle */}
          <div className="flex relative bg-gray-800 rounded-full p-1 ">
            {/* Draggable pill background */}
            <motion.div
              className="drag-toggle absolute bg-sky-975/10 rounded-full z-99 border border-slate-600 cursor-grab active:cursor-grabbing"
              style={{ 
                height: '36px',
                top: '2px',
                left: '4px'
              }}
              animate={{
                // Visual order: Option 1 → Option 4 → Option 2 → Option 3
                x: interactionMode === 'option1' ? 0 
                  : interactionMode === 'option4' ? toggleDimensions.option1Width
                  : interactionMode === 'option2' ? toggleDimensions.option1Width + toggleDimensions.option4Width
                  : toggleDimensions.option1Width + toggleDimensions.option4Width + toggleDimensions.option2Width,
                width: interactionMode === 'option1' ? toggleDimensions.option1Width 
                  : interactionMode === 'option4' ? toggleDimensions.option4Width
                  : interactionMode === 'option2' ? toggleDimensions.option2Width
                  : toggleDimensions.option3Width
              }}
              drag="x"
              dragConstraints={{ 
                left: 0, 
                right: toggleDimensions.option1Width + toggleDimensions.option4Width + toggleDimensions.option2Width
              }}
              dragElastic={0}
              dragMomentum={true}  // ✅ MUST be true for modifyTarget to work!
              dragSnapToOrigin={false}
              dragTransition={{
                power: 0.05,  // Very low momentum (0.05 = minimal carry, fast stop)
                timeConstant: 50,  // Fast deceleration (50ms = snappy stop)
                bounceStiffness: 800,  // How fast pill snaps to target (higher = faster)
                bounceDamping: 40,  // Bounce control (matched to stiffness for smooth snap)
                modifyTarget: (target) => {
                  // Visual order: Option 1 → Option 4 → Option 2 → Option 3
                  const threshold1 = toggleDimensions.option1Width / 2;
                  const threshold2 = toggleDimensions.option1Width + toggleDimensions.option4Width / 2;
                  const threshold3 = toggleDimensions.option1Width + toggleDimensions.option4Width + toggleDimensions.option2Width / 2;
                  
                  let snappedX;
                  if (target < threshold1) {
                    snappedX = 0;  // Option 1
                  } else if (target < threshold2) {
                    snappedX = toggleDimensions.option1Width;  // Option 4
                  } else if (target < threshold3) {
                    snappedX = toggleDimensions.option1Width + toggleDimensions.option4Width;  // Option 2
                  } else {
                    snappedX = toggleDimensions.option1Width + toggleDimensions.option4Width + toggleDimensions.option2Width;  // Option 3
                  }
                  
                  return snappedX;
                }
              }}
              onDragEnd={(event, info) => {
                // Get absolute position to determine which option
                const dragElement = event.target;
                const rect = dragElement.getBoundingClientRect();
                const containerRect = dragElement.parentElement.getBoundingClientRect();
                
                // Calculate center point relative to container
                const relativeX = rect.left - containerRect.left + rect.width / 2;
                
                // Visual order: Option 1 → Option 4 → Option 2 → Option 3
                const threshold1 = toggleDimensions.option1Width;
                const threshold2 = toggleDimensions.option1Width + toggleDimensions.option4Width;
                const threshold3 = toggleDimensions.option1Width + toggleDimensions.option4Width + toggleDimensions.option2Width;
                
                let newMode;
                if (relativeX < threshold1) {
                  newMode = 'option1';
                } else if (relativeX < threshold2) {
                  newMode = 'option4';
                } else if (relativeX < threshold3) {
                  newMode = 'option2';
                } else {
                  newMode = 'option3';
                }
                
                // Set mode - animate will handle smooth snap-back
                setInteractionMode(newMode);
                
              }}
              transition={{ 
                type: 'spring',     // Physics-based animation
                stiffness: 800,     // Controls click/programmatic changes (clicking option buttons)
                damping: 40         // Smoothness for click animations
              }}
              layout
            />
            
            {/* Option 1 button */}
            <button
              ref={option1Ref}
              onClick={() => setInteractionMode('option1')}
              className={`relative z-10 px-4 py-2 font-bold text-xs rounded-full font-comfortaa transition-colors ${
                interactionMode === 'option1' ? 'text-teal-500' : 'text-gray-400'
              }`}
            >
              Tap+
            </button>
            
            {/* Option 4 button */}
            <button
              ref={option4Ref}
              onClick={() => setInteractionMode('option4')}
              className={`relative z-10 px-4 py-2 font-bold text-xs rounded-full font-comfortaa transition-colors ${
                interactionMode === 'option4' ? 'text-teal-500' : 'text-gray-400'
              }`}
            >
              Tap
            </button>
            
            {/* Option 2 button */}
            <button
              ref={option2Ref}
              onClick={() => setInteractionMode('option2')}
              className={`relative z-10 px-4 py-2 font-bold text-xs rounded-full font-comfortaa transition-colors ${
                interactionMode === 'option2' ? 'text-teal-500' : 'text-gray-400'
              }`}
            >
              Hold
            </button>
            
            {/* Option 3 button */}
            <button
              ref={option3Ref}
              onClick={() => setInteractionMode('option3')}
              className={`relative z-10 px-4 py-2 font-bold text-xs rounded-full font-comfortaa transition-colors ${
                interactionMode === 'option3' ? 'text-teal-500' : 'text-gray-400'
              }`}
            >
              Pause
            </button>
          </div>
        </nav>

        {/* Mode change tooltip */}
        <AnimatePresence>
          {modeTooltip && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed top-11 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap	"
            >
              {modeTooltip}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animation option tooltip */}
        <AnimatePresence>
          {animTooltip && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed top-11 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap"
            >
              {animTooltip}
            </motion.div>
          )}
        </AnimatePresence>
      
      {/* Main content wrapper */}
      <div className="GameContainer relative flex flex-col items-center justify-center text-center space-y-8 max-w-sm w-full">

      {/* Layer 0: Background (gradient + ring) */}
      <BackgroundLayer 
        gameStatus={gameStatus}
        isChecking={isChecking}
        hasEverChecked={hasEverChecked}
        checkArcs={checkArcs}
        previousCheckArcs={previousCheckArcs}
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
              isPartialPersistent={selectedFrom.type === 'board' && partialPositions.has(selectedFrom.index)}
              interactionMode={interactionMode}
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
            partialPositions={Array.from(partialPositions)}
            activeBoardIndex={activeBoardIndex}
            hoveredSwapTarget={hoveredSwapTarget}
            hasSelectedPiece={selectedPiece !== null}
            interactionMode={interactionMode}
            animationOption={animationOption}
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
                  isSelected={selectedPiece === piece && selectedFrom?.type === 'tray' && selectedFrom?.index === index && interactionMode !== 'option3'}
                  isDraggable={gameStatus === 'playing'}
                  fromType="tray"
                  fromIndex={index}
                  interactionMode={interactionMode}
                  onCloseZoom={() => {
                    setSelectedPiece(null);
                    setSelectedFrom(null);
                  }}
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
                    // Option 1 & 4: If clicking the same selected piece, deselect it (close zoom)
                    if ((interactionMode === 'option1' || interactionMode === 'option4') && 
                        selectedPiece === piece && selectedFrom?.type === 'tray' && selectedFrom?.index === index) {
                      setSelectedPiece(null);
                      setSelectedFrom(null);
                      return;
                    }
                    setSelectedPiece(piece);
                    setSelectedFrom({ type: 'tray', index });
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
                   {/* SVG Preview */}
        <div className=" flex gap-2  flex-col items-center justify-center p-0h bg-black rounded">
          <div className=" w-[12px] h-[12px] ">
            <img src="/images/loop-check@2x.webp" alt="Check " className="w-[12px] h-[12px]"
                          style={{ filter: 'drop-shadow(0 0 1px #14B8A6) drop-shadow(0 0 4px #14B8A6)' }}

            />
          </div>
          <div className=" w-[12px] h-[12px] ">
            <img src="/images/loop-x@2x.webp" alt="X " className="w-[12px] h-[12px]" 
              style={{ filter: 'drop-shadow(0 0 1px #DC2626) drop-shadow(0 0 4px #DC2626)' }}
            />
          </div>
        </div>
        </div>
        )}
      
      </div>


    </div>
  );
};

export default GameContainer;

