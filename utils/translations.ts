

export type Language = 'en' | 'zh-TW';

export const TRANSLATIONS = {
  en: {
    // App
    appTitle: "GEAR STUDIO",
    partsTray: "Gears",
    missions: "Missions",
    componentTray: "Component Tray",
    add: "ADD",
    teeth: "TEETH",
    missionLog: "Mission Log",
    lessonLog: "Mechanical Lessons",
    solved: "Solved",
    targeting: "Targeting...",
    missionAccomplished: "Mission Accomplished!",
    buildClubFooter: "GEAR STUDIO v1.3",
    
    // Tabs
    tabGears: "Gears",
    tabStructural: "Structural",
    tabChallenges: "Challenges",
    tabLessons: "Lessons",
    
    // Toolbar
    reset: "Reset",
    example: "Example",
    rpm: "RPM",
    torque: "Torque",
    spec: "Spec",
    ratio: "Ratio",
    role: "Role",
    layer: "Layer",
    drive: "Drive",
    driven: "Driven",
    idler: "Idler",
    fit: "Fit",
    initialize: "Let's Build...",
    sound: "Sound",
    mute: "Mute",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    steam: "STEAM SQUAD",
    help: "Help",
    
    // Mission Control
    mission: "MISSION",
    complete: "COMPLETE",
    finishAll: "FINISH ALL 🎉",
    nextMission: "NEXT MISSION ➔",
    stayHere: "Stay Here",
    
    // Gear Properties
    propTitle: "Properties",
    noSelection: "No Component Selected",
    noSelectionDesc: "Select a gear or brick on the workspace to view and edit its properties.",
    typeAxle: "Drive Shaft",
    typeGear: "Gear",
    typeBeam: "Technic Beam",
    typeBrick: "Technic Brick",
    telemetry: "Telemetry",
    speed: "Speed",
    direction: "Direction",
    load: "Load / Resistance",
    inputTorque: "Input Torque",
    outputTorque: "Output Torque",
    nm: "Nm",
    jamDetected: "JAM DETECTED",
    stallDetected: "SYSTEM STALLED",
    stallWarning: "Load exceeds Torque",
    compoundAssembly: "Compound Assembly (Axle)",
    attachedComponents: "Attached Components:",
    addStacked: "+ Add Stacked Gear",
    selectSize: "Select size to stack:",
    cancel: "Cancel",
    meshedOutput: "Meshed Output",
    gear: "Gear",
    setMotor: "Set as Motor",
    motorSpeed: "Motor Speed",
    cw: "CW ↻",
    ccw: "CCW ↺",
    dismantle: "Dismantle Component",
    length: "Length",
    rotation: "Rotation",
    rotate90: "Rotate 90°",
    delete: "Delete",
    
    // Belt / Pulley
    connectBelt: "Connect Belt (Pulley)",
    removeBelt: "Remove Belt",
    beltMode: "Select target gear to connect belt...",
    
    // Gear Labels
    labelDrive: "DRIVE",

    // Tutorial
    tutorial: {
      welcome: "Welcome to GearWorks!",
      welcomeDesc: "Let's take a quick tour to get you building mechanical masterpieces in no time.",
      sidebar: "Component Tray",
      sidebarDesc: "Drag gears, beams, and bricks from here onto the workspace.",
      structure: "Structural Parts",
      structureDesc: "Switch to the 'Structural' tab to find beams and bricks. Use these to build frames and mounts for your gears.",
      workspace: "The Workspace",
      workspaceDesc: "This is where you build. Pan by dragging the background. Zoom with the mouse wheel or buttons. Tap components to edit them.",
      toolbar: "Controls & Visualization",
      toolbarDesc: "Control simulation speed, zoom level, and toggle visual helpers like RPM labels, Torque values, and Role colors.",
      example: "Need Inspiration?",
      exampleDesc: "Click the 'Example' button to generate a random working machine instantly.",
      properties: "Component Properties",
      propertiesDesc: "Select any component to view its details. Use the wrench tab to toggle this panel and configure motors, loads, or stack gears.",
      missions: "Challenges",
      missionsDesc: "Test your skills! Open the Challenges tab to solve engineering puzzles ranging from simple ratios to complex torque problems.",
      lessons: "Interactive Lessons",
      lessonsDesc: "New to mechanics? Try our guided lessons to learn about Ratios, Idlers, and Torque.",
      done: "You're Ready!",
      doneDesc: "Start building now. Remember: If it jams, try checking your spacing!",
      next: "Next",
      back: "Back",
      skip: "Skip Tour",
      finish: "Let's Build!"
    },
    
    lessons: {
       start: "Start Lesson"
    }
  },
  'zh-TW': {
    // App
    appTitle: "GEAR STUDIO",
    partsTray: "藍圖零件",
    missions: "任務挑戰",
    componentTray: "零件盤",
    add: "加入",
    teeth: "齒",
    missionLog: "任務列表",
    lessonLog: "機械課程",
    solved: "已完成",
    targeting: "目標鎖定中...",
    missionAccomplished: "任務完成！",
    buildClubFooter: "GEAR STUDIO v1.3",

    // Tabs
    tabGears: "齒輪",
    tabStructural: "結構",
    tabChallenges: "挑戰",
    tabLessons: "課程",
    
    // Toolbar
    reset: "重置",
    example: "範例",
    rpm: "轉速",
    torque: "扭力",
    spec: "規格",
    ratio: "比率",
    role: "角色",
    layer: "層級",
    drive: "驅動",
    driven: "被動",
    idler: "惰輪",
    fit: "適應",
    initialize: "初始化藍圖...",
    sound: "聲音",
    mute: "靜音",
    theme: "主題",
    light: "亮色",
    dark: "暗色",
    steam: "STEAM 小隊",
    help: "教學",
    
    // Mission Control
    mission: "任務",
    complete: "完成",
    finishAll: "全部完成 🎉",
    nextMission: "下一個任務 ➔",
    stayHere: "留在這裡",
    
    // Gear Properties
    propTitle: "零件屬性",
    noSelection: "未選擇組件",
    noSelectionDesc: "在工作區點擊齒輪或積木以查看和編輯其屬性。",
    typeAxle: "傳動軸",
    typeGear: "齒輪",
    typeBeam: "科技橫梁",
    typeBrick: "科技積木",
    telemetry: "遙測數據",
    speed: "倍率",
    direction: "方向",
    load: "負載 / 阻力",
    inputTorque: "輸入扭力",
    outputTorque: "輸出扭力",
    nm: "牛頓米",
    jamDetected: "卡死警報",
    stallDetected: "系統過載停止",
    stallWarning: "負載超過扭力",
    compoundAssembly: "複合組件 (同軸)",
    attachedComponents: "已連接組件:",
    addStacked: "+ 增加堆疊齒輪",
    selectSize: "選擇堆疊尺寸:",
    cancel: "取消",
    meshedOutput: "嚙合輸出",
    gear: "齒輪",
    setMotor: "設為馬達",
    motorSpeed: "馬達倍率",
    cw: "順時針 ↻",
    ccw: "逆時針 ↺",
    dismantle: "拆除組件",
    length: "長度",
    rotation: "旋轉",
    rotate90: "旋轉 90°",
    delete: "刪除",

    // Belt / Pulley
    connectBelt: "連接皮帶 (滑輪)",
    removeBelt: "移除皮帶",
    beltMode: "選擇目標齒輪以連接皮帶...",

    // Gear Labels
    labelDrive: "驅動",

    // Tutorial
    tutorial: {
      welcome: "歡迎來到 GearWorks!",
      welcomeDesc: "讓我們快速導覽，幫助您立刻開始建造機械傑作。",
      sidebar: "零件盤",
      sidebarDesc: "從這裡拖曳齒輪、橫梁和積木到工作區。",
      structure: "結構零件",
      structureDesc: "切換到「結構」標籤以尋找橫梁和積木。使用這些來為您的齒輪建立框架和底座。",
      workspace: "工作區",
      workspaceDesc: "這是您的建造區域。拖曳背景可平移，滑鼠滾輪可縮放。點擊組件進行編輯。",
      toolbar: "控制與視覺化",
      toolbarDesc: "控制模擬速度、縮放級別，並切換 RPM 標籤、扭力值和角色顏色等視覺輔助工具。",
      example: "需要靈感？",
      exampleDesc: "點擊「範例」按鈕可立即生成一個隨機運作的機器。",
      properties: "零件屬性",
      propertiesDesc: "選擇任何組件以查看其詳細資訊。使用扳手標籤切換此面板，配置馬達、負載或堆疊齒輪。",
      missions: "挑戰",
      missionsDesc: "測試您的技能！打開挑戰標籤，解決從簡單比率到複雜扭力挑戰的工程難題。",
      lessons: "互動課程",
      lessonsDesc: "機械新手？嘗試我們的引導課程，學習齒輪比、惰輪和扭力。",
      done: "準備就緒！",
      doneDesc: "現在開始建造吧。記住：如果卡住了，請檢查您的間距！",
      next: "下一步",
      back: "上一步",
      skip: "跳過導覽",
      finish: "開始建造！"
    },
    
    lessons: {
       start: "開始課程"
    }
  }
};