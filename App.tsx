
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from './components/Sidebar';
import { GearComponent } from './components/GearComponent';
import { BrickComponent } from './components/BrickComponent';
import { GearProperties } from './components/GearProperties';
import { TutorialOverlay, TutorialStep } from './components/TutorialOverlay';
import { GearState, GearType, Belt, BrickState } from './types';
import { GEAR_DEFS, SNAP_THRESHOLD, BASE_SPEED_MULTIPLIER, HOLE_SPACING, BEAM_SIZES, BRICK_WIDTH } from './constants';
import { getDistance, propagatePhysics, generateBeltPath } from './utils/gearMath';
import { CHALLENGES } from './data/challenges';
import { TRANSLATIONS, Language } from './utils/translations';
import { audioManager } from './utils/audio';

const App: React.FC = () => {
  const [gears, setGears] = useState<GearState[]>([]);
  const [belts, setBelts] = useState<Belt[]>([]);
  const [bricks, setBricks] = useState<BrickState[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedBrickId, setSelectedBrickId] = useState<string | null>(null);
  
  // Belt Creation Mode
  const [beltSourceId, setBeltSourceId] = useState<string | null>(null);

  const [draggingAxleId, setDraggingAxleId] = useState<string | null>(null);
  const [draggingBrickId, setDraggingBrickId] = useState<string | null>(null);
  
  const [globalRpm, setGlobalRpm] = useState(60); 
  
  // Role Highlights State
  const [showRoles, setShowRoles] = useState(false);
  
  // Label Toggles State - Defaults OFF
  const [showSpecs, setShowSpecs] = useState(false); 
  const [showRatio, setShowRatio] = useState(false); 
  const [showRpm, setShowRpm] = useState(false);    
  const [showTorque, setShowTorque] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light' | 'steam'>('dark');

  // Audio State
  const [isMuted, setIsMuted] = useState(false);

  // Language State
  const [lang, setLang] = useState<Language>('en');
  const t = TRANSLATIONS[lang];

  // Tutorial State
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // View Transform State (Zoom/Pan)
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Touch Refs
  const lastPinchRef = useRef<{ dist: number, center: {x: number, y: number} } | null>(null);

  // Challenge State
  const [activeChallengeId, setActiveChallengeId] = useState<number | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<number[]>([]);
  const [highlightedGearIds, setHighlightedGearIds] = useState<string[]>([]);
  const [challengeSuccess, setChallengeSuccess] = useState(false);

  // Undo/Redo History State
  const [history, setHistory] = useState<{ gears: GearState[], belts: Belt[], bricks: BrickState[] }[]>([]);
  const [future, setFuture] = useState<{ gears: GearState[], belts: Belt[], bricks: BrickState[] }[]>([]);
  const undoRef = useRef<{ gears: GearState[], belts: Belt[], bricks: BrickState[] }>({ gears: [], belts: [], bricks: [] }); 
  const hasMovedRef = useRef(false); 

  const workspaceRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // --- Theme Effect ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
      if (theme === 'dark') setTheme('light');
      else if (theme === 'light') setTheme('steam');
      else setTheme('dark');
  };

  const getThemeIcon = () => {
      if (theme === 'dark') return '☀️';
      if (theme === 'light') return '💡';
      return '🌙';
  };

  const getThemeTitle = () => {
      if (theme === 'dark') return t.light;
      if (theme === 'light') return t.steam;
      return t.dark;
  };
  
  // --- Audio Effects ---
  useEffect(() => {
      audioManager.toggleMute(isMuted);
  }, [isMuted]);

  useEffect(() => {
      // Motor Sound Logic
      const activeMotor = gears.some(g => g.isMotor && !g.isJammed && !g.isStalled);
      audioManager.updateMotor(globalRpm, activeMotor);
  }, [gears, globalRpm, isMuted]);

  useEffect(() => {
      if (challengeSuccess) {
          audioManager.playSuccess();
      }
  }, [challengeSuccess]);

  // --- History Management ---
  const pushHistory = useCallback((currentGears: GearState[], currentBelts: Belt[], currentBricks: BrickState[]) => {
    setHistory(prev => [...prev, { gears: currentGears, belts: currentBelts, bricks: currentBricks }]);
    setFuture([]); 
  }, []);

  const performUndo = useCallback(() => {
    setHistory(prevHistory => {
        if (prevHistory.length === 0) return prevHistory;
        const previousState = prevHistory[prevHistory.length - 1];
        const newHistory = prevHistory.slice(0, -1);
        
        setFuture(prevFuture => [{ gears, belts, bricks }, ...prevFuture]);
        setGears(previousState.gears);
        setBelts(previousState.belts);
        setBricks(previousState.bricks);
        return newHistory;
    });
  }, [gears, belts, bricks]);

  const performRedo = useCallback(() => {
    setFuture(prevFuture => {
        if (prevFuture.length === 0) return prevFuture;
        const nextState = prevFuture[0];
        const newFuture = prevFuture.slice(1);

        setHistory(prevHistory => [...prevHistory, { gears, belts, bricks }]);
        setGears(nextState.gears);
        setBelts(nextState.belts);
        setBricks(nextState.bricks);
        return newFuture;
    });
  }, [gears, belts, bricks]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
            if (e.shiftKey) {
                e.preventDefault();
                performRedo();
            } else {
                e.preventDefault();
                performUndo();
            }
        }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
             e.preventDefault();
             performRedo();
        }
        if (e.key === 'Escape') {
            setBeltSourceId(null);
            setSelectedId(null);
            setSelectedBrickId(null);
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedId) deleteGear(selectedId);
            if (selectedBrickId) deleteBrick(selectedBrickId);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performUndo, performRedo, selectedId, selectedBrickId]);


  // Challenge Check Loop
  useEffect(() => {
    if (!activeChallengeId) {
      setHighlightedGearIds([]);
      setChallengeSuccess(false);
      return;
    }

    const challenge = CHALLENGES.find(c => c.id === activeChallengeId);
    if (challenge) {
      const successIds = challenge.check(gears);
      if (successIds.length > 0) {
        setHighlightedGearIds(successIds);
        setChallengeSuccess(true);
        if (!completedChallenges.includes(challenge.id)) {
          setCompletedChallenges(prev => [...prev, challenge.id]);
        }
      } else {
        setHighlightedGearIds([]);
        setChallengeSuccess(false);
      }
    }
  }, [gears, activeChallengeId, completedChallenges]);

  // Animation Frame Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = (time - lastTime) / 16.66; 
      lastTime = time;

      setGears(prevGears => {
        let changed = false;
        const nextGears = prevGears.map(gear => {
          if (gear.rpm !== 0 && !gear.isJammed && !gear.isStalled) {
            changed = true;
            const rotationStep = gear.rpm * 0.1 * dt;
            return {
              ...gear,
              rotation: (gear.rotation + (rotationStep * gear.direction)) % 360
            };
          }
          return gear;
        });
        return changed ? nextGears : prevGears;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // --- Coordinate Helpers ---
  const screenToWorld = useCallback((sx: number, sy: number) => {
    if (!workspaceRef.current) return { x: 0, y: 0 };
    const rect = workspaceRef.current.getBoundingClientRect();
    return {
        x: (sx - rect.left - view.x) / view.scale,
        y: (sy - rect.top - view.y) / view.scale
    };
  }, [view]);

  /**
   * Finds a free spot on the canvas spiraling out from the center.
   * Used when adding new parts to prevent overlap.
   */
  const findFreeSpot = useCallback((
    preferredX: number, 
    preferredY: number, 
    radius: number
  ): { x: number, y: number } => {
    let x = preferredX;
    let y = preferredY;
    let angle = 0;
    let dist = 0;
    
    // Spiral parameters
    const angleStep = 0.5; 
    
    let iterations = 0;
    // Limit search to avoid perf hit if extremely crowded
    const maxIterations = 100; 

    while (iterations < maxIterations) {
        let collision = false;

        // Check against Gears
        for (const g of gears) {
            const gDef = GEAR_DEFS[g.type];
            // Distance between centers
            const d = Math.hypot(x - g.x, y - g.y);
            // Min distance needed = r1 + r2 + padding
            if (d < (radius + gDef.radius + 15)) {
                collision = true;
                break;
            }
        }

        if (!collision) {
             // Check against Bricks
             for (const b of bricks) {
                // Check distance to brick holes
                const rad = (b.rotation * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                
                const isBeam = b.brickType === 'beam';
                const loopLimit = isBeam ? b.length : Math.max(1, b.length - 1);

                for(let i=0; i<loopLimit; i++) {
                    const hx = b.x + i * 40 * cos;
                    const hy = b.y + i * 40 * sin;
                    const d = Math.hypot(x - hx, y - hy);
                    if (d < (radius + 20 + 15)) { // 20 = approx brick half-width/radius
                        collision = true;
                        break;
                    }
                }
                if (collision) break;
             }
        }

        if (!collision) {
            return { x, y };
        }

        // Next position in spiral
        angle += angleStep;
        dist = 50 + (angle * 10); // Start at 50 offset, expand 10px per radian
        x = preferredX + Math.cos(angle) * dist;
        y = preferredY + Math.sin(angle) * dist;
        
        iterations++;
    }
    
    // Fallback
    return { 
        x: preferredX + (Math.random() - 0.5) * 50, 
        y: preferredY + (Math.random() - 0.5) * 50 
    };
  }, [gears, bricks]);


  // --- Zoom / Pan Handlers ---
  const handleWheel = (e: React.WheelEvent) => {
    const rect = workspaceRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomIntensity = 0.1;
    const delta = e.deltaY < 0 ? 1 : -1;
    const newScale = Math.min(Math.max(0.2, view.scale + delta * zoomIntensity * view.scale), 4);
    const scaleRatio = newScale / view.scale;
    const newX = mouseX - (mouseX - view.x) * scaleRatio;
    const newY = mouseY - (mouseY - view.y) * scaleRatio;
    setView({ x: newX, y: newY, scale: newScale });
  };

  const handlePanMouseDown = (e: React.MouseEvent) => {
    const target = e.target as Element;
    const isBackground = target === workspaceRef.current || target.tagName === 'svg' || target.id === 'grid-bg';
    
    if (e.button === 1 || (e.button === 0 && isBackground)) {
       setIsPanning(true);
       setPanStart({ x: e.clientX - view.x, y: e.clientY - view.y });
       setSelectedId(null);
       setSelectedBrickId(null);
    }
  };

  // --- Touch Handlers ---
  const handleGearTouchStart = (e: React.TouchEvent, id: string) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation(); 

    setSelectedId(id);
    setSelectedBrickId(null);
    const gear = gears.find(g => g.id === id);
    if (gear) {
        undoRef.current = { gears, belts, bricks };
        hasMovedRef.current = false;
        setDraggingAxleId(gear.axleId);
        
        const touch = e.touches[0];
        const worldPos = screenToWorld(touch.clientX, touch.clientY);
        setDragOffset({ x: worldPos.x - gear.x, y: worldPos.y - gear.y });
    }
  };

  const handleBrickTouchStart = (e: React.TouchEvent, id: string) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();

    setSelectedBrickId(id);
    setSelectedId(null);
    const brick = bricks.find(b => b.id === id);
    if (brick) {
        undoRef.current = { gears, belts, bricks };
        hasMovedRef.current = false;
        setDraggingBrickId(id);

        const touch = e.touches[0];
        const worldPos = screenToWorld(touch.clientX, touch.clientY);
        setDragOffset({ x: worldPos.x - brick.x, y: worldPos.y - brick.y });
    }
  };

  const handleWorkspaceTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
         // Check if we are touching background
         if(e.target === workspaceRef.current || (e.target as Element).tagName === 'svg' || (e.target as Element).id === 'grid-bg') {
             setIsPanning(true);
             const touch = e.touches[0];
             setPanStart({ x: touch.clientX - view.x, y: touch.clientY - view.y });
             setSelectedId(null);
             setSelectedBrickId(null);
         }
    } else if (e.touches.length === 2) {
         setDraggingAxleId(null);
         setDraggingBrickId(null);
         setIsPanning(false);
         
         const t1 = e.touches[0];
         const t2 = e.touches[1];
         const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
         const cx = (t1.clientX + t2.clientX) / 2;
         const cy = (t1.clientY + t2.clientY) / 2;
         lastPinchRef.current = { dist, center: { x: cx, y: cy } };
    }
  };

  const handleWorkspaceTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const worldPos = screenToWorld(touch.clientX, touch.clientY);

        if (draggingAxleId) {
            hasMovedRef.current = true;
            const x = worldPos.x - dragOffset.x;
            const y = worldPos.y - dragOffset.y;
            
            setGears(prev => prev.map(g => {
              if (g.axleId === draggingAxleId) return { ...g, x, y };
              return g;
            }));
        } else if (draggingBrickId) {
            hasMovedRef.current = true;
            const x = worldPos.x - dragOffset.x;
            const y = worldPos.y - dragOffset.y;

            setBricks(prev => prev.map(b => {
                if (b.id === draggingBrickId) return { ...b, x, y };
                return b;
            }));
        } else if (isPanning) {
            setView(v => ({ ...v, x: touch.clientX - panStart.x, y: touch.clientY - panStart.y }));
        }
    } else if (e.touches.length === 2 && lastPinchRef.current) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        
        const currentScale = view.scale;
        const newScale = Math.min(4, Math.max(0.2, currentScale * (dist / lastPinchRef.current.dist)));
        const scaleRatio = newScale / currentScale;
        
        const zoomCenter = lastPinchRef.current.center;
        const newX = zoomCenter.x - (zoomCenter.x - view.x) * scaleRatio;
        const newY = zoomCenter.y - (zoomCenter.y - view.y) * scaleRatio;

        setView({ x: newX, y: newY, scale: newScale });
        lastPinchRef.current = { dist, center: zoomCenter };
    }
  };

  const handleWorkspaceTouchEnd = (e: React.TouchEvent) => {
      if (draggingAxleId || draggingBrickId) {
          handleMouseUp(); 
      }
      setIsPanning(false);
      lastPinchRef.current = null;
  };

  // --- Drag & Drop Creation ---
  const handleSidebarDragStart = (e: React.DragEvent, type: string, category: 'gear' | 'brick') => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, category }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        const worldPos = screenToWorld(e.clientX, e.clientY);
        
        if (isNaN(worldPos.x) || isNaN(worldPos.y)) return;

        if (data.category === 'gear') {
            addNewGear(data.type as GearType, worldPos.x, worldPos.y);
        } else if (data.category === 'brick') {
            let brickLength = 4;
            let brickType: 'beam' | 'brick' = 'beam';

            if (data.type.startsWith('{')) {
                 const parsed = JSON.parse(data.type);
                 brickLength = parsed.length;
                 brickType = parsed.brickType;
            } else {
                 brickLength = parseInt(data.type);
            }
            addNewBrick(brickLength, brickType, worldPos.x, worldPos.y);
        }
    } catch (err) {
        console.error("Drag drop error", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleAddGearFromSidebar = (type: GearType) => {
      if (workspaceRef.current) {
          const rect = workspaceRef.current.getBoundingClientRect();
          const center = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
          
          const def = GEAR_DEFS[type];
          const pos = findFreeSpot(center.x, center.y, def.radius);
          
          addNewGear(type, pos.x, pos.y);
      }
  };

  const handleAddBrickFromSidebar = (length: number, type: 'beam' | 'brick') => {
      if (workspaceRef.current) {
          const rect = workspaceRef.current.getBoundingClientRect();
          const center = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
          
          const pos = findFreeSpot(center.x, center.y, 40);
          
          addNewBrick(length, type, pos.x, pos.y);
      }
  };

  // --- Entity Manipulation ---
  const addNewGear = (type: GearType, x: number, y: number, existingAxleId?: string) => {
    pushHistory(gears, belts, bricks); 

    const newGear: GearState = {
      id: uuidv4(),
      axleId: existingAxleId || uuidv4(), 
      type,
      x,
      y,
      rotation: 0,
      connectedTo: [],
      isMotor: false,
      motorSpeed: 1, 
      motorRpm: globalRpm, 
      motorTorque: 100, 
      motorDirection: 1,
      load: 0, 
      ratio: 0,
      rpm: 0,
      torque: 0,
      direction: 1,
      speed: 0,
      isJammed: false,
      isStalled: false
    };

    let gearToAdd = newGear;
    if (!existingAxleId) {
        gearToAdd = snapGear(newGear, gears, bricks);
    }
    
    audioManager.playSnap();
    updatePhysics([...gears, gearToAdd], belts);
  };

  const addNewBrick = (length: number, type: 'beam' | 'brick', x: number, y: number) => {
      pushHistory(gears, belts, bricks);
      const snappedX = Math.round(x / 20) * 20;
      const snappedY = Math.round(y / 20) * 20;

      const newBrick: BrickState = {
          id: uuidv4(),
          length,
          brickType: type,
          x: snappedX,
          y: snappedY,
          rotation: 0
      };
      setBricks([...bricks, newBrick]);
      audioManager.playSnap();
  };

  const handleGearConnectBeltStart = (sourceId: string) => {
      setBeltSourceId(sourceId);
      setSelectedId(null); 
  };

  // --- Mouse Handlers for Gear/Brick Movement ---
  const handleGearMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.button !== 0) return; 

    if (beltSourceId) {
        if (beltSourceId !== id) {
            pushHistory(gears, belts, bricks);
            const newBelt: Belt = {
                id: uuidv4(),
                sourceId: beltSourceId,
                targetId: id
            };
            const newBelts = [...belts, newBelt];
            setBelts(newBelts);
            updatePhysics(gears, newBelts);
            setBeltSourceId(null); 
            audioManager.playSnap();
        }
        return;
    }

    setSelectedId(id);
    setSelectedBrickId(null);

    const gear = gears.find(g => g.id === id);
    if (gear) {
        undoRef.current = { gears, belts, bricks }; 
        hasMovedRef.current = false;

        setDraggingAxleId(gear.axleId);
        const worldPos = screenToWorld(e.clientX, e.clientY);
        setDragOffset({ x: worldPos.x - gear.x, y: worldPos.y - gear.y });
    }
  };

  const handleBrickMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    setSelectedBrickId(id);
    setSelectedId(null);

    const brick = bricks.find(b => b.id === id);
    if (brick) {
        undoRef.current = { gears, belts, bricks };
        hasMovedRef.current = false;
        setDraggingBrickId(id);
        const worldPos = screenToWorld(e.clientX, e.clientY);
        setDragOffset({ x: worldPos.x - brick.x, y: worldPos.y - brick.y });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
        setView(v => ({ ...v, x: e.clientX - panStart.x, y: e.clientY - panStart.y }));
        return;
    }
    const worldPos = screenToWorld(e.clientX, e.clientY);

    if (draggingAxleId) {
      hasMovedRef.current = true;
      const x = worldPos.x - dragOffset.x;
      const y = worldPos.y - dragOffset.y;
      setGears(prev => prev.map(g => {
        if (g.axleId === draggingAxleId) return { ...g, x, y };
        return g;
      }));
    } else if (draggingBrickId) {
      hasMovedRef.current = true;
      const x = worldPos.x - dragOffset.x;
      const y = worldPos.y - dragOffset.y;
      setBricks(prev => prev.map(b => {
          if (b.id === draggingBrickId) return { ...b, x, y };
          return b;
      }));
    }
  }, [isPanning, panStart, draggingAxleId, draggingBrickId, dragOffset, screenToWorld]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    
    if (draggingAxleId) {
      setGears(prev => {
        const movingAxleGears = prev.filter(g => g.axleId === draggingAxleId);
        if (movingAxleGears.length === 0) return prev;
        
        const refGear = movingAxleGears[0];
        const others = prev.filter(g => g.axleId !== draggingAxleId);
        
        const snappedRef = snapGear(refGear, others, bricks);
        
        if (snappedRef.x !== refGear.x || snappedRef.y !== refGear.y) {
            audioManager.playSnap();
        }

        const deltaX = snappedRef.x - refGear.x;
        const deltaY = snappedRef.y - refGear.y;
        const deltaRot = snappedRef.rotation - refGear.rotation; 
        
        const finalGears = prev.map(g => {
            if (g.axleId === draggingAxleId) {
                return { 
                  ...g, 
                  x: g.x + deltaX, 
                  y: g.y + deltaY,
                  rotation: (g.rotation + deltaRot) % 360 
                };
            }
            return g;
        });
        
        const connectedGears = recalculateConnections(finalGears);
        return propagatePhysics(connectedGears, belts);
      });

      if (hasMovedRef.current) {
          pushHistory(undoRef.current.gears, undoRef.current.belts, undoRef.current.bricks);
      }
      setDraggingAxleId(null);
      hasMovedRef.current = false;

    } else if (draggingBrickId) {
        setBricks(prev => {
            const movingBrick = prev.find(b => b.id === draggingBrickId);
            if (!movingBrick) return prev;
            
            const others = prev.filter(b => b.id !== draggingBrickId);
            
            // Smart Snap logic for Bricks
            const snapped = snapBrick(movingBrick, others);
            
            if (snapped.x !== movingBrick.x || snapped.y !== movingBrick.y) {
                audioManager.playSnap();
            }

            return prev.map(b => {
                if (b.id === draggingBrickId) {
                    return { ...b, x: snapped.x, y: snapped.y };
                }
                return b;
            });
        });

        if (hasMovedRef.current) {
            pushHistory(undoRef.current.gears, undoRef.current.belts, undoRef.current.bricks);
        }
        setDraggingBrickId(null);
        hasMovedRef.current = false;
    }
  }, [draggingAxleId, draggingBrickId, pushHistory, belts, bricks]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // --- Snapping & Alignment Logic ---
  const snapBrick = (brick: BrickState, others: BrickState[]): {x: number, y: number} => {
      let bestX = brick.x;
      let bestY = brick.y;
      let minDist = 20; // Initial snap threshold (half a hole)

      // 1. Default Grid Snap (20px)
      bestX = Math.round(bestX / 20) * 20;
      bestY = Math.round(bestY / 20) * 20;

      // 2. Magnetic Snap to Other Bricks (Stacking)
      // Vertical Stacking spacing is BRICK_WIDTH (34px)
      // Horizontal Stacking spacing is HOLE_SPACING (40px)
      
      // Check if brick is rotated (Vertical vs Horizontal)
      // If rotation % 180 == 0, it's horizontal. Else vertical.
      const isHorizontal = Math.abs(brick.rotation % 180) < 1;

      for (const other of others) {
          const isOtherHorizontal = Math.abs(other.rotation % 180) < 1;
          
          // Only snap parallel bricks for now
          if (isHorizontal !== isOtherHorizontal) continue;

          if (isHorizontal) {
              // Vertical Stacking (Top/Bottom)
              // Ideally dy should be approx 34px
              const dy = brick.y - other.y;
              const dx = brick.x - other.x;

              // Check vertical alignment
              if (Math.abs(Math.abs(dy) - BRICK_WIDTH) < 10) {
                  // Snap Y to exact stack height
                  const sign = Math.sign(dy) || 1;
                  bestY = other.y + sign * BRICK_WIDTH;
                  
                  // Align X holes (multiples of 40)
                  // dx should be close to N * 40
                  const remainder = dx % HOLE_SPACING;
                  let distToHole = remainder;
                  if (remainder > HOLE_SPACING / 2) distToHole = remainder - HOLE_SPACING;
                  if (remainder < -HOLE_SPACING / 2) distToHole = remainder + HOLE_SPACING;
                  
                  if (Math.abs(distToHole) < 10) {
                      bestX = brick.x - distToHole;
                  }
                  minDist = 0; // Strong snap
              }
          } else {
              // Vertical Bricks stack Horizontally
              const dy = brick.y - other.y;
              const dx = brick.x - other.x;

              if (Math.abs(Math.abs(dx) - BRICK_WIDTH) < 10) {
                   const sign = Math.sign(dx) || 1;
                   bestX = other.x + sign * BRICK_WIDTH;

                   // Align Y holes
                   const remainder = dy % HOLE_SPACING;
                   let distToHole = remainder;
                   if (remainder > HOLE_SPACING / 2) distToHole = remainder - HOLE_SPACING;
                   if (remainder < -HOLE_SPACING / 2) distToHole = remainder + HOLE_SPACING;

                   if (Math.abs(distToHole) < 10) {
                       bestY = brick.y - distToHole;
                   }
                   minDist = 0;
              }
          }
      }
      return { x: bestX, y: bestY };
  };

  const snapGear = (gear: GearState, otherGears: GearState[], availableBricks: BrickState[]): GearState => {
    let bestX = gear.x;
    let bestY = gear.y;
    let minDiff = SNAP_THRESHOLD; 

    // 1. Try Snapping to Bricks (Highest Priority)
    for (const brick of availableBricks) {
        const rad = (brick.rotation * Math.PI) / 180;
        const cos = Math.round(Math.cos(rad)); 
        const sin = Math.round(Math.sin(rad)); 
        
        const isBeam = brick.brickType === 'beam';
        const loopLimit = isBeam ? brick.length : Math.max(1, brick.length - 1);

        for (let i = 0; i < loopLimit; i++) {
            const hx = brick.x + (i * HOLE_SPACING * cos);
            const hy = brick.y + (i * HOLE_SPACING * sin);
            
            const dist = getDistance(gear.x, gear.y, hx, hy);
            if (dist < minDiff) {
                bestX = hx;
                bestY = hy;
                minDiff = dist; 
            }
        }
    }

    if (minDiff > 5) { 
        otherGears.forEach(other => {
            if (other.axleId === gear.axleId) return;
            const r1 = GEAR_DEFS[gear.type].radius;
            const r2 = GEAR_DEFS[other.type].radius;
            const idealDist = r1 + r2;
            const currentDist = getDistance(gear.x, gear.y, other.x, other.y);
            if (Math.abs(currentDist - idealDist) < minDiff) {
                const angle = Math.atan2(gear.y - other.y, gear.x - other.x);
                bestX = other.x + Math.cos(angle) * idealDist;
                bestY = other.y + Math.sin(angle) * idealDist;
                minDiff = Math.abs(currentDist - idealDist);
            }
        });
    }

    let newRotation = gear.rotation;
    
    const meshNeighbor = otherGears.find(other => {
         if (other.axleId === gear.axleId) return false;
         const r1 = GEAR_DEFS[gear.type].radius;
         const r2 = GEAR_DEFS[other.type].radius;
         const idealDist = r1 + r2;
         const dist = getDistance(bestX, bestY, other.x, other.y);
         return Math.abs(dist - idealDist) < 2.0;
    });

    if (meshNeighbor) {
        const angleRad = Math.atan2(bestY - meshNeighbor.y, bestX - meshNeighbor.x);
        const angleDeg = angleRad * (180 / Math.PI);
        
        const N1 = GEAR_DEFS[meshNeighbor.type].teeth;
        const N2 = GEAR_DEFS[gear.type].teeth;
        const theta1 = meshNeighbor.rotation;
        
        const ratio = N1 / N2;
        const targetRot = (angleDeg - theta1) * ratio + angleDeg + 180 + (180/N2);
        
        newRotation = targetRot;
    }

    return { ...gear, x: bestX, y: bestY, rotation: newRotation };
  };

  const rotateBrick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      pushHistory(gears, belts, bricks);
      setBricks(prev => prev.map(b => {
          if (b.id === id) {
              const newRot = (b.rotation + 90) % 360;
              return { ...b, rotation: newRot };
          }
          return b;
      }));
      audioManager.playSnap();
  };

  const recalculateConnections = (allGears: GearState[]): GearState[] => {
    const newGears = allGears.map(g => ({ ...g, connectedTo: [] as string[] }));
    const gearMap = new Map<string, GearState>();
    newGears.forEach(g => gearMap.set(g.id, g));
    const gearsByAxle = new Map<string, GearState[]>();
    newGears.forEach(g => {
        if(!gearsByAxle.has(g.axleId)) gearsByAxle.set(g.axleId, []);
        gearsByAxle.get(g.axleId)!.push(g);
    });
    const axleDepth = new Map<string, number>();
    const queue: string[] = [];
    gearsByAxle.forEach((axleGears, axleId) => {
        if (axleGears.some(g => g.isMotor)) {
            axleDepth.set(axleId, 0);
            queue.push(axleId);
        }
    });
    let head = 0;
    while (head < queue.length) {
        const currentAxleId = queue[head++];
        const currentDepth = axleDepth.get(currentAxleId)!;
        const currentGears = gearsByAxle.get(currentAxleId)!;
        const candidateConnections = new Map<string, { source: GearState, target: GearState }[]>();
        newGears.forEach(potentialNeighbor => {
            if (potentialNeighbor.axleId === currentAxleId) return;
            const neighborAxleId = potentialNeighbor.axleId;
            for (const myGear of currentGears) {
                 const r1 = GEAR_DEFS[myGear.type].radius;
                 const r2 = GEAR_DEFS[potentialNeighbor.type].radius;
                 const idealDist = r1 + r2;
                 const dist = getDistance(myGear.x, myGear.y, potentialNeighbor.x, potentialNeighbor.y);
                 if (Math.abs(dist - idealDist) < 2.0) {
                     if (!candidateConnections.has(neighborAxleId)) candidateConnections.set(neighborAxleId, []);
                     candidateConnections.get(neighborAxleId)!.push({ source: myGear, target: potentialNeighbor });
                 }
            }
        });
        candidateConnections.forEach((candidates, neighborAxleId) => {
             let validConnection = false;
             let targetDepth = axleDepth.get(neighborAxleId);
             if (targetDepth === undefined) {
                 axleDepth.set(neighborAxleId, currentDepth + 1);
                 queue.push(neighborAxleId);
                 validConnection = true;
             } else if (targetDepth === currentDepth + 1) {
                 validConnection = true;
             }
             if (validConnection) {
                 const selectedMesh = candidates[0];
                 const { source, target } = selectedMesh;
                 if (!source.connectedTo.includes(target.id)) {
                     source.connectedTo.push(target.id);
                     target.connectedTo.push(source.id);
                 }
             }
        });
    }
    newGears.forEach(g1 => {
        if (axleDepth.has(g1.axleId)) return;
        const candidates = new Map<string, { source: GearState, target: GearState }>();
        newGears.forEach(g2 => {
            if (g1.axleId === g2.axleId) return;
            if (axleDepth.has(g2.axleId)) return;
            const r1 = GEAR_DEFS[g1.type].radius;
            const r2 = GEAR_DEFS[g2.type].radius;
            const idealDist = r1 + r2;
            const dist = getDistance(g1.x, g1.y, g2.x, g2.y);
             if (Math.abs(dist - idealDist) < 2.0) candidates.set(g2.axleId, { source: g1, target: g2 });
        });
        candidates.forEach(({ source, target }) => {
             if (!source.connectedTo.includes(target.id)) {
                  source.connectedTo.push(target.id);
                  target.connectedTo.push(source.id);
             }
        });
    });
    return newGears;
  };

  const updatePhysics = (newGears: GearState[], currentBelts: Belt[]) => {
    const connected = recalculateConnections(newGears);
    const calculated = propagatePhysics(connected, currentBelts);
    setGears(calculated);
  };

  const updateGear = (id: string, updates: Partial<GearState>) => {
    pushHistory(gears, belts, bricks);
    const updatedGears = gears.map(g => g.id === id ? { ...g, ...updates } : g);
    updatePhysics(updatedGears, belts);
  };
  
  const addGearOnSameAxle = (sourceId: string, type: GearType) => {
      pushHistory(gears, belts, bricks);
      const sourceGear = gears.find(g => g.id === sourceId);
      if (!sourceGear) return;
      addNewGear(type, sourceGear.x, sourceGear.y, sourceGear.axleId);
  };

  const deleteGear = (id: string) => {
    pushHistory(gears, belts, bricks);
    const remainingGears = gears.filter(g => g.id !== id);
    const remainingBelts = belts.filter(b => b.sourceId !== id && b.targetId !== id);
    setBelts(remainingBelts);
    setSelectedId(null);
    updatePhysics(remainingGears, remainingBelts);
  };

  const deleteBrick = (id: string) => {
      pushHistory(gears, belts, bricks);
      setBricks(prev => prev.filter(b => b.id !== id));
      setSelectedBrickId(null);
  };

  const resetPlayground = () => {
    pushHistory(gears, belts, bricks);
    setGears([]);
    setBelts([]);
    setBricks([]);
    setSelectedId(null);
    setSelectedBrickId(null);
    setGlobalRpm(60);
    setActiveChallengeId(null);
    setHighlightedGearIds([]);
    setChallengeSuccess(false);
    setView({ x: 0, y: 0, scale: 1 });
  };

  const generateRandomLayout = () => {
    pushHistory(gears, belts, bricks);
    
    const generatedGears: GearState[] = [];
    const generatedBricks: BrickState[] = [];
    const generatedBelts: Belt[] = [];
    
    const cx = 500;
    const cy = 350;

    const addGear = (type: GearType, x: number, y: number, axleId?: string, isMotor = false, rotation = 0): GearState => {
        const g: GearState = {
            id: uuidv4(),
            axleId: axleId || uuidv4(),
            type, x, y, rotation: rotation % 360, connectedTo: [],
            isMotor, motorSpeed: 1, motorRpm: 60, motorTorque: 200, motorDirection: 1,
            load: 0, ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };
        generatedGears.push(g);
        return g;
    };

    const calculateMeshRotation = (g1: GearState, x2: number, y2: number, type2: GearType): number => {
         const angleRad = Math.atan2(y2 - g1.y, x2 - g1.x);
         const angleDeg = angleRad * (180 / Math.PI);
         
         const N1 = GEAR_DEFS[g1.type].teeth;
         const N2 = GEAR_DEFS[type2].teeth;
         const theta1 = g1.rotation;
         
         const ratio = N1 / N2;
         return (angleDeg - theta1) * ratio + angleDeg + 180 + (180/N2);
    };

    const beam1Len = BEAM_SIZES[Math.floor(Math.random() * BEAM_SIZES.length)];
    const beam1: BrickState = {
        id: uuidv4(), length: beam1Len, brickType: 'beam', x: cx - (beam1Len/2 * HOLE_SPACING), y: cy, rotation: 0
    };
    generatedBricks.push(beam1);

    const motorIdx = 1;
    const motorType = [GearType.Small, GearType.Medium, GearType.Large][Math.floor(Math.random()*3)];
    const motorX = beam1.x + motorIdx * HOLE_SPACING;
    const motorY = beam1.y;
    let lastGear = addGear(motorType, motorX, motorY, undefined, true, 0);

    let currentIdx = motorIdx;
    let attempts = 0;
    while(currentIdx < beam1Len - 2 && attempts < 10) {
        attempts++;
        const t1 = GEAR_DEFS[lastGear.type].teeth;
        const validTypes = Object.values(GearType).filter(t => {
            const t2 = GEAR_DEFS[t].teeth;
            return (t1 + t2) % 16 === 0;
        });
        
        if (validTypes.length === 0) break;
        
        const nextType = validTypes[Math.floor(Math.random() * validTypes.length)];
        const t2 = GEAR_DEFS[nextType].teeth;
        const holesNeeded = (t1 + t2) / 16;
        
        if (currentIdx + holesNeeded < beam1Len) {
            currentIdx += holesNeeded;
            const gx = beam1.x + currentIdx * HOLE_SPACING;
            const gy = beam1.y;
            
            if (Math.random() > 0.7) {
                const stackType = validTypes[Math.floor(Math.random() * validTypes.length)]; 
                lastGear = addGear(stackType, lastGear.x, lastGear.y, lastGear.axleId, false, lastGear.rotation);
            }
            
            const rot = calculateMeshRotation(lastGear, gx, gy, nextType);
            lastGear = addGear(nextType, gx, gy, undefined, false, rot);
        } else {
            break;
        }
    }

    if (Math.random() > 0.4) {
        const vBeamLen = [3, 5, 7, 9][Math.floor(Math.random()*4)]; 
        const vBeam: BrickState = {
            id: uuidv4(), length: vBeamLen, brickType: 'beam', x: lastGear.x, y: lastGear.y, rotation: 90
        };
        generatedBricks.push(vBeam);
        
        let vIdx = 0;
        let vAttempts = 0;
        while (vIdx < vBeamLen - 2 && vAttempts < 5) {
            vAttempts++;
             const t1 = GEAR_DEFS[lastGear.type].teeth;
             const validTypes = Object.values(GearType).filter(t => (t1 + GEAR_DEFS[t].teeth) % 16 === 0);
             if(validTypes.length === 0) break;

             const nextType = validTypes[Math.floor(Math.random() * validTypes.length)];
             const holesNeeded = (t1 + GEAR_DEFS[nextType].teeth) / 16;
             
             if (vIdx + holesNeeded < vBeamLen) {
                 vIdx += holesNeeded;
                 const gx = vBeam.x;
                 const gy = vBeam.y + vIdx * HOLE_SPACING;
                 
                 const rot = calculateMeshRotation(lastGear, gx, gy, nextType);
                 lastGear = addGear(nextType, gx, gy, undefined, false, rot);
             } else {
                 break;
             }
        }
    }

    if (Math.random() > 0.5) {
        const bx = cx + (Math.random() > 0.5 ? 200 : -200);
        const by = cy + 100;
        const bBrick: BrickState = { id: uuidv4(), length: 5, brickType: 'beam', x: bx-20, y: by, rotation: 0 };
        generatedBricks.push(bBrick);
        
        const bGear = addGear(GearType.Large, bx + 20, by, undefined, false, 0);
        
        generatedBelts.push({
            id: uuidv4(),
            sourceId: lastGear.id,
            targetId: bGear.id
        });
    }

    setGears(generatedGears);
    setBricks(generatedBricks);
    setBelts(generatedBelts);
    updatePhysics(generatedGears, generatedBelts);
    
    setGlobalRpm(60);
    setView({ x: 0, y: 0, scale: 0.8 });
  };

  const handleGlobalRpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rpm = parseInt(e.target.value);
    setGlobalRpm(rpm);
    const updatedGears = gears.map(g => g.isMotor ? { ...g, motorRpm: rpm } : g);
    updatePhysics(updatedGears, belts);
  };

  const handleNextLevel = () => {
    if (!activeChallengeId) return;
    const currentIndex = CHALLENGES.findIndex(c => c.id === activeChallengeId);
    const nextChallenge = CHALLENGES[currentIndex + 1];
    setGears([]); setBelts([]); setBricks([]); setSelectedId(null); setHighlightedGearIds([]); setChallengeSuccess(false);
    setActiveChallengeId(nextChallenge ? nextChallenge.id : null);
  };

  const getGearRole = (gear: GearState): 'drive' | 'driven' | 'idler' | null => {
    if (!showRoles) return null;

    const myAxleGears = gears.filter(g => g.axleId === gear.axleId);
    if (myAxleGears.some(g => g.isMotor)) return 'drive';
    if (gear.rpm === 0 || gear.isJammed) return null;
    
    let externalConnections = 0;
    myAxleGears.forEach(g => {
        g.connectedTo.forEach(connId => {
            const neighbor = gears.find(n => n.id === connId);
            if (neighbor && neighbor.rpm !== 0 && !neighbor.isJammed && neighbor.axleId !== gear.axleId) externalConnections++;
        });
    });
    
    if (externalConnections >= 2) return 'idler';
    if (externalConnections > 0) return 'driven';
    return null;
  };

  // Render Order: Sort by Y descending (bottom first? No, High Y = bottom).
  // We want "Higher on Screen (Lower Y)" to be drawn AFTER "Lower on Screen (Higher Y)"
  // to achieve the "Obscuring Studs" effect.
  // If Brick A is at Y=0 (Top) and Brick B is at Y=34 (Bottom).
  // Brick B is physically below A. 
  // Studs of B stick up into A.
  // If we draw B first, then A -> A covers B's studs. Correct.
  // So draw order: Bottom Bricks (High Y) -> Top Bricks (Low Y).
  // Sort Descending Y.
  const sortedBricksForRender = useMemo(() => {
      return [...bricks].sort((a, b) => b.y - a.y);
  }, [bricks]);

  const sortedGearsForRender = useMemo(() => {
      return [...gears].sort((a, b) => {
          const rA = GEAR_DEFS[a.type].radius;
          const rB = GEAR_DEFS[b.type].radius;
          return rB - rA; 
      });
  }, [gears]);

  const selectedGear = gears.find(g => g.id === selectedId);
  const currentChallenge = CHALLENGES.find(c => c.id === activeChallengeId);
  const isLastChallenge = currentChallenge?.id === CHALLENGES[CHALLENGES.length - 1].id;

  const tutorialSteps: TutorialStep[] = [
      { title: t.tutorial.welcome, description: t.tutorial.welcomeDesc, position: 'center' },
      { targetId: 'sidebar-container', title: t.tutorial.sidebar, description: t.tutorial.sidebarDesc, position: 'right' },
      { targetId: 'workspace-area', title: t.tutorial.workspace, description: t.tutorial.workspaceDesc, position: 'center' },
      { targetId: 'toolbar-controls', title: t.tutorial.toolbar, description: t.tutorial.toolbarDesc, position: 'bottom' },
      { targetId: 'btn-example', title: t.tutorial.example, description: t.tutorial.exampleDesc, position: 'right' },
      { targetId: 'sidebar-tabs', title: t.tutorial.missions, description: t.tutorial.missionsDesc, position: 'right' },
      { title: t.tutorial.done, description: t.tutorial.doneDesc, position: 'center' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden select-none transition-colors duration-300" style={{ backgroundColor: 'var(--bg-app)' }}>
      
      <TutorialOverlay 
          steps={tutorialSteps} 
          isOpen={isTutorialOpen} 
          onClose={() => setIsTutorialOpen(false)} 
          lang={lang}
      />

      {/* LANGUAGE & SOUND SWITCHER - BOTTOM RIGHT */}
      <div className="absolute bottom-6 right-6 z-50 flex gap-3">
        <button 
            onClick={() => setIsTutorialOpen(true)}
            className="flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-colors text-xl shadow-lg hover:scale-105 active:scale-95 font-bold"
            style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', color: 'var(--text-accent)' }}
            title={t.help}
        >?</button>
        <button 
            onClick={toggleTheme}
            className="flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-colors text-xl shadow-lg hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)', color: 'var(--text-accent)' }}
            title={getThemeTitle()}
        >{getThemeIcon()}</button>
        <button 
            onClick={() => setIsMuted(!isMuted)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-2xl border-2 transition-colors shadow-lg hover:scale-105 active:scale-95`}
            style={{
                backgroundColor: isMuted ? 'rgba(127, 29, 29, 0.5)' : 'var(--bg-panel)',
                color: isMuted ? '#fca5a5' : 'var(--text-accent)',
                borderColor: isMuted ? '#991b1b' : 'var(--border-color)'
            }}
        ><span className="text-lg">{isMuted ? '🔇' : '🔊'}</span><span className="hidden sm:inline">{isMuted ? t.mute : t.sound}</span></button>
        <div className="flex rounded-2xl border-2 p-1 shadow-lg" style={{ backgroundColor: 'var(--bg-panel)', borderColor: 'var(--border-color)' }}>
            <button onClick={() => setLang('en')} className={`px-3 py-2 text-sm font-bold rounded-xl transition-colors`} style={{ backgroundColor: lang === 'en' ? 'var(--text-accent)' : 'transparent', color: lang === 'en' ? '#fff' : 'var(--text-secondary)' }}>EN</button>
            <button onClick={() => setLang('zh-TW')} className={`px-3 py-2 text-sm font-bold rounded-xl transition-colors`} style={{ backgroundColor: lang === 'zh-TW' ? 'var(--text-accent)' : 'transparent', color: lang === 'zh-TW' ? '#fff' : 'var(--text-secondary)' }}>中文</button>
        </div>
      </div>

      <Sidebar 
        onDragStart={handleSidebarDragStart} 
        onAddGear={handleAddGearFromSidebar}
        onAddBrick={handleAddBrickFromSidebar}
        activeChallengeId={activeChallengeId}
        onSelectChallenge={(id) => { setActiveChallengeId(id); setChallengeSuccess(false); }}
        completedChallenges={completedChallenges}
        lang={lang}
        theme={theme}
      />
      
      <div className="flex-1 flex flex-col relative">
        {/* Improved Toolbar */}
        <div id="toolbar-controls" className="absolute top-6 left-6 z-10 flex flex-col gap-4 pointer-events-none">
          
          <div className="pointer-events-auto flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex gap-3 backdrop-blur-md p-3 rounded-2xl shadow-xl border-2" style={{ backgroundColor: 'var(--bg-panel-translucent)', borderColor: 'var(--border-color)' }}>
                <button onClick={resetPlayground} className="px-5 py-3 border-2 rounded-xl hover:opacity-80 text-sm font-bold transition-colors shadow-sm uppercase tracking-wide" style={{ backgroundColor: 'var(--button-bg)', borderColor: 'var(--border-color)', color: 'var(--text-accent)' }}>{t.reset}</button>
                <button id="btn-example" onClick={generateRandomLayout} className="px-5 py-3 border-2 rounded-xl hover:opacity-80 text-sm font-bold transition-colors shadow-sm uppercase tracking-wide" style={{ backgroundColor: 'var(--button-bg)', borderColor: 'var(--border-color)', color: 'var(--text-accent)' }}>🎲 {t.example}</button>
            </div>

            <div className="flex gap-2 backdrop-blur-md p-3 rounded-2xl shadow-xl border-2" style={{ backgroundColor: 'var(--bg-panel-translucent)', borderColor: 'var(--border-color)' }}>
                <button onClick={() => setView(v => ({ ...v, scale: Math.min(4, v.scale + 0.2) }))} className="w-12 h-12 flex items-center justify-center rounded-xl border-2 hover:bg-white/10 text-2xl font-bold" style={{ backgroundColor: 'var(--button-bg)', borderColor: 'var(--border-color)', color: 'var(--text-accent)' }}>+</button>
                <button onClick={() => setView(v => ({ ...v, scale: Math.max(0.2, v.scale - 0.2) }))} className="w-12 h-12 flex items-center justify-center rounded-xl border-2 hover:bg-white/10 text-2xl font-bold" style={{ backgroundColor: 'var(--button-bg)', borderColor: 'var(--border-color)', color: 'var(--text-accent)' }}>-</button>
                <button onClick={() => setView({ x: 0, y: 0, scale: 1 })} className="px-4 h-12 flex items-center justify-center rounded-xl border-2 hover:bg-white/10 text-sm font-bold uppercase" style={{ backgroundColor: 'var(--button-bg)', borderColor: 'var(--border-color)', color: 'var(--text-accent)' }}>{t.fit}</button>
            </div>
          </div>

          <div className="pointer-events-auto backdrop-blur-md p-4 rounded-2xl shadow-xl border-2 max-w-[300px] sm:max-w-none" style={{ backgroundColor: 'var(--bg-panel-translucent)', borderColor: 'var(--border-color)' }}>
             <div className="flex flex-wrap items-center gap-6 mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-[150px]">
                    <label htmlFor="global-rpm" className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t.rpm}</label>
                    <input id="global-rpm" type="range" min="1" max="300" step="1" value={globalRpm} onChange={handleGlobalRpmChange} className="kid-slider accent-cyan-500" />
                    <span className="text-sm font-mono font-bold w-12 text-right" style={{ color: 'var(--text-accent)' }}>{globalRpm}</span>
                </div>
             </div>
             <div className="w-full h-px my-2 bg-gray-700/50"></div>
             <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-3 cursor-pointer group bg-black/10 px-3 py-2 rounded-lg hover:bg-black/20 transition-colors">
                    <input type="checkbox" checked={showSpecs} onChange={(e) => setShowSpecs(e.target.checked)} className="peer sr-only" />
                    <div className="w-8 h-5 rounded-full border-2 transition-colors relative" style={{ backgroundColor: showSpecs ? 'var(--text-accent)' : 'var(--border-color)', borderColor: showSpecs ? 'var(--text-accent)' : 'var(--text-secondary)' }}>
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showSpecs ? 'translate-x-3' : ''}`}></div>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider transition-colors" style={{ color: showSpecs ? 'var(--text-primary)' : 'var(--text-muted)' }}>{t.specs}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group bg-black/10 px-3 py-2 rounded-lg hover:bg-black/20 transition-colors">
                    <input type="checkbox" checked={showRatio} onChange={(e) => setShowRatio(e.target.checked)} className="peer sr-only" />
                     <div className="w-8 h-5 rounded-full border-2 transition-colors relative" style={{ backgroundColor: showRatio ? 'var(--text-accent)' : 'var(--border-color)', borderColor: showRatio ? 'var(--text-accent)' : 'var(--text-secondary)' }}>
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showRatio ? 'translate-x-3' : ''}`}></div>
                     </div>
                    <span className="text-xs font-bold uppercase tracking-wider transition-colors" style={{ color: showRatio ? 'var(--text-primary)' : 'var(--text-muted)' }}>{t.ratio}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group bg-black/10 px-3 py-2 rounded-lg hover:bg-black/20 transition-colors">
                    <input type="checkbox" checked={showTorque} onChange={(e) => setShowTorque(e.target.checked)} className="peer sr-only" />
                    <div className="w-8 h-5 rounded-full border-2 transition-colors relative" style={{ backgroundColor: showTorque ? '#a855f7' : 'var(--border-color)', borderColor: showTorque ? '#a855f7' : 'var(--text-secondary)' }}>
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showTorque ? 'translate-x-3' : ''}`}></div>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider transition-colors" style={{ color: showTorque ? '#d8b4fe' : 'var(--text-muted)' }}>{t.torque}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group bg-black/10 px-3 py-2 rounded-lg hover:bg-black/20 transition-colors">
                    <input type="checkbox" checked={showRoles} onChange={(e) => setShowRoles(e.target.checked)} className="peer sr-only" />
                    <div className="w-8 h-5 rounded-full border-2 transition-colors relative" style={{ backgroundColor: showRoles ? '#4ade80' : 'var(--border-color)', borderColor: showRoles ? '#4ade80' : 'var(--text-secondary)' }}>
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showRoles ? 'translate-x-3' : ''}`}></div>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider transition-colors" style={{ color: showRoles ? '#4ade80' : 'var(--text-muted)' }}>{t.roles}</span>
                </label>
             </div>
          </div>
          
          {beltSourceId && (
            <div className="pointer-events-auto w-full max-w-sm bg-purple-600/90 border-2 border-purple-400 text-white text-base font-bold px-6 py-4 rounded-2xl shadow-2xl animate-pulse text-center">
                {t.beltMode}
                <div className="text-xs opacity-80 mt-1 font-normal">(Tap target gear or ESC)</div>
            </div>
          )}

        </div>

        {/* Workspace */}
        <div 
          id="workspace-area"
          ref={workspaceRef}
          className={`flex-1 relative overflow-hidden`}
          style={{ 
            backgroundColor: 'var(--bg-app)', 
            cursor: beltSourceId ? 'crosshair' : (isPanning ? 'grabbing' : 'default'),
            touchAction: 'none' 
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onMouseDown={handlePanMouseDown}
          onWheel={handleWheel}
          onTouchStart={handleWorkspaceTouchStart}
          onTouchMove={handleWorkspaceTouchMove}
          onTouchEnd={handleWorkspaceTouchEnd}
          onTouchCancel={handleWorkspaceTouchEnd}
        >
           <svg className="w-full h-full block">
             <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--grid-color)" strokeWidth="1"/>
                </pattern>
                <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                   <path d="M 0 0 L 6 3 L 0 6" fill="none" stroke="var(--gear-stroke)" strokeWidth="1" />
                </marker>
             </defs>
             <g transform={`translate(${view.x}, ${view.y}) scale(${view.scale})`}>
                <rect id="grid-bg" x="-50000" y="-50000" width="100000" height="100000" fill="url(#grid)" className="pointer-events-none" />
                {gears.length === 0 && bricks.length === 0 && (<text x="50%" y="50%" textAnchor="middle" fill="var(--text-muted)" fontSize="24" fontWeight="bold" fontFamily="monospace" letterSpacing="0.2em" className="pointer-events-none">{t.initialize}</text>)}
                
                {/* RENDER BRICKS (Sorted by Y descending for stacking visibility) */}
                {sortedBricksForRender.map(brick => (
                    <BrickComponent
                        key={brick.id}
                        brick={brick}
                        isSelected={selectedBrickId === brick.id}
                        theme={theme}
                        onMouseDown={handleBrickMouseDown}
                        onTouchStart={handleBrickTouchStart}
                        onDoubleClick={rotateBrick}
                        onDelete={deleteBrick}
                    />
                ))}

                {/* Render BELTS */}
                {belts.map(belt => {
                    const g1 = gears.find(g => g.id === belt.sourceId);
                    const g2 = gears.find(g => g.id === belt.targetId);
                    if (g1 && g2) {
                        const path = generateBeltPath(
                            g1.x, g1.y, GEAR_DEFS[g1.type].radius,
                            g2.x, g2.y, GEAR_DEFS[g2.type].radius
                        );
                        const animSpeed = Math.abs(g1.rpm) > 0 ? (200 / Math.abs(g1.rpm)) : 0;
                        
                        return (
                          <g key={belt.id}>
                              <path d={path} fill="none" stroke="#334155" strokeWidth="6" opacity="0.9" />
                              <path 
                                d={path} 
                                fill="none" 
                                stroke="#FACC15" 
                                strokeWidth="3" 
                                strokeDasharray="10,10"
                                style={{ 
                                    animation: animSpeed > 0 ? `dash ${animSpeed}s linear infinite` : 'none',
                                    animationDirection: g1.direction === 1 ? 'normal' : 'reverse'
                                }}
                              />
                              <style>{`
                                @keyframes dash {
                                  to { stroke-dashoffset: -20; }
                                }
                              `}</style>
                          </g>
                        );
                    }
                    return null;
                })}

                {gears.map((gear) => gear.connectedTo.map((otherId) => { if (gear.id < otherId) { const other = gears.find((g) => g.id === otherId); if (other) { return (<line key={`link-${gear.id}-${other.id}`} x1={gear.x} y1={gear.y} x2={other.x} y2={other.y} stroke="var(--gear-stroke)" strokeWidth="1.5" strokeDasharray="5,5" strokeOpacity="0.4" strokeLinecap="round" className="pointer-events-none" />); } } return null; }))}
                
                {/* Gears */}
                {sortedGearsForRender.map(gear => (
                <GearComponent 
                    key={gear.id} 
                    gear={gear} 
                    isSelected={selectedId === gear.id}
                    isObjectiveTarget={highlightedGearIds.includes(gear.id)}
                    roleHighlight={selectedId ? null : getGearRole(gear)}
                    axleMates={gears.filter(g => g.axleId === gear.axleId && g.id !== gear.id)}
                    showSpecs={showSpecs}
                    showRatio={showRatio}
                    showRpm={showRpm}
                    showTorque={showTorque} 
                    lang={lang}
                    theme={theme}
                    onMouseDown={handleGearMouseDown}
                    onTouchStart={handleGearTouchStart}
                    onClick={(e, id) => { e.stopPropagation(); setSelectedId(id); }}
                />
                ))}
             </g>
           </svg>
        </div>
        
        {currentChallenge && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-4xl px-4 pointer-events-none">
             <div 
                className={`backdrop-blur-md border-t-4 rounded-3xl shadow-2xl p-8 pointer-events-auto relative overflow-hidden transition-all duration-500`}
                style={{
                    backgroundColor: challengeSuccess ? 'rgba(20, 83, 45, 0.95)' : 'var(--bg-panel-translucent)',
                    borderColor: challengeSuccess ? '#22c55e' : 'var(--text-accent)'
                }}
             >
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-sm font-bold px-3 py-1 rounded-lg border-2 uppercase tracking-wider ${challengeSuccess ? 'bg-green-800 text-green-200 border-green-400' : ''}`} style={!challengeSuccess ? { backgroundColor: 'var(--bg-app)', color: 'var(--text-accent)', borderColor: 'var(--border-color)' } : {}}>{challengeSuccess ? t.complete : `${t.mission} #${currentChallenge.id}`}</span>
                        {challengeSuccess && (<span className="text-white text-base font-bold flex items-center gap-2 animate-pulse"><span>★</span> {t.missionAccomplished}</span>)}
                      </div>
                      <h3 className="text-3xl font-bold tracking-tight mb-2" style={{ color: challengeSuccess ? '#fff' : 'var(--text-primary)' }}>{lang === 'zh-TW' ? currentChallenge.titleZh : currentChallenge.title}</h3>
                      <p className={`text-lg max-w-xl leading-relaxed font-medium`} style={{ color: challengeSuccess ? '#dcfce7' : 'var(--text-secondary)' }}>{lang === 'zh-TW' ? currentChallenge.descriptionZh : currentChallenge.description}</p>
                   </div>
                   {challengeSuccess ? (
                       <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                           <button onClick={handleNextLevel} className="px-8 py-4 bg-white text-green-900 text-lg font-bold rounded-2xl shadow-lg hover:bg-green-50 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2 border-2 border-transparent">{isLastChallenge ? t.finishAll : t.nextMission}</button>
                           <button onClick={() => setActiveChallengeId(null)} className="px-6 py-4 bg-green-800/50 text-green-100 font-semibold rounded-2xl hover:bg-green-800 transition-colors border-2 border-green-700">{t.stayHere}</button>
                       </div>
                   ) : (<div className="hidden md:block text-6xl grayscale opacity-20 animate-pulse">🎯</div>)}
                </div>
             </div>
          </div>
        )}
        
        {selectedGear && (
          <GearProperties 
            gear={selectedGear} 
            allGears={gears}
            onUpdate={updateGear} 
            onAddSibling={addGearOnSameAxle}
            onConnectBelt={handleGearConnectBeltStart} 
            onDelete={deleteGear}
            onClose={() => setSelectedId(null)}
            lang={lang}
          />
        )}
      </div>
    </div>
  );
};

export default App;
