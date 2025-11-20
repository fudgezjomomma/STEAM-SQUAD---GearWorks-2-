
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from './components/Sidebar';
import { GearComponent } from './components/GearComponent';
import { BrickComponent } from './components/BrickComponent';
import { GearProperties } from './components/GearProperties';
import { TutorialOverlay, TutorialStep } from './components/TutorialOverlay';
import { GearState, GearType, Belt, BrickState, Lesson } from './types';
import { GEAR_DEFS, SNAP_THRESHOLD, BASE_SPEED_MULTIPLIER, HOLE_SPACING, BEAM_SIZES, BRICK_WIDTH } from './constants';
import { getDistance, propagatePhysics, generateBeltPath } from './utils/gearMath';
import { CHALLENGES } from './data/challenges';
import { TRANSLATIONS, Language } from './utils/translations';
import { audioManager } from './utils/audio';
import { loadProgress, loadSettings, saveProgress, saveSettings } from './utils/storage';

// Helper: Line Segment Intersection
const lineIntersectsLine = (p0_x: number, p0_y: number, p1_x: number, p1_y: number, p2_x: number, p2_y: number, p3_x: number, p3_y: number) => {
    let s1_x, s1_y, s2_x, s2_y;
    s1_x = p1_x - p0_x;
    s1_y = p1_y - p0_y;
    s2_x = p3_x - p2_x;
    s2_y = p3_y - p2_y;
    let s, t;
    s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
    t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) return true;
    return false;
}

const App: React.FC = () => {
  // Load initial settings from storage
  const initialSettings = useMemo(() => loadSettings(), []);
  const initialProgress = useMemo(() => loadProgress(), []);

  const [gears, setGears] = useState<GearState[]>([]);
  const [belts, setBelts] = useState<Belt[]>([]);
  const [bricks, setBricks] = useState<BrickState[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedBrickId, setSelectedBrickId] = useState<string | null>(null);
  
  // Properties Drawer State
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);

  // Belt Creation Mode
  const [beltSourceId, setBeltSourceId] = useState<string | null>(null);

  const [draggingAxleId, setDraggingAxleId] = useState<string | null>(null);
  const [draggingBrickId, setDraggingBrickId] = useState<string | null>(null);
  
  const [globalRpm, setGlobalRpm] = useState(60); 
  
  // Role Highlights State
  const [showRoles, setShowRoles] = useState(initialSettings.showRoles);
  
  // Label Toggles State
  const [showSpecs, setShowSpecs] = useState(initialSettings.showSpecs); 
  const [showRatio, setShowRatio] = useState(initialSettings.showRatio); 
  const [showRpm, setShowRpm] = useState(initialSettings.showRpm);    
  const [showTorque, setShowTorque] = useState(initialSettings.showTorque);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light' | 'steam'>(initialSettings.theme);

  // Audio State
  const [isMuted, setIsMuted] = useState(initialSettings.isMuted);

  // Language State
  const [lang, setLang] = useState<Language>(initialSettings.lang);
  const t = TRANSLATIONS[lang];

  // Tutorial State
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [currentTutorialSteps, setCurrentTutorialSteps] = useState<TutorialStep[]>([]);

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Mobile Toolbar State
  const [isMobileToolbarOpen, setIsMobileToolbarOpen] = useState(false);

  // View Transform State (Zoom/Pan)
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Touch Refs
  const lastPinchRef = useRef<{ dist: number, center: {x: number, y: number} } | null>(null);

  // Challenge State
  const [activeChallengeId, setActiveChallengeId] = useState<number | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<number[]>(initialProgress);
  const [highlightedGearIds, setHighlightedGearIds] = useState<string[]>([]);
  const [challengeSuccess, setChallengeSuccess] = useState(false);

  // Undo/Redo History State
  const [history, setHistory] = useState<{ gears: GearState[], belts: Belt[], bricks: BrickState[] }[]>([]);
  const [future, setFuture] = useState<{ gears: GearState[], belts: Belt[], bricks: BrickState[] }[]>([]);
  const undoRef = useRef<{ gears: GearState[], belts: Belt[], bricks: BrickState[] }>({ gears: [], belts: [], bricks: [] }); 
  const hasMovedRef = useRef(false);
  const interactionTargetIdRef = useRef<string | null>(null);
  const interactionTargetTypeRef = useRef<'gear' | 'brick' | null>(null);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Default App Tour Steps
  const defaultTutorialSteps: TutorialStep[] = [
      { title: t.tutorial.welcome, description: t.tutorial.welcomeDesc, position: 'center' },
      { targetId: 'sidebar-container', title: t.tutorial.sidebar, description: t.tutorial.sidebarDesc, position: 'right' },
      { targetId: 'workspace-area', title: t.tutorial.workspace, description: t.tutorial.workspaceDesc, position: 'center' },
      { targetId: 'toolbar-controls', title: t.tutorial.toolbar, description: t.tutorial.toolbarDesc, position: 'bottom' },
      { targetId: 'btn-example', title: t.tutorial.example, description: t.tutorial.exampleDesc, position: 'right' },
      { targetId: 'tab-missions', title: t.tutorial.missions, description: t.tutorial.missionsDesc, position: 'right' },
      { targetId: 'tab-lessons', title: t.tutorial.lessons, description: t.tutorial.lessonsDesc, position: 'right' },
      { title: t.tutorial.done, description: t.tutorial.doneDesc, position: 'center' },
  ];

  // --- Persistence Effects ---
  useEffect(() => {
    saveProgress(completedChallenges);
  }, [completedChallenges]);

  useEffect(() => {
    saveSettings({
      theme,
      lang,
      isMuted,
      showSpecs,
      showRatio,
      showRpm,
      showTorque,
      showRoles
    });
  }, [theme, lang, isMuted, showSpecs, showRatio, showRpm, showTorque, showRoles]);

  // --- Handle Resize ---
  useEffect(() => {
    const handleResize = () => {
       // Resize logic removed to allow manual control of sidebar state
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

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

  const findFreeSpot = useCallback((
    preferredX: number, 
    preferredY: number, 
    radius: number
  ): { x: number, y: number } => {
    let x = preferredX;
    let y = preferredY;
    let angle = 0;
    let dist = 0;
    const angleStep = 0.5; 
    let iterations = 0;
    const maxIterations = 100; 

    while (iterations < maxIterations) {
        let collision = false;
        for (const g of gears) {
            const gDef = GEAR_DEFS[g.type];
            const d = Math.hypot(x - g.x, y - g.y);
            if (d < (radius + gDef.radius + 15)) {
                collision = true;
                break;
            }
        }

        if (!collision) {
             for (const b of bricks) {
                // Check against all bricks for generic overlap
                const rad = (b.rotation * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                const isBeam = b.brickType === 'beam';
                const loopLimit = isBeam ? b.length : Math.max(1, b.length - 1);

                for(let i=0; i<loopLimit; i++) {
                    const hx = b.x + i * 40 * cos;
                    const hy = b.y + i * 40 * sin;
                    const d = Math.hypot(x - hx, y - hy);
                    if (d < (radius + 20 + 15)) { 
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
        angle += angleStep;
        dist = 50 + (angle * 10);
        x = preferredX + Math.cos(angle) * dist;
        y = preferredY + Math.sin(angle) * dist;
        iterations++;
    }
    return { 
        x: preferredX + (Math.random() - 0.5) * 50, 
        y: preferredY + (Math.random() - 0.5) * 50 
    };
  }, [gears, bricks]);

  // Check collision with obstacles
  const checkCollision = (gear: Partial<GearState> & {type: GearType, x: number, y: number}, x: number, y: number, bricks: BrickState[]): boolean => {
    const gearRadius = GEAR_DEFS[gear.type].radius;
    // Add a buffer to gear radius to prevent clipping
    const collisionRadius = gearRadius + 15; 

    for (const b of bricks) {
        if (!b.isObstacle) continue;

        const rad = (b.rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const len = b.brickType === 'beam' ? b.length : Math.max(1, b.length);
        
        for(let i=0; i < len; i++) {
            const hx = b.x + i * 40 * cos;
            const hy = b.y + i * 40 * sin;
            const dist = Math.hypot(x - hx, y - hy);
            
            // Standard brick hole radius ~17-20px
            if (dist < (collisionRadius + 17)) {
                return true;
            }
        }
    }
    return false;
  };

  // Check if a belt segment obstructs an obstacle
  const checkBeltObstruction = (g1: GearState, g2: GearState, bricks: BrickState[]): boolean => {
      for (const b of bricks) {
          if (!b.isObstacle) continue;
          
          // Transform belt line segment into brick's local coordinate space
          // Translate world to brick origin, then rotate by -brick.rotation
          const angle = -b.rotation * (Math.PI / 180);
          const dx = b.x;
          const dy = b.y;
          
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          // Local point = (p - origin) rotated
          const lx1 = (g1.x - dx) * cos - (g1.y - dy) * sin;
          const ly1 = (g1.x - dx) * sin + (g1.y - dy) * cos;
          const lx2 = (g2.x - dx) * cos - (g2.y - dy) * sin;
          const ly2 = (g2.x - dx) * sin + (g2.y - dy) * cos;

          // Brick Local AABB
          const brickHeightHalf = 17; // 34/2
          const minY = -brickHeightHalf;
          const maxY = brickHeightHalf;
          
          let minX, maxX;
          // Local origin for beam/brick is at first hole (or offset slightly)
          // Beam: Visuals are from -17 to (L-1)*40 + 17
          // Brick: Visuals are from -40 to (L-1)*40
          if (b.brickType === 'beam') {
             minX = -17;
             maxX = (b.length - 1) * 40 + 17;
          } else {
             // Rectangle starts at -40 relative to first hole center
             minX = -40;
             // Rectangle width is L*40. So end is -40 + L*40
             maxX = (b.length * 40) - 40;
          }
          
          // Expand bounds slightly to be safe against clipping
          const safePadding = 5; 
          
          if (lineIntersectsLine(lx1, ly1, lx2, ly2, minX-safePadding, minY-safePadding, maxX+safePadding, minY-safePadding)) return true; // Top
          if (lineIntersectsLine(lx1, ly1, lx2, ly2, minX-safePadding, maxY+safePadding, maxX+safePadding, maxY+safePadding)) return true; // Bottom
          if (lineIntersectsLine(lx1, ly1, lx2, ly2, minX-safePadding, minY-safePadding, minX-safePadding, maxY+safePadding)) return true; // Left
          if (lineIntersectsLine(lx1, ly1, lx2, ly2, maxX+safePadding, minY-safePadding, maxX+safePadding, maxY+safePadding)) return true; // Right
          
          // Also check if belt points are inside (unlikely for line, but possible if gear is inside)
          // We assume gear collision handles 'inside', we just check 'crossing'.
      }
      return false;
  };

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

    // Don't select immediately
    interactionTargetIdRef.current = id;
    interactionTargetTypeRef.current = 'gear';

    const gear = gears.find(g => g.id === id);
    if (gear) {
        if (gear.fixed) return; // Fixed gears cannot be dragged
        
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

    // Don't select immediately
    interactionTargetIdRef.current = id;
    interactionTargetTypeRef.current = 'brick';

    const brick = bricks.find(b => b.id === id);
    if (brick) {
        if (brick.fixed) return; // Fixed bricks cannot be dragged
        
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
            let startX = worldPos.x;
            let startY = worldPos.y;
            // Check for obstacle collision on drop
            const dummyGear = { type: data.type as GearType, x: startX, y: startY };
            if (checkCollision(dummyGear, startX, startY, bricks)) {
                // Find nearest free spot
                const def = GEAR_DEFS[data.type as GearType];
                const freePos = findFreeSpot(startX, startY, def.radius);
                startX = freePos.x;
                startY = freePos.y;
            }
            addNewGear(data.type as GearType, startX, startY);
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
          // Auto collapse on mobile
          if (window.innerWidth < 768) {
              setIsSidebarOpen(false);
          }
      }
  };

  const handleAddBrickFromSidebar = (length: number, type: 'beam' | 'brick') => {
      if (workspaceRef.current) {
          const rect = workspaceRef.current.getBoundingClientRect();
          const center = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
          const pos = findFreeSpot(center.x, center.y, 40);
          addNewBrick(length, type, pos.x, pos.y);
          // Auto collapse on mobile
          if (window.innerWidth < 768) {
              setIsSidebarOpen(false);
          }
      }
  };

  const addNewGear = (type: GearType, x: number, y: number, existingAxleId?: string) => {
    pushHistory(gears, belts, bricks); 
    const newGear: GearState = {
      id: uuidv4(),
      axleId: existingAxleId || uuidv4(), 
      type, x, y, rotation: 0, connectedTo: [],
      isMotor: false, motorSpeed: 1, motorRpm: globalRpm, motorTorque: 100, motorDirection: 1,
      load: 0, ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
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
          id: uuidv4(), length, brickType: type, x: snappedX, y: snappedY, rotation: 0
      };
      setBricks([...bricks, newBrick]);
      audioManager.playSnap();
  };

  const handleGearConnectBeltStart = (sourceId: string) => {
      setBeltSourceId(sourceId);
      setSelectedId(null); 
  };

  // --- Mouse Handlers ---
  const handleGearMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.button !== 0) return; 

    if (beltSourceId) {
        if (beltSourceId !== id) {
            // Validate Belt Path against Obstacles
            const g1 = gears.find(g => g.id === beltSourceId);
            const g2 = gears.find(g => g.id === id);
            
            if (g1 && g2) {
                 if (checkBeltObstruction(g1, g2, bricks)) {
                     // Belt blocked by obstacle
                     return;
                 }
            }

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

    // DO NOT select immediately to prevent panel from opening on drag
    interactionTargetIdRef.current = id;
    interactionTargetTypeRef.current = 'gear';

    const gear = gears.find(g => g.id === id);
    if (gear) {
        if (gear.fixed) return; // Fixed gears cannot be moved

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

    // DO NOT select immediately to prevent panel from opening on drag
    interactionTargetIdRef.current = id;
    interactionTargetTypeRef.current = 'brick';

    const brick = bricks.find(b => b.id === id);
    if (brick) {
        if (brick.fixed) return; // Fixed bricks cannot be moved

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
    
    // Handle Click-to-Select Logic
    if (!hasMovedRef.current && interactionTargetIdRef.current) {
        if (interactionTargetTypeRef.current === 'gear') {
            setSelectedId(interactionTargetIdRef.current);
            setSelectedBrickId(null);
            // Do NOT auto open properties panel on selection
            // setIsPropertiesOpen(true); 
        } else if (interactionTargetTypeRef.current === 'brick') {
            setSelectedBrickId(interactionTargetIdRef.current);
            setSelectedId(null);
            // setIsPropertiesOpen(false); 
        }
        // If we just clicked (didn't drag), reset the interaction target immediately
        interactionTargetIdRef.current = null;
        interactionTargetTypeRef.current = null;
    }

    if (draggingAxleId) {
      setGears(prev => {
        const movingAxleGears = prev.filter(g => g.axleId === draggingAxleId);
        if (movingAxleGears.length === 0) return prev;
        
        const refGear = movingAxleGears[0];
        const others = prev.filter(g => g.axleId !== draggingAxleId);
        const snappedRef = snapGear(refGear, others, bricks);
        
        // Calculate movement delta
        const deltaX = snappedRef.x - refGear.x;
        const deltaY = snappedRef.y - refGear.y;
        
        let collisionDetected = false;

        // 1. Check Gear vs Obstacle Collision
        for (const g of movingAxleGears) {
            if (checkCollision(g, g.x + deltaX, g.y + deltaY, bricks)) {
                collisionDetected = true;
                break;
            }
        }

        // 2. Check Connected Belt Obstruction
        if (!collisionDetected) {
             const movingIds = new Set(movingAxleGears.map(g => g.id));
             for (const belt of belts) {
                 if (movingIds.has(belt.sourceId) || movingIds.has(belt.targetId)) {
                     let g1 = prev.find(g => g.id === belt.sourceId)!;
                     let g2 = prev.find(g => g.id === belt.targetId)!;

                     if (movingIds.has(g1.id)) g1 = { ...g1, x: g1.x + deltaX, y: g1.y + deltaY };
                     if (movingIds.has(g2.id)) g2 = { ...g2, x: g2.x + deltaX, y: g2.y + deltaY };

                     if (checkBeltObstruction(g1, g2, bricks)) {
                         collisionDetected = true;
                         break;
                     }
                 }
             }
        }

        if (collisionDetected) {
             const originalStateMap = new Map(undoRef.current.gears.map(og => [og.id, og]));
             return prev.map(g => {
                 if (g.axleId === draggingAxleId) {
                     const og = originalStateMap.get(g.id);
                     return og ? og : g;
                 }
                 return g;
             });
        }

        if (snappedRef.x !== refGear.x || snappedRef.y !== refGear.y) {
            audioManager.playSnap();
        }

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
      interactionTargetIdRef.current = null; // Clear after drag end

    } else if (draggingBrickId) {
        setBricks(prev => {
            const movingBrick = prev.find(b => b.id === draggingBrickId);
            if (!movingBrick) return prev;
            const others = prev.filter(b => b.id !== draggingBrickId);
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
        interactionTargetIdRef.current = null; // Clear after drag end
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
      let minDist = 20; 

      bestX = Math.round(bestX / 20) * 20;
      bestY = Math.round(bestY / 20) * 20;
      const isHorizontal = Math.abs(brick.rotation % 180) < 1;

      for (const other of others) {
          const isOtherHorizontal = Math.abs(other.rotation % 180) < 1;
          if (isHorizontal !== isOtherHorizontal) continue;

          if (isHorizontal) {
              const dy = brick.y - other.y;
              const dx = brick.x - other.x;
              if (Math.abs(Math.abs(dy) - BRICK_WIDTH) < 10) {
                  const sign = Math.sign(dy) || 1;
                  bestY = other.y + sign * BRICK_WIDTH;
                  const remainder = dx % HOLE_SPACING;
                  let distToHole = remainder;
                  if (remainder > HOLE_SPACING / 2) distToHole = remainder - HOLE_SPACING;
                  if (remainder < -HOLE_SPACING / 2) distToHole = remainder + HOLE_SPACING;
                  if (Math.abs(distToHole) < 10) bestX = brick.x - distToHole;
                  minDist = 0; 
              }
          } else {
              const dy = brick.y - other.y;
              const dx = brick.x - other.x;
              if (Math.abs(Math.abs(dx) - BRICK_WIDTH) < 10) {
                   const sign = Math.sign(dx) || 1;
                   bestX = other.x + sign * BRICK_WIDTH;
                   const remainder = dy % HOLE_SPACING;
                   let distToHole = remainder;
                   if (remainder > HOLE_SPACING / 2) distToHole = remainder - HOLE_SPACING;
                   if (remainder < -HOLE_SPACING / 2) distToHole = remainder + HOLE_SPACING;
                   if (Math.abs(distToHole) < 10) bestY = brick.y - distToHole;
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

    for (const brick of availableBricks) {
        if (brick.isObstacle) continue; // Don't snap to obstacles

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
      const brick = bricks.find(b => b.id === id);
      if (brick?.fixed) return; // Fixed bricks cannot be rotated
      
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
    const gear = gears.find(g => g.id === id);
    if (gear?.fixed) return; // Cannot delete fixed gears

    pushHistory(gears, belts, bricks);
    const remainingGears = gears.filter(g => g.id !== id);
    const remainingBelts = belts.filter(b => b.sourceId !== id && b.targetId !== id);
    setBelts(remainingBelts);
    setSelectedId(null);
    updatePhysics(remainingGears, remainingBelts);
  };

  const deleteBrick = (id: string) => {
      const brick = bricks.find(b => b.id === id);
      if (brick?.fixed) return; // Cannot delete fixed bricks

      pushHistory(gears, belts, bricks);
      setBricks(prev => prev.filter(b => b.id !== id));
      setSelectedBrickId(null);
  };

  const loadChallengeState = (id: number) => {
      const challenge = CHALLENGES.find(c => c.id === id);
      setGears([]); setBelts([]); setBricks([]); setGlobalRpm(60);
      
      if (challenge && challenge.preset) {
          const preset = challenge.preset();
          setGears(preset.gears);
          setBricks(preset.bricks);
          setBelts(preset.belts);
          
          setTimeout(() => {
               const connected = recalculateConnections(preset.gears);
               const calculated = propagatePhysics(connected, preset.belts);
               setGears(calculated);
          }, 10);
      }
  };

  const resetPlayground = () => {
    pushHistory(gears, belts, bricks);
    setIsPropertiesOpen(false);
    if (activeChallengeId) {
        loadChallengeState(activeChallengeId);
        setChallengeSuccess(false);
        setHighlightedGearIds([]);
        setSelectedId(null);
    } else {
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
    }
  };

  const generateRandomLayout = () => {
    pushHistory(gears, belts, bricks);
    setActiveChallengeId(null);
    setChallengeSuccess(false);
    setHighlightedGearIds([]);

    const generatedGears: GearState[] = [];
    const generatedBricks: BrickState[] = [];
    const generatedBelts: Belt[] = [];
    const cx = 500; const cy = 350;

    // Helper to check if space is free (simple version)
    const isOverlapping = (x: number, y: number, r: number) => {
        return generatedGears.some(g => Math.hypot(g.x - x, g.y - y) < (GEAR_DEFS[g.type].radius + r));
    };

    // 1. Place Base Beam
    const beamLen = 15;
    const beam1: BrickState = { 
        id: uuidv4(), length: beamLen, brickType: 'beam', 
        x: cx - ((beamLen - 1) * HOLE_SPACING) / 2, y: cy, rotation: 0 
    };
    generatedBricks.push(beam1);

    // 2. Place Motor
    const motorType = GearType.Small;
    const startIdx = 1; 
    const motorX = beam1.x + (startIdx * HOLE_SPACING);
    const motorY = beam1.y;
    
    const motorGear: GearState = {
        id: uuidv4(), axleId: uuidv4(), type: motorType, x: motorX, y: motorY, rotation: 0, connectedTo: [],
        isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 200, motorDirection: 1, 
        load: 0, ratio: 1, rpm: 60, torque: 200, direction: 1, speed: 1, isJammed: false, isStalled: false
    };
    generatedGears.push(motorGear);

    // 3. Build Train
    let currentGear = motorGear;
    let currentHoleIdx = startIdx;

    // Available gear types
    const types = Object.values(GearType);

    for (let i = 0; i < 4; i++) {
        // Chance to stack (Compound) if not first
        if (i > 0 && Math.random() > 0.6) {
            const stackType = GearType.Small; // Usually stack down to small to drive big
            const stackGear: GearState = {
                id: uuidv4(), axleId: currentGear.axleId, type: stackType, 
                x: currentGear.x, y: currentGear.y, rotation: currentGear.rotation, 
                connectedTo: [], isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 200, motorDirection: 1,
                load: 0, ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
            };
            generatedGears.push(stackGear);
            currentGear = stackGear; // Continue from this one
        }

        const r1 = GEAR_DEFS[currentGear.type].radius;
        
        // Find a valid next gear
        const validOptions = types.filter(t => {
            const r2 = GEAR_DEFS[t].radius;
            const dist = r1 + r2;
            // Check if distance is multiple of 40 (HOLE_SPACING)
            // Allow small epsilon for float math, though exact constants usually used
            return Math.abs(dist % HOLE_SPACING) < 0.1;
        });

        if (validOptions.length === 0) break; // Dead end

        const nextType = validOptions[Math.floor(Math.random() * validOptions.length)];
        const r2 = GEAR_DEFS[nextType].radius;
        const distHoles = Math.round((r1 + r2) / HOLE_SPACING);
        
        const nextHoleIdx = currentHoleIdx + distHoles;
        
        // Check bounds
        if (nextHoleIdx >= beamLen) break; // Off end of beam

        const nextX = beam1.x + (nextHoleIdx * HOLE_SPACING);
        const nextY = beam1.y;

        if (isOverlapping(nextX, nextY, r2 * 0.8)) break; // Collision

        // Calculate alignment angle (meshing)
        // Current is at (x1,y1), Next is at (x2,y2). Angle is 0 (horizontal).
        const N1 = GEAR_DEFS[currentGear.type].teeth;
        const N2 = GEAR_DEFS[nextType].teeth;
        const angleDeg = 0;
        const theta1 = currentGear.rotation;
        const ratio = N1 / N2;
        const initialRot = (angleDeg - theta1) * ratio + angleDeg + 180 + (180/N2);

        const nextGear: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: nextType, 
            x: nextX, y: nextY, rotation: initialRot, 
            connectedTo: [], isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 200, motorDirection: 1,
            load: 0, ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false
        };

        generatedGears.push(nextGear);
        currentGear = nextGear;
        currentHoleIdx = nextHoleIdx;
    }

    setGears(generatedGears);
    setBricks(generatedBricks);
    setBelts(generatedBelts);
    
    // Trigger physics update
    setTimeout(() => {
        updatePhysics(generatedGears, generatedBelts);
    }, 10);
    
    setGlobalRpm(60);
    setView({ x: 0, y: 0, scale: 0.8 });
  };

  // ... (Rest of App.tsx handlers remain same)
  // Ensure to include handleGlobalRpmChange, handleNextLevel, etc.
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
    if (nextChallenge) {
        setActiveChallengeId(nextChallenge.id);
        loadChallengeState(nextChallenge.id);
    } else {
        setActiveChallengeId(null);
    }
  };

  const onSelectChallenge = (id: number | null) => {
      setActiveChallengeId(id);
      setChallengeSuccess(false);
      if (id) loadChallengeState(id);
  };

  const handleStartLesson = (lesson: Lesson) => {
      setActiveChallengeId(null);
      setGears([]); setBelts([]); setBricks([]);
      const preset = lesson.preset();
      setGears(preset.gears);
      setBricks(preset.bricks);
      setBelts(preset.belts);
      setTimeout(() => {
           const connected = recalculateConnections(preset.gears);
           const calculated = propagatePhysics(connected, preset.belts);
           setGears(calculated);
      }, 10);
      
      const steps: TutorialStep[] = lesson.steps.map(s => ({
          targetId: s.targetId,
          title: lang === 'zh-TW' ? s.titleZh : s.title,
          description: lang === 'zh-TW' ? s.descriptionZh : s.description,
          position: s.position
      }));
      setCurrentTutorialSteps(steps);
      setIsTutorialOpen(true);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleTutorialClose = () => {
      setIsTutorialOpen(false);
      setTimeout(() => { setCurrentTutorialSteps(defaultTutorialSteps); }, 500);
  };

  useEffect(() => {
      if (currentTutorialSteps.length === 0) {
          setCurrentTutorialSteps(defaultTutorialSteps);
      }
  }, []);

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

  return (
    <div className="flex h-screen w-screen overflow-hidden select-none transition-colors duration-300" style={{ backgroundColor: 'var(--bg-app)' }}>
      
      <TutorialOverlay 
          steps={currentTutorialSteps} 
          isOpen={isTutorialOpen} 
          onClose={handleTutorialClose} 
          lang={lang}
      />

      {/* LANGUAGE & SOUND SWITCHER - TOP RIGHT (Mobile) / BOTTOM RIGHT (Desktop) */}
      <div className="absolute z-50 flex gap-2 md:gap-3 top-4 right-4 md:top-auto md:bottom-6 md:right-6">
        <button 
            onClick={() => { setCurrentTutorialSteps(defaultTutorialSteps); setIsTutorialOpen(true); }}
            className="hidden md:flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-colors text-xl shadow-lg hover:scale-105 active:scale-95 font-bold"
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

      {/* Made with Love Footer */}
      <div className="absolute bottom-14 md:bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-[var(--text-secondary)] opacity-50 pointer-events-none font-mono tracking-widest uppercase z-10">
         Made with <span className="text-red-500 font-bold">love</span> by STEAM SQUAD
      </div>

      <Sidebar 
        onDragStart={handleSidebarDragStart} 
        onAddGear={handleAddGearFromSidebar}
        onAddBrick={handleAddBrickFromSidebar}
        activeChallengeId={activeChallengeId}
        onSelectChallenge={onSelectChallenge}
        onStartLesson={handleStartLesson}
        completedChallenges={completedChallenges}
        lang={lang}
        theme={theme}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div className="flex-1 flex flex-col relative">
        {/* Toolbar */}
        <div id="toolbar-controls" className="absolute top-6 left-6 z-30 flex flex-col gap-4 pointer-events-none">
          <button 
            className="pointer-events-auto md:hidden w-12 h-12 bg-[var(--button-bg)] border-2 border-[var(--border-color)] rounded-xl flex items-center justify-center shadow-lg text-2xl text-[var(--text-accent)] hover:brightness-110 active:scale-95 transition-transform"
            onClick={() => setIsMobileToolbarOpen(!isMobileToolbarOpen)}
          >
            {isMobileToolbarOpen ? '✕' : '⚙️'}
          </button>

          <div className={`
            flex flex-col gap-4 transition-all duration-300 origin-top-left
            ${isMobileToolbarOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none h-0 overflow-hidden md:scale-100 md:opacity-100 md:pointer-events-auto md:h-auto md:overflow-visible'}
          `}>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pointer-events-auto">
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
            {/* Logo Overlay */}
            <div className="absolute inset-0 pointer-events-none z-[1]" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                    src="logo.png" 
                    alt=""
                    className={`max-w-[60%] max-h-[60%] object-contain transition-all duration-500 ${theme === 'light' ? 'mix-blend-multiply opacity-10' : 'mix-blend-screen opacity-25'}`}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            </div>

           <svg className="w-full h-full block relative z-10">
             <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--grid-color)" strokeWidth="1"/>
                </pattern>
                <pattern id="hazard-pattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="5" height="10" fill="#000000" opacity="0.5"/>
                </pattern>
                <pattern id="striped-pattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="2" height="10" fill="#000000" opacity="0.3"/>
                </pattern>
                <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                   <path d="M 0 0 L 6 3 L 0 6" fill="none" stroke="var(--gear-stroke)" strokeWidth="1" />
                </marker>
             </defs>
             <g transform={`translate(${view.x}, ${view.y}) scale(${view.scale})`}>
                <rect id="grid-bg" x="-50000" y="-50000" width="100000" height="100000" fill="url(#grid)" className="pointer-events-none" />
                {gears.length === 0 && bricks.length === 0 && (<text x="50%" y="50%" textAnchor="middle" fill="var(--text-muted)" fontSize="24" fontWeight="bold" fontFamily="monospace" letterSpacing="0.2em" className="pointer-events-none opacity-20 select-none">{t.initialize}</text>)}
                
                {/* Render Bricks (Sorted for stacking) */}
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

                {/* Render Belts */}
                {belts.map(belt => {
                  const g1 = gears.find(g => g.id === belt.sourceId);
                  const g2 = gears.find(g => g.id === belt.targetId);
                  if (!g1 || !g2) return null;
                  const r1 = GEAR_DEFS[g1.type].radius;
                  const r2 = GEAR_DEFS[g2.type].radius;
                  const path = generateBeltPath(g1.x, g1.y, r1, g2.x, g2.y, r2);
                  return (
                    <g key={belt.id} onClick={(e) => { 
                        if (e.shiftKey || e.metaKey) {
                             pushHistory(gears, belts, bricks);
                             setBelts(prev => prev.filter(b => b.id !== belt.id));
                             updatePhysics(gears, belts.filter(b => b.id !== belt.id));
                        }
                    }}>
                        <path d={path} fill="none" stroke="#334155" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer" />
                        <path d={path} fill="none" stroke="#facc15" strokeWidth="4" strokeDasharray="8 8" className="animate-dash" />
                    </g>
                  );
                })}

                {/* Render Gears */}
                {sortedGearsForRender.map(gear => (
                  <GearComponent 
                    key={gear.id} 
                    gear={gear} 
                    isSelected={selectedId === gear.id} 
                    isObjectiveTarget={highlightedGearIds.includes(gear.id)}
                    roleHighlight={getGearRole(gear)}
                    axleMates={gears.filter(g => g.axleId === gear.axleId && g.id !== gear.id)}
                    showSpecs={showSpecs}
                    showRatio={showRatio}
                    showRpm={showRpm}
                    showTorque={showTorque}
                    lang={lang}
                    theme={theme}
                    onMouseDown={handleGearMouseDown} 
                    onTouchStart={handleGearTouchStart}
                    onClick={() => {}}
                  />
                ))}
                
                {/* Belt Creation Line */}
                {beltSourceId && (
                    (() => {
                        const g = gears.find(g => g.id === beltSourceId);
                        if(!g) return null;
                        // We need mouse pos here, but in React that's hard without state. 
                        // Visual feedback is tricky without track. 
                        // For now, we rely on the "Belt Mode" banner.
                        return (
                            <circle cx={g.x} cy={g.y} r={GEAR_DEFS[g.type].radius + 10} fill="none" stroke="#a855f7" strokeWidth="4" strokeDasharray="10 5" className="animate-spin-slow" />
                        )
                    })()
                )}

             </g>
           </svg>

           {/* Mission Control / Success Overlay */}
            {activeChallengeId && (
                <div className="absolute top-6 right-6 z-30">
                    <div className={`backdrop-blur-md p-6 rounded-2xl shadow-2xl border-2 transition-all duration-500 ${challengeSuccess ? 'bg-green-900/90 border-green-500 scale-110' : 'bg-[var(--bg-panel-translucent)] border-[var(--border-color)]'}`}>
                        <div className="flex justify-between items-start mb-2 gap-8">
                            <div>
                                <h2 className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70" style={{ color: challengeSuccess ? '#fff' : 'var(--text-secondary)' }}>{t.mission}</h2>
                                <h1 className="text-2xl font-black tracking-tight" style={{ color: challengeSuccess ? '#fff' : 'var(--text-primary)' }}>
                                    {lang === 'zh-TW' ? currentChallenge?.titleZh : currentChallenge?.title}
                                </h1>
                            </div>
                            <div className={`text-3xl ${challengeSuccess ? 'animate-bounce' : 'grayscale opacity-50'}`}>
                                {challengeSuccess ? '🏆' : '🎯'}
                            </div>
                        </div>
                        
                        {challengeSuccess ? (
                            <div className="animate-in fade-in zoom-in duration-300 mt-4">
                                <div className="text-green-200 font-bold mb-4 text-sm">{t.missionAccomplished}</div>
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={handleNextLevel}
                                        className="w-full py-3 bg-white text-green-900 rounded-xl font-black shadow-lg hover:scale-105 active:scale-95 transition-transform uppercase tracking-wide text-sm flex items-center justify-center gap-2"
                                    >
                                        {isLastChallenge ? t.finishAll : t.nextMission}
                                    </button>
                                </div>
                            </div>
                        ) : (
                           <p className="text-sm leading-relaxed opacity-80 mt-2 max-w-[250px]" style={{ color: 'var(--text-secondary)' }}>
                               {lang === 'zh-TW' ? currentChallenge?.descriptionZh : currentChallenge?.description}
                           </p>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Properties Drawer */}
        <GearProperties 
            gear={selectedGear} 
            allGears={gears}
            onUpdate={updateGear} 
            onAddSibling={addGearOnSameAxle}
            onConnectBelt={handleGearConnectBeltStart}
            onDelete={deleteGear}
            isOpen={isPropertiesOpen}
            onToggle={() => setIsPropertiesOpen(!isPropertiesOpen)}
            lang={lang}
        />
      </div>
    </div>
  );
};

export default App;
