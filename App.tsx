
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar, SidebarTab } from './components/Sidebar';
import { GearComponent } from './components/GearComponent';
import { BrickComponent } from './components/BrickComponent';
import { GearProperties } from './components/GearProperties';
import { TutorialOverlay, TutorialStep } from './components/TutorialOverlay';
import { Toolbar } from './components/Toolbar';
import { GlobalControls } from './components/GlobalControls';
import { GearState, GearType, Belt, BrickState, Lesson, GearOrientation } from './types';
import { GEAR_DEFS, HOLE_SPACING } from './constants';
import { getDistance, propagatePhysics, generateBeltPath } from './utils/gearMath';
import { CHALLENGES } from './data/challenges';
import { TRANSLATIONS, Language } from './utils/translations';
import { audioManager } from './utils/audio';
import { loadProgress, loadSettings, saveProgress, saveSettings } from './utils/storage';
import { isOverlappingAxle } from './utils/geometry';
import { findFreeSpot, checkCollision, checkBeltObstruction, snapGear, snapBrick } from './utils/placement';

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
  const [snapPreview, setSnapPreview] = useState<{x: number, y: number, rotation: number} | null>(null);
  
  const [globalRpm, setGlobalRpm] = useState(60); 
  
  // Role Highlights State
  const [showRoles, setShowRoles] = useState(initialSettings.showRoles);
  
  // Label Toggles State
  const [showSpecs, setShowSpecs] = useState(initialSettings.showSpecs); 
  const [showRatio, setShowRatio] = useState(initialSettings.showRatio); 
  const [showRpm, setShowRpm] = useState(initialSettings.showRpm);    
  const [showTorque, setShowTorque] = useState(initialSettings.showTorque);
  const [showLayers, setShowLayers] = useState(false);

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
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('parts');
  
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
  
  // Drag State for grouping
  const dragStateRef = useRef<Map<string, { x: number, y: number }>>(new Map());

  const workspaceRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const currentChallenge = activeChallengeId ? CHALLENGES.find(c => c.id === activeChallengeId) : null;
  const isLastChallenge = currentChallenge ? currentChallenge.id === CHALLENGES[CHALLENGES.length - 1].id : false;
  const selectedGear = selectedId ? gears.find(g => g.id === selectedId) : undefined;
  const selectedBrick = selectedBrickId ? bricks.find(b => b.id === selectedBrickId) : undefined;

  // Derived State for Rendering Order
  const sortedGearsForRender = useMemo(() => {
    return [...gears].sort((a, b) => {
        // 1. Sort by Layer (Back/3 to Front/1)
        const layerA = a.layer || 1;
        const layerB = b.layer || 1;
        if (layerA !== layerB) return layerB - layerA;

        // 2. Sort Axles to Bottom of their layer
        const defA = GEAR_DEFS[a.type];
        const defB = GEAR_DEFS[b.type];
        
        // If same axle group, sort by size
        if (a.axleId === b.axleId) {
             if (defA.isAxle) return -1;
             if (defB.isAxle) return 1;
             return defB.radius - defA.radius;
        }
        
        // General Sort: Axles below Gears
        if (defA.isAxle && !defB.isAxle) return -1;
        if (!defA.isAxle && defB.isAxle) return 1;

        return 0;
    });
  }, [gears]);

  const sortedBricksForRender = useMemo(() => bricks, [bricks]);

  // --- Functions Definitions ---
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

  const recalculateConnections = useCallback((currentGears: GearState[]) => {
      // Reset connections for recalculation
      const gearsWithCleared = currentGears.map(g => ({ ...g, connectedTo: [] as string[] }));
      
      // 1. Pairwise Mesh Detection
      for (let i = 0; i < gearsWithCleared.length; i++) {
          for (let j = i + 1; j < gearsWithCleared.length; j++) {
              const g1 = gearsWithCleared[i];
              const g2 = gearsWithCleared[j];
              
              if (g1.axleId === g2.axleId) continue; // Same axle doesn't mesh
              
              const def1 = GEAR_DEFS[g1.type];
              const def2 = GEAR_DEFS[g2.type];
              
              // LAYER CHECK (Z-Depth)
              // Gears only mesh if on SAME LAYER.
              const l1 = g1.layer || 1;
              const l2 = g2.layer || 1;
              
              if (l1 !== l2) continue; 

              // Bevel Logic:
              const isBevel1 = def1.isBevel;
              const isBevel2 = def2.isBevel;
              
              // Worm Logic
              const isWorm1 = def1.isWorm;
              const isWorm2 = def2.isWorm;

              // Determine if Flat or Vertical
              const isFlat1 = !g1.orientation || g1.orientation === 'flat';
              const isFlat2 = !g2.orientation || g2.orientation === 'flat';

              const dist = getDistance(g1.x, g1.y, g2.x, g2.y);
              
              // CASE 1: Standard Flat Mesh (Spur Gears)
              if (isFlat1 && isFlat2 && !def1.isAxle && !def2.isAxle && !isWorm1 && !isWorm2) {
                  const idealDist = def1.radius + def2.radius;
                  if (Math.abs(dist - idealDist) < 5) {
                      g1.connectedTo.push(g2.id);
                      g2.connectedTo.push(g1.id);
                  }
                  continue;
              }
              
              // CASE 5: Worm to Flat Gear
              let flatG = null;
              let wormG = null;
              let flatDef = null;
              let wormDef = null;
              
              if (isWorm1 && !isWorm2 && !def2.isAxle && isFlat2) { wormG = g1; flatG = g2; wormDef = def1; flatDef = def2; }
              else if (isWorm2 && !isWorm1 && !def1.isAxle && isFlat1) { wormG = g2; flatG = g1; wormDef = def2; flatDef = def1; }
              
              if (wormG && flatG && wormDef && flatDef) {
                   const idealDist = flatDef.radius + wormDef.radius; // Approx 15px radius for worm cylinder
                   
                   if (Math.abs(dist - idealDist) < 10) {
                       g1.connectedTo.push(g2.id);
                       g2.connectedTo.push(g1.id);
                   }
                   continue;
              }

              // CASE 2: Bevel to Flat (Corner)
              flatG = null;
              let bevelG = null;
              flatDef = null;
              let bevelDef = null;
              
              if (isFlat1 && !isFlat2 && isBevel2) { flatG = g1; flatDef = def1; bevelG = g2; bevelDef = def2; }
              else if (isFlat2 && !isFlat1 && isBevel1) { flatG = g2; flatDef = def2; bevelG = g1; bevelDef = def1; }

              if (flatG && bevelG && flatDef && bevelDef) {
                   const idealDist = flatDef.radius + 10; 
                   
                   // Check Distance Tolerance
                   if (Math.abs(dist - idealDist) < 12) {
                        // Check Direction!
                        const dx = bevelG.x - flatG.x;
                        const dy = bevelG.y - flatG.y;
                        const o = bevelG.orientation;
                        
                        if (o === 'bevel_up' && dy > 5 && Math.abs(dx) < 10) {
                             g1.connectedTo.push(g2.id); g2.connectedTo.push(g1.id);
                        }
                        else if (o === 'bevel_down' && dy < -5 && Math.abs(dx) < 10) {
                             g1.connectedTo.push(g2.id); g2.connectedTo.push(g1.id);
                        }
                        else if (o === 'bevel_left' && dx > 5 && Math.abs(dy) < 10) {
                             g1.connectedTo.push(g2.id); g2.connectedTo.push(g1.id);
                        }
                        else if (o === 'bevel_right' && dx < -5 && Math.abs(dy) < 10) {
                             g1.connectedTo.push(g2.id); g2.connectedTo.push(g1.id);
                        }
                   }
                   continue;
              }
              
              // CASE 3: Bevel to Bevel (Corner)
              if (!isFlat1 && !isFlat2 && isBevel1 && isBevel2) {
                   // Bevel-Bevel corners must be perpendicular:
                   // One must be Horizontal-ish (Up/Down), one Vertical-ish (Left/Right)
                   const o1 = g1.orientation;
                   const o2 = g2.orientation;
                   const isHorz1 = o1 === 'bevel_up' || o1 === 'bevel_down';
                   const isHorz2 = o2 === 'bevel_up' || o2 === 'bevel_down';

                   if (isHorz1 !== isHorz2) {
                       // Ideal geometric distance is hypotenuse
                       const ideal = Math.sqrt(def1.radius*def1.radius + def2.radius*def2.radius);
                       if (Math.abs(dist - ideal) < 15) {
                           g1.connectedTo.push(g2.id);
                           g2.connectedTo.push(g1.id);
                       }
                   }
              }
              
              // CASE 4: Axle Connection (Tips connect to Bevels OR Worms)
              if (def1.isAxle && (isBevel2 || isWorm2)) {
                  const len = (g1.length || 3) * HOLE_SPACING;
                  const isHorz = g1.rotation === 0;
                  
                  // Calculate tip positions based on orientation
                  let tip1x, tip1y, tip2x, tip2y;
                  if (isHorz) {
                      tip1x = g1.x - len/2; tip1y = g1.y;
                      tip2x = g1.x + len/2; tip2y = g1.y;
                  } else {
                      tip1x = g1.x; tip1y = g1.y - len/2;
                      tip2x = g1.x; tip2y = g1.y + len/2;
                  }
                  
                  const d1 = Math.hypot(tip1x - g2.x, tip1y - g2.y);
                  const d2 = Math.hypot(tip2x - g2.x, tip2y - g2.y);
                  
                  // Check if tips are close to the CENTER of the bevel/worm gear
                  if (d1 < 20 || d2 < 20) { 
                       g1.connectedTo.push(g2.id);
                       g2.connectedTo.push(g1.id);
                  }
              }
              else if (def2.isAxle && (isBevel1 || isWorm1)) {
                  const len = (g2.length || 3) * HOLE_SPACING;
                  const isHorz = g2.rotation === 0;
                  let tip1x, tip1y, tip2x, tip2y;
                  if (isHorz) {
                      tip1x = g2.x - len/2; tip1y = g2.y;
                      tip2x = g2.x + len/2; tip2y = g2.y;
                  } else {
                      tip1x = g2.x; tip1y = g2.y - len/2;
                      tip2x = g2.x; tip2y = g2.y + len/2;
                  }

                  const d1 = Math.hypot(tip1x - g1.x, tip1y - g1.y);
                  const d2 = Math.hypot(tip2x - g1.x, tip2y - g1.y);
                  
                  if (d1 < 20 || d2 < 20) { 
                       g1.connectedTo.push(g2.id);
                       g2.connectedTo.push(g1.id);
                  }
              }
          }
      }
      return gearsWithCleared;
  }, []);

  const updatePhysics = useCallback((currentGears: GearState[], currentBelts: Belt[]) => {
      const connected = recalculateConnections(currentGears);
      const calculated = propagatePhysics(connected, currentBelts);
      setGears(calculated);
      setBelts(currentBelts);
  }, [recalculateConnections]);

  // --- Action Handlers ---

  const deleteGear = useCallback((id: string) => {
      pushHistory(gears, belts, bricks);
      const gear = gears.find(g => g.id === id);
      if (gear?.fixed) return;
      
      const newGears = gears.filter(g => g.id !== id);
      const newBelts = belts.filter(b => b.sourceId !== id && b.targetId !== id);
      updatePhysics(newGears, newBelts);
      setSelectedId(null);
      audioManager.playSnap();
  }, [gears, belts, bricks, pushHistory, updatePhysics]);

  const deleteBrick = useCallback((id: string) => {
      pushHistory(gears, belts, bricks);
      const brick = bricks.find(b => b.id === id);
      if (brick?.fixed) return;

      setBricks(prev => prev.filter(b => b.id !== id));
      setSelectedBrickId(null);
      audioManager.playSnap();
  }, [gears, belts, bricks, pushHistory]);

  const updateGear = useCallback((id: string, updates: Partial<GearState>) => {
      pushHistory(gears, belts, bricks);
      const updatedGears = gears.map(g => g.id === id ? { ...g, ...updates } : g);
      updatePhysics(updatedGears, belts);
  }, [gears, belts, bricks, pushHistory, updatePhysics]);

  const addGearOnSameAxle = useCallback((sourceGearId: string, type: GearType) => {
      const source = gears.find(g => g.id === sourceGearId);
      if (!source) return;

      const newGear: GearState = {
          id: uuidv4(),
          axleId: source.axleId,
          type,
          x: source.x,
          y: source.y,
          rotation: source.rotation,
          connectedTo: [],
          isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
          ratio: source.ratio, rpm: source.rpm, torque: source.torque, direction: source.direction, speed: source.speed, isJammed: false, isStalled: false,
          layer: source.layer || 1 // Inherit layer by default
      };
      
      pushHistory(gears, belts, bricks);
      updatePhysics([...gears, newGear], belts);
      audioManager.playSnap();
  }, [gears, belts, bricks, pushHistory, updatePhysics]);

  const rotateBrick = useCallback((e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const brick = bricks.find(b => b.id === id);
      if (!brick || brick.fixed) return;
      
      pushHistory(gears, belts, bricks);
      setBricks(prev => prev.map(b => {
          if (b.id === id) return { ...b, rotation: (b.rotation + 90) % 360 };
          return b;
      }));
      audioManager.playSnap();
  }, [gears, belts, bricks, pushHistory]);

  const getGearRole = useCallback((gear: GearState): 'drive' | 'driven' | 'idler' | null => {
      if (!showRoles) return null;
      if (gear.isMotor) return 'drive';
      if (gear.rpm === 0) return null;
      if (gear.load > 0) return 'driven';
      return 'idler';
  }, [showRoles]);

  const resetPlayground = useCallback(() => {
      if (window.confirm(t.reset + '?')) {
          pushHistory(gears, belts, bricks);
          setGears([]);
          setBelts([]);
          setBricks([]);
          setActiveChallengeId(null);
      }
  }, [gears, belts, bricks, pushHistory, t.reset]);

  const generateRandomLayout = useCallback(() => {
      pushHistory(gears, belts, bricks);
      const newGears: GearState[] = [];
      const newBricks: BrickState[] = [];
      
      const cx = 500; 
      const cy = 300;
      
      const b1: BrickState = { id: uuidv4(), length: 13, brickType: 'beam', x: cx - 200, y: cy, rotation: 0 };
      newBricks.push(b1);

      const g1: GearState = {
        id: uuidv4(), axleId: uuidv4(), type: GearType.Medium, x: b1.x, y: b1.y, rotation: 0, connectedTo: [],
        isMotor: true, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
        ratio: 1, rpm: 60, torque: 100, direction: 1, speed: 1, isJammed: false, isStalled: false,
        layer: 1
      };
      newGears.push(g1);
      
      let lastGear = g1;
      for(let i=0; i<3; i++) {
          const type = i % 2 === 0 ? GearType.Small : GearType.Large;
          const defLast = GEAR_DEFS[lastGear.type];
          const defNew = GEAR_DEFS[type];
          const dist = defLast.radius + defNew.radius;
          const newGear: GearState = {
            id: uuidv4(), axleId: uuidv4(), type: type, x: lastGear.x + dist, y: lastGear.y, rotation: 0, connectedTo: [],
            isMotor: false, motorSpeed: 1, motorRpm: 60, motorTorque: 100, motorDirection: 1, load: 0,
            ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
            layer: 1
          };
          newGears.push(newGear);
          lastGear = newGear;
      }

      setGears(newGears);
      setBelts([]);
      setBricks(newBricks);
      setActiveChallengeId(null);
      
      setTimeout(() => updatePhysics(newGears, []), 10);
  }, [gears, belts, bricks, pushHistory, updatePhysics]);

  const onSelectChallenge = useCallback((id: number | null) => {
      if (id === null) {
          setActiveChallengeId(null);
          return;
      }
      const challenge = CHALLENGES.find(c => c.id === id);
      if (challenge) {
          if (challenge.preset) {
              const p = challenge.preset();
              pushHistory(gears, belts, bricks);
              setGears(p.gears);
              setBricks(p.bricks);
              setBelts(p.belts);
              updatePhysics(p.gears, p.belts);
          }
          setActiveChallengeId(id);
          setIsSidebarOpen(false);
      }
  }, [gears, belts, bricks, pushHistory, updatePhysics]);

  const handleStartLesson = useCallback((lesson: Lesson) => {
      if (lesson.preset) {
          const p = lesson.preset();
          pushHistory(gears, belts, bricks);
          setGears(p.gears);
          setBricks(p.bricks);
          setBelts(p.belts);
          updatePhysics(p.gears, p.belts);
      }
      setActiveChallengeId(null);
      setCurrentTutorialSteps(lesson.steps);
      setIsTutorialOpen(true);
      setIsSidebarOpen(false);
  }, [gears, belts, bricks, pushHistory, updatePhysics]);

  const handleNextLevel = useCallback(() => {
      if (activeChallengeId) {
          const idx = CHALLENGES.findIndex(c => c.id === activeChallengeId);
          if (idx >= 0 && idx < CHALLENGES.length - 1) {
              onSelectChallenge(CHALLENGES[idx + 1].id);
          } else {
              setActiveChallengeId(null);
          }
      }
  }, [activeChallengeId, onSelectChallenge]);

  const handleTutorialClose = useCallback(() => {
      setIsTutorialOpen(false);
  }, []);

  const handleGlobalRpmChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      setGlobalRpm(val);
      setGears(prev => {
         const updated = prev.map(g => {
             if (g.isMotor) return { ...g, motorRpm: val };
             return g;
         });
         return propagatePhysics(recalculateConnections(updated), belts);
      });
  }, [belts, recalculateConnections]);


  // Default App Tour Steps
  const defaultTutorialSteps: TutorialStep[] = [
      { title: t.tutorial.welcome, description: t.tutorial.welcomeDesc, position: 'center' },
      { targetId: 'sidebar-container', title: t.tutorial.sidebar, description: t.tutorial.sidebarDesc, position: 'right' },
      { targetId: 'tab-structure', title: t.tutorial.structure, description: t.tutorial.structureDesc, position: 'right' },
      { targetId: 'workspace-area', title: t.tutorial.workspace, description: t.tutorial.workspaceDesc, position: 'center' },
      { targetId: 'toolbar-controls', title: t.tutorial.toolbar, description: t.tutorial.toolbarDesc, position: 'bottom' },
      { targetId: 'btn-example', title: t.tutorial.example, description: t.tutorial.exampleDesc, position: 'right' },
      { targetId: 'prop-panel', title: t.tutorial.properties, description: t.tutorial.propertiesDesc, position: 'left' },
      { targetId: 'tab-missions', title: t.tutorial.missions, description: t.tutorial.missionsDesc, position: 'right' },
      { targetId: 'tab-lessons', title: t.tutorial.lessons, description: t.tutorial.lessonsDesc, position: 'right' },
      { title: t.tutorial.done, description: t.tutorial.doneDesc, position: 'center' },
  ];

  const handleTutorialStepChange = (index: number) => {
      if (index === 1) {
          setIsSidebarOpen(true);
          setSidebarTab('parts');
      }
      else if (index === 2) {
          setIsSidebarOpen(true);
          setSidebarTab('structure');
      }
      else if (index === 5) {
          generateRandomLayout();
      }
      else if (index === 6) {
          setIsPropertiesOpen(true);
          if (gears.length > 0) {
              setSelectedId(gears[0].id);
          }
      } 
      else if (index === 7) {
          if (isPropertiesOpen) setIsPropertiesOpen(false); 
          setIsSidebarOpen(true);
          setSidebarTab('missions');
      }
      else if (index === 8) {
          setIsSidebarOpen(true);
          setSidebarTab('lessons');
      }
      else {
          if (isPropertiesOpen && index !== 6) {
              setIsPropertiesOpen(false);
          }
      }
  };

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

  const cycleGearOrientation = (id: string) => {
      const gear = gears.find(g => g.id === id);
      if (!gear || gear.fixed) return;
      
      const def = GEAR_DEFS[gear.type];
      
      pushHistory(gears, belts, bricks);
      setGears(prev => prev.map(g => {
          if (g.id === id) {
             if (def.isAxle) {
                 // Axle: 0 -> 90 -> 0 (Orientation only)
                 return { ...g, rotation: g.rotation === 0 ? 90 : 0 };
             } else if (def.isWorm) {
                 // Worm: 0 -> 90 -> 0
                 return { ...g, rotation: g.rotation === 0 ? 90 : 0 };
             } else if (def.isBevel) {
                 let newOrientation: GearOrientation = 'flat';
                 const current = g.orientation || 'flat';
                 // Cycle: Flat -> Up -> Right -> Down -> Left -> Flat
                 if (current === 'flat') newOrientation = 'bevel_up';
                 else if (current === 'bevel_up') newOrientation = 'bevel_right';
                 else if (current === 'bevel_right') newOrientation = 'bevel_down';
                 else if (current === 'bevel_down') newOrientation = 'bevel_left';
                 else newOrientation = 'flat';
                 return { ...g, orientation: newOrientation };
             }
          }
          return g;
      }));
      audioManager.playSnap();
  };

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
        if (e.key.toLowerCase() === 'm' && selectedId) {
             const g = gears.find(g => g.id === selectedId);
             if (g && !g.fixed && !GEAR_DEFS[g.type].isAxle && !GEAR_DEFS[g.type].isWorm) {
                 updateGear(selectedId, { isMotor: !g.isMotor });
                 audioManager.playSnap();
             }
        }
        if (e.key.toLowerCase() === 'r' && selectedId) {
            cycleGearOrientation(selectedId);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performUndo, performRedo, selectedId, selectedBrickId, gears, deleteGear, deleteBrick, updateGear]);


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
            
            // Special handling for Axles and Worm Gears: 
            // 'rotation' is used for Orientation (0 or 90), so we must NOT animate it continuously.
            // Instead, we use 'step' for the internal texture animation.
            const def = GEAR_DEFS[gear.type];
            if (def.isAxle || def.isWorm) {
                const currentStep = gear.step || 0;
                // Multiply by direction to spin correct way
                return { ...gear, step: (currentStep + (rotationStep * gear.direction)) % 360 };
            } else {
                return {
                    ...gear,
                    rotation: (gear.rotation + (rotationStep * gear.direction)) % 360
                };
            }
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
    
    const gear = gears.find(g => g.id === id);
    if (gear) {
        interactionTargetIdRef.current = id;
        interactionTargetTypeRef.current = 'gear';
        
        if (gear.fixed) {
             setSelectedId(id);
             setSelectedBrickId(null);
             return; 
        }
        
        undoRef.current = { gears, belts, bricks };
        hasMovedRef.current = false;
        
        const def = GEAR_DEFS[gear.type];
        const isAxle = def.isAxle;
        const groupSize = gears.filter(g => g.axleId === gear.axleId).length;

        // TOUCH LOGIC: Axle = Group, Gear = Detach
        const shouldGroupDrag = isAxle; 

        if (shouldGroupDrag && groupSize > 1) {
            setDraggingAxleId(gear.axleId);
            const map = new Map<string, {x: number, y: number}>();
            const group = gears.filter(g => g.axleId === gear.axleId);
            group.forEach(g => map.set(g.id, { x: g.x, y: g.y }));
            dragStateRef.current = map;
        } else {
            const newAxleId = uuidv4();
            setGears(prev => prev.map(g => g.id === id ? { ...g, axleId: newAxleId } : g));
            setDraggingAxleId(newAxleId);
            dragStateRef.current = new Map([[id, { x: gear.x, y: gear.y }]]);
        }

        const touch = e.touches[0];
        const worldPos = screenToWorld(touch.clientX, touch.clientY);
        setDragOffset({ x: worldPos.x - gear.x, y: worldPos.y - gear.y });
    }
  };

  const handleBrickTouchStart = (e: React.TouchEvent, id: string) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    interactionTargetIdRef.current = id;
    interactionTargetTypeRef.current = 'brick';
    const brick = bricks.find(b => b.id === id);
    if (brick) {
        if (brick.fixed) {
             setSelectedBrickId(id);
             setSelectedId(null);
             return; 
        } 
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
        
        if (draggingAxleId && interactionTargetIdRef.current) {
            hasMovedRef.current = true;
            const clickedId = interactionTargetIdRef.current;
            const startPos = dragStateRef.current.get(clickedId);
            
            if (startPos) {
                const targetX = worldPos.x - dragOffset.x;
                const targetY = worldPos.y - dragOffset.y;
                const deltaX = targetX - startPos.x;
                const deltaY = targetY - startPos.y;
                
                const refGearOriginal = gears.find(g => g.id === clickedId);
                 if (refGearOriginal) {
                     const dummyGear = { ...refGearOriginal, x: targetX, y: targetY };
                     const others = gears.filter(g => g.axleId !== draggingAxleId);
                     const snapped = snapGear(dummyGear, others, bricks);
                     if (Math.abs(snapped.x - targetX) > 0.1 || Math.abs(snapped.y - targetY) > 0.1) {
                        setSnapPreview({ x: snapped.x, y: snapped.y, rotation: snapped.rotation });
                     } else {
                        setSnapPreview(null);
                     }
                }

                setGears(prev => prev.map(g => {
                  if (g.axleId === draggingAxleId) {
                      const initial = dragStateRef.current.get(g.id);
                      if (initial) return { ...g, x: initial.x + deltaX, y: initial.y + deltaY };
                  }
                  return g;
                }));
            }
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
            let length = data.length;

            const dummyGear = { type: data.type as GearType, x: startX, y: startY } as GearState;
            if (checkCollision(dummyGear, startX, startY, bricks)) {
                const def = GEAR_DEFS[data.type as GearType];
                const freePos = findFreeSpot(startX, startY, def.radius, gears, bricks);
                startX = freePos.x;
                startY = freePos.y;
            }
            addNewGear(data.type as GearType, startX, startY, undefined, length);
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

  const handleAddGearFromSidebar = (type: GearType, length?: number) => {
      if (workspaceRef.current) {
          const rect = workspaceRef.current.getBoundingClientRect();
          const center = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
          const def = GEAR_DEFS[type];
          const pos = findFreeSpot(center.x, center.y, def.radius, gears, bricks);
          addNewGear(type, pos.x, pos.y, undefined, length);
          if (window.innerWidth < 768) {
              setIsSidebarOpen(false);
          }
      }
  };

  const handleAddBrickFromSidebar = (length: number, type: 'beam' | 'brick') => {
      if (workspaceRef.current) {
          const rect = workspaceRef.current.getBoundingClientRect();
          const center = screenToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
          const pos = findFreeSpot(center.x, center.y, 40, gears, bricks);
          addNewBrick(length, type, pos.x, pos.y);
          if (window.innerWidth < 768) {
              setIsSidebarOpen(false);
          }
      }
  };

  const addNewGear = (type: GearType, x: number, y: number, existingAxleId?: string, length?: number) => {
    pushHistory(gears, belts, bricks); 
    const newGear: GearState = {
      id: uuidv4(),
      axleId: existingAxleId || uuidv4(), 
      type, x, y, rotation: 0, step: 0, connectedTo: [], length: length,
      isMotor: false, motorSpeed: 1, motorRpm: globalRpm, motorTorque: 100, motorDirection: 1,
      load: 0, ratio: 0, rpm: 0, torque: 0, direction: 1, speed: 0, isJammed: false, isStalled: false,
      orientation: 'flat',
      layer: 1
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

  const handleGearMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.button !== 0) return; 

    if (beltSourceId) {
        if (beltSourceId !== id) {
            const g1 = gears.find(g => g.id === beltSourceId);
            const g2 = gears.find(g => g.id === id);
            if (g1 && g2) {
                 if (checkBeltObstruction(g1, g2, bricks)) return;
            }
            pushHistory(gears, belts, bricks);
            const newBelt: Belt = { id: uuidv4(), sourceId: beltSourceId, targetId: id };
            const newBelts = [...belts, newBelt];
            setBelts(newBelts);
            updatePhysics(gears, newBelts);
            setBeltSourceId(null); 
            audioManager.playSnap();
        }
        return;
    }

    const gear = gears.find(g => g.id === id);
    if (gear) {
        interactionTargetIdRef.current = id;
        interactionTargetTypeRef.current = 'gear';
        
        if (gear.fixed) {
             setSelectedId(id);
             setSelectedBrickId(null);
             return; 
        }
        
        undoRef.current = { gears, belts, bricks }; 
        hasMovedRef.current = false;
        
        const def = GEAR_DEFS[gear.type];
        const isAxle = def.isAxle;
        const groupSize = gears.filter(g => g.axleId === gear.axleId).length;

        const shouldGroupDrag = isAxle ? !e.shiftKey : e.shiftKey;

        if (shouldGroupDrag && groupSize > 1) {
            setDraggingAxleId(gear.axleId);
            const group = gears.filter(g => g.axleId === gear.axleId);
            const map = new Map<string, {x: number, y: number}>();
            group.forEach(g => map.set(g.id, { x: g.x, y: g.y }));
            dragStateRef.current = map;
        } else {
            const newAxleId = uuidv4();
            setGears(prev => prev.map(g => g.id === id ? { ...g, axleId: newAxleId } : g));
            setDraggingAxleId(newAxleId);
            dragStateRef.current = new Map([[id, { x: gear.x, y: gear.y }]]);
        }

        const worldPos = screenToWorld(e.clientX, e.clientY);
        setDragOffset({ x: worldPos.x - gear.x, y: worldPos.y - gear.y });
    }
  };

  const handleGearDoubleClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      cycleGearOrientation(id);
  };

  const handleBrickMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    interactionTargetIdRef.current = id;
    interactionTargetTypeRef.current = 'brick';
    const brick = bricks.find(b => b.id === id);
    if (brick) {
        if (brick.fixed) {
             setSelectedBrickId(id);
             setSelectedId(null);
             return; 
        }
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

    if (draggingAxleId && interactionTargetIdRef.current) {
      hasMovedRef.current = true;
      
      const clickedId = interactionTargetIdRef.current;
      const startPos = dragStateRef.current.get(clickedId);
      
      if (startPos) {
          const targetX = worldPos.x - dragOffset.x;
          const targetY = worldPos.y - dragOffset.y;
          
          const deltaX = targetX - startPos.x;
          const deltaY = targetY - startPos.y;
          
          const refGearOriginal = gears.find(g => g.id === clickedId);
          if (refGearOriginal) {
             const dummyGear = { ...refGearOriginal, x: targetX, y: targetY };
             const others = gears.filter(g => g.axleId !== draggingAxleId);
             const snapped = snapGear(dummyGear, others, bricks);
             
             if (Math.abs(snapped.x - targetX) > 0.1 || Math.abs(snapped.y - targetY) > 0.1) {
                setSnapPreview({ x: snapped.x, y: snapped.y, rotation: snapped.rotation });
             } else {
                setSnapPreview(null);
             }
          }

          setGears(prev => prev.map(g => {
            if (g.axleId === draggingAxleId) {
                const initial = dragStateRef.current.get(g.id);
                if (initial) {
                    return { ...g, x: initial.x + deltaX, y: initial.y + deltaY };
                }
            }
            return g;
          }));
      }
    } else if (draggingBrickId) {
      hasMovedRef.current = true;
      const x = worldPos.x - dragOffset.x;
      const y = worldPos.y - dragOffset.y;
      setBricks(prev => prev.map(b => {
          if (b.id === draggingBrickId) return { ...b, x, y };
          return b;
      }));
    }
  }, [isPanning, panStart, draggingAxleId, draggingBrickId, dragOffset, screenToWorld, gears, bricks]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setSnapPreview(null);

    if (!hasMovedRef.current && interactionTargetIdRef.current) {
        if (interactionTargetTypeRef.current === 'gear') {
            setSelectedId(interactionTargetIdRef.current);
            setSelectedBrickId(null);
        } else if (interactionTargetTypeRef.current === 'brick') {
            setSelectedBrickId(interactionTargetIdRef.current);
            setSelectedId(null);
        }
        interactionTargetIdRef.current = null;
        interactionTargetTypeRef.current = null;
    }

    if (draggingAxleId) {
      setGears(prev => {
        const movingAxleGears = prev.filter(g => g.axleId === draggingAxleId);
        if (movingAxleGears.length === 0) return prev;
        
        let refGear = movingAxleGears.find(g => g.id === interactionTargetIdRef.current);
        if (!refGear) refGear = movingAxleGears[0];

        const others = prev.filter(g => g.axleId !== draggingAxleId);
        const snappedRef = snapGear(refGear, others, bricks);
        
        const deltaX = snappedRef.x - refGear.x;
        const deltaY = snappedRef.y - refGear.y;
        
        let collisionDetected = false;

        for (const g of movingAxleGears) {
            if (checkCollision(g, g.x + deltaX, g.y + deltaY, bricks)) {
                collisionDetected = true;
                break;
            }
        }

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

        const finalX = refGear.x + deltaX;
        const finalY = refGear.y + deltaY;
        let newAxleId = draggingAxleId;
        let merged = false;

        const mountTarget = others.find(g => Math.abs(g.x - finalX) < 1 && Math.abs(g.y - finalY) < 1);
        if (mountTarget) {
            newAxleId = mountTarget.axleId;
            merged = true;
        }
        
        if (!merged) {
            const def = GEAR_DEFS[refGear.type];
            if (def.isAxle) {
                for (const other of others) {
                    if (other.axleId === draggingAxleId) continue;
                    const otherDef = GEAR_DEFS[other.type];
                    if (!otherDef.isAxle) {
                        const axleState = { ...refGear, x: finalX, y: finalY };
                        if (isOverlappingAxle(other.x, other.y, axleState, 10)) {
                             newAxleId = other.axleId;
                             merged = true;
                             break;
                        }
                    }
                }
            } else {
                for (const other of others) {
                    if (other.axleId === draggingAxleId) continue;
                    const otherDef = GEAR_DEFS[other.type];
                    if (otherDef.isAxle) {
                        if (isOverlappingAxle(finalX, finalY, other, 10)) {
                            newAxleId = other.axleId;
                            merged = true;
                            break;
                        }
                    }
                }
            }
        }

        if (merged) {
             audioManager.playSnap();
        }

        const deltaRot = snappedRef.rotation - refGear.rotation; 
        const finalGears = prev.map(g => {
            if (g.axleId === draggingAxleId) {
                return { 
                    ...g, 
                    x: g.x + deltaX, 
                    y: g.y + deltaY, 
                    rotation: (g.rotation + deltaRot) % 360,
                    axleId: newAxleId 
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
      interactionTargetIdRef.current = null;

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
        interactionTargetIdRef.current = null; 
    }
  }, [draggingAxleId, draggingBrickId, pushHistory, belts, bricks, recalculateConnections]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => handleMouseMove(e);
    const onUp = () => handleMouseUp();

    if (draggingAxleId || draggingBrickId || isPanning) {
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }

    return () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
    };
  }, [draggingAxleId, draggingBrickId, isPanning, handleMouseMove, handleMouseUp]);
  
  return (
    <div className="flex h-screen w-screen overflow-hidden select-none transition-colors duration-300" style={{ backgroundColor: 'var(--bg-app)' }}>
       <TutorialOverlay 
          steps={currentTutorialSteps} 
          isOpen={isTutorialOpen} 
          onClose={handleTutorialClose} 
          lang={lang}
          onStepChange={handleTutorialStepChange}
      />

      <GlobalControls 
          lang={lang}
          setLang={setLang}
          theme={theme}
          toggleTheme={toggleTheme}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          onOpenTutorial={() => { setCurrentTutorialSteps(defaultTutorialSteps); setIsTutorialOpen(true); }}
          getThemeTitle={getThemeTitle}
          getThemeIcon={getThemeIcon}
      />

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
        activeTab={sidebarTab}
        onTabChange={setSidebarTab}
      />
      
      <div className="flex-1 flex flex-col relative">
        
        <Toolbar 
            lang={lang}
            globalRpm={globalRpm}
            onGlobalRpmChange={handleGlobalRpmChange}
            showSpecs={showSpecs} setShowSpecs={setShowSpecs}
            showRpm={showRpm} setShowRpm={setShowRpm}
            showRatio={showRatio} setShowRatio={setShowRatio}
            showTorque={showTorque} setShowTorque={setShowTorque}
            showRoles={showRoles} setShowRoles={setShowRoles}
            showLayers={showLayers} setShowLayers={setShowLayers}
            onReset={resetPlayground}
            onExample={generateRandomLayout}
            onFit={() => setView({ x: 0, y: 0, scale: 1 })}
            onZoomIn={() => setView(v => ({ ...v, scale: Math.min(4, v.scale + 0.2) }))}
            onZoomOut={() => setView(v => ({ ...v, scale: Math.max(0.2, v.scale - 0.2) }))}
            isMobileToolbarOpen={isMobileToolbarOpen}
            setIsMobileToolbarOpen={setIsMobileToolbarOpen}
            beltSourceId={beltSourceId}
        />

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
                
                {snapPreview && draggingAxleId && (() => {
                   const g = gears.find(g => g.id === interactionTargetIdRef.current);
                   if(!g) return null;
                   const previewGear = { ...g, x: snapPreview.x, y: snapPreview.y, rotation: snapPreview.rotation };
                   return (
                       <g style={{ opacity: 0.4, filter: 'grayscale(100%) brightness(1.5)' }}>
                           <GearComponent 
                             gear={previewGear} 
                             isSelected={false} 
                             isObjectiveTarget={false}
                             roleHighlight={null}
                             axleMates={[]}
                             showSpecs={false} showRatio={false} showRpm={false} showTorque={false} showLayers={false}
                             lang={lang} theme={theme}
                             onMouseDown={() => {}} onTouchStart={() => {}} onClick={() => {}}
                           />
                       </g>
                   )
                })()}

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
                    showLayers={showLayers}
                    lang={lang}
                    theme={theme}
                    onMouseDown={handleGearMouseDown} 
                    onTouchStart={handleGearTouchStart}
                    onClick={() => {}}
                    onDoubleClick={handleGearDoubleClick}
                  />
                ))}
                
                {beltSourceId && (
                    (() => {
                        const g = gears.find(g => g.id === beltSourceId);
                        if(!g) return null;
                        return (
                            <circle cx={g.x} cy={g.y} r={GEAR_DEFS[g.type].radius + 10} fill="none" stroke="#a855f7" strokeWidth="4" strokeDasharray="10 5" className="animate-spin-slow" />
                        )
                    })()
                )}

             </g>
           </svg>

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

        <GearProperties 
            gear={selectedGear} 
            brick={selectedBrick}
            allGears={gears}
            onUpdate={updateGear} 
            onAddSibling={addGearOnSameAxle}
            onConnectBelt={handleGearConnectBeltStart}
            onDelete={deleteGear}
            onDeleteBrick={deleteBrick}
            onRotateBrick={(id) => {
                if (selectedBrick) {
                    pushHistory(gears, belts, bricks);
                    setBricks(prev => prev.map(b => b.id === id ? { ...b, rotation: (b.rotation + 90) % 360 } : b));
                    audioManager.playSnap();
                }
            }}
            isOpen={isPropertiesOpen}
            onToggle={() => setIsPropertiesOpen(!isPropertiesOpen)}
            lang={lang}
        />
      </div>
    </div>
  );
};

export default App;
