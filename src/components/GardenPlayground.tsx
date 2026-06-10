import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Member, AnimalType, PetState } from '../types';
import { playRewardSound, playLevelUpSound, playEatSound } from '../utils/audio';
import { 
  CloudRain, 
  Sun, 
  Sparkles, 
  Moon, 
  Heart, 
  UtensilsCrossed, 
  TreePine, 
  MessageSquareOff,
  CloudLightning,
  Volume2
} from 'lucide-react';

interface PetEntity {
  memberId: string;
  memberName: string;
  avatar: string;
  animalType: AnimalType;
  name: string;
  level: number;
  accessory: string;
  // Live positions
  x: number; // 0-100% position in canvas
  y: number; // 0-100% position in canvas
  targetX: number;
  targetY: number;
  flip: boolean;
  speed: number;
  status: 'idle' | 'walking' | 'escaping' | 'eating' | 'sleeping';
  bubbleText?: string;
  bubbleTimer: number;
}

interface GardenPlaygroundProps {
  members: Member[];
  onAwardPass?: (memberId: string, amount: number) => void;
  activeMemberId?: string;
}

export function GardenPlayground({ members, activeMemberId }: GardenPlaygroundProps) {
  // Weather state: sunny, rainy, rainbow, starry
  const [weather, setWeather] = useState<'sunny' | 'rainy' | 'rainbow' | 'starry'>('sunny');
  
  // Toggle to show all pet companions or only the current active child's pet
  const [showAllPets, setShowAllPets] = useState(false);
  
  // Dropped toys/food
  const [droppedTreats, setDroppedTreats] = useState<{ id: number; x: number; y: number; type: 'cookie' | 'apple' | 'star'; size: number }[]>([]);
  
  // Bouncing custom blooming flowers
  const [flowers, setFlowers] = useState<{ id: number; x: number; y: number; scale: number; color: string }[]>([
    { id: 1, x: 12, y: 78, scale: 1.0, color: '#f43f5e' }, // Rose
    { id: 2, x: 28, y: 88, scale: 0.9, color: '#facc15' }, // Yellow daisy
    { id: 3, x: 45, y: 82, scale: 1.2, color: '#c084fc' }, // Violet
    { id: 4, x: 67, y: 79, scale: 1.0, color: '#38bdf8' }, // Bluebell
    { id: 5, x: 82, y: 85, scale: 0.8, color: '#fb923c' }, // Marigold
  ]);

  // Track if manual bell has run (which gathers everyone)
  const [isGathering, setIsGathering] = useState(false);

  // Pets states running locally for real-time translation loop
  const [petEntities, setPetEntities] = useState<PetEntity[]>([]);
  const entitiesRef = useRef<PetEntity[]>([]);

  // Initialize and synchronise pets list
  useEffect(() => {
    // Merge or instantiate live coordinates for each pet in the members array
    const existingMap = new Map(petEntities.map(p => [p.memberId, p]));
    
    const nextList = members.map(m => {
      const existing = existingMap.get(m.id);
      const pet = m.pet;
      
      if (existing) {
        // Keep live coordinates but sync level, accessory, name, etc.
        return {
          ...(existing as PetEntity),
          name: pet.name,
          level: pet.level,
          accessory: pet.accessory || 'none',
        };
      } else {
        // Drop them at random positions
        return {
          memberId: m.id,
          memberName: m.name,
          avatar: m.avatar,
          animalType: pet.animalType,
          name: pet.name,
          level: pet.level,
          accessory: pet.accessory || 'none',
          x: 20 + Math.random() * 60,
          y: 35 + Math.random() * 45,
          targetX: 20 + Math.random() * 60,
          targetY: 35 + Math.random() * 45,
          flip: Math.random() > 0.5,
          speed: 0.6 + Math.random() * 0.4,
          status: 'idle' as const,
          bubbleTimer: 0,
        };
      }
    });

    setPetEntities(nextList);
    entitiesRef.current = nextList;
  }, [members]);

  // Social chats preset based on species & names
  const getRandomDialog = (pet: PetEntity) => {
    const dialogs = [
      `我是${pet.memberName}的宝贝，今天也要元气满满呀！💖`,
      `大家快来呀！在我的庄园，每天都有阳光和欢笑！🌸`,
      `你今天做任务了吗？积累积分可以让我的小世界换装更炫酷哦！🚀`,
      `我们小雅姐姐/小航弟弟是最棒的小朋友，每天都努力成长！✨`,
      `下课啦！做完一次正计时专注，快来陪我吹个泡泡吧！🧼`,
      `我的名字叫【${pet.name}】，我现在是 LV.${pet.level} 咯！⭐ (期待进化)`,
    ];
    
    if (pet.animalType === 'cat') {
      dialogs.push('喵呜～ 有好喝的热牛奶和美味夹心蛋糕吗？🐱');
    } else if (pet.animalType === 'dog') {
      dialogs.push('旺旺！最喜欢跟我的主人一起玩抛皮球比赛啦！🐕');
    } else if (pet.animalType === 'panda') {
      dialogs.push('抱着脆竹子，在大草坪打个滚真是太舒服啦！🐼');
    } else if (pet.animalType === 'rabbit') {
      dialogs.push('呼呼耳朵～ 胡萝卜脆脆甜甜的，我每天都有乖乖刷牙！🐰');
    }

    return dialogs[Math.floor(Math.random() * dialogs.length)];
  };

  // Main tick loop: every 150ms to slowly transition pet coordinates
  useEffect(() => {
    const interval = setInterval(() => {
      const livingTreats = [...droppedTreats];
      let updatedEntities = entitiesRef.current.map(pet => {
        let { x, y, targetX, targetY, speed, status, flip, bubbleTimer, bubbleText } = pet;
        
        // 1. Decelerate speech bubbles over time
        if (bubbleTimer > 0) {
          bubbleTimer -= 1;
          if (bubbleTimer === 0) bubbleText = undefined;
        }

        // 2. Weather override - if rainy, the shelter is centered at X: 20-35%, Y: 43-58% (Mushroom shelter)
        if (weather === 'rainy' && status !== 'escaping') {
          // Force relocate to escape the rain
          targetX = 20 + Math.random() * 15;
          targetY = 44 + Math.random() * 12;
          status = 'escaping';
          speed = 1.6; // run faster!
          
          if (!bubbleText || Math.random() > 0.8) {
            const escapeSayings = ['雨下大啦，快去躲雨！🌧️', '滴答滴答，挤在一起好温暖！☂️', '好险，幸好有这个大蘑菇屋！🍄'];
            bubbleText = escapeSayings[Math.floor(Math.random() * escapeSayings.length)];
            bubbleTimer = 25;
          }
        } 
        else if (weather !== 'rainy' && status === 'escaping') {
          // Restored normal strolling after rain cleared
          status = 'walking';
          speed = 0.5 + Math.random() * 0.4;
          targetX = 15 + Math.random() * 70;
          targetY = 30 + Math.random() * 50;
        }

        // 3. Food/Treat attraction - closest treat attracts hungry pet if any exist
        if (livingTreats.length > 0 && status !== 'escaping') {
          // Find the nearest cookie/apple/star
          let nearestTreat = livingTreats[0];
          let minDist = 99999;
          
          livingTreats.forEach(t => {
            const d = Math.hypot(t.x - x, t.y - y);
            if (d < minDist) {
              minDist = d;
              nearestTreat = t;
            }
          });

          // If close, walk towards food
          if (minDist > 3) {
            targetX = nearestTreat.x;
            targetY = nearestTreat.y;
            status = 'walking';
            speed = 1.1; // hungry rush!
          } else {
            // Arrived at food! Consumes it!
            status = 'eating';
            bubbleText = Math.random() > 0.5 ? '哇！好吃！真香啊～✨' : '嚼嚼嚼... 能量瞬间充满！🍪';
            bubbleTimer = 20;
            // Remove food from state
            setDroppedTreats(prev => prev.filter(t => t.id !== nearestTreat.id));
            try { playEatSound(); } catch (e) { /* silent fail */ }
          }
        }

        // 4. Strolling logic - if idle, randomly start walking to a new coordinates
        if (status === 'idle' && Math.random() > 0.98 && weather !== 'rainy') {
          targetX = 10 + Math.random() * 80;
          targetY = 32 + Math.random() * 45;
          status = 'walking';
          speed = 0.5 + Math.random() * 0.35;
        }

        // 5. Gather code (gong bell)
        if (isGathering) {
          targetX = 45 + Math.random() * 10;
          targetY = 55 + Math.random() * 15;
          status = 'walking';
          speed = 1.3;
          
          if (!bubbleText || Math.random() > 0.8) {
            bubbleText = '铃声响啦！大合照集结啦！🔔';
            bubbleTimer = 30;
          }
        }

        // 6. Transition current coordinates toward target coordinates
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.hypot(dx, dy);

        if (dist > 1.2) {
          x += (dx / dist) * speed;
          y += (dy / dist) * speed;
          // Set flip direction
          if (dx !== 0) {
            flip = dx < 0; // face left if moving left
          }
        } else {
          // Target arrived
          if (status === 'walking') {
            status = 'idle';
            // Random chance to talk when arriving or standing
            if (Math.random() > 0.82 && !bubbleText) {
              bubbleText = getRandomDialog(pet);
              bubbleTimer = 35;
            }
          }
        }

        // 7. Social banter chance when close to each other
        entitiesRef.current.forEach(other => {
          if (other.memberId !== pet.memberId) {
            const meetDist = Math.hypot(other.x - x, other.y - y);
            if (meetDist < 8 && Math.random() > 0.99 && !bubbleText) {
              status = 'idle';
              bubbleText = `嗨！【${other.name}】！你头上戴着的穿戴太好看啦！💖`;
              bubbleTimer = 30;
            }
          }
        });

        return {
          ...pet,
          x,
          y,
          targetX,
          targetY,
          status,
          flip,
          speed,
          bubbleTimer,
          bubbleText
        };
      });

      setPetEntities(updatedEntities);
      entitiesRef.current = updatedEntities;
    }, 150);

    return () => clearInterval(interval);
  }, [droppedTreats, weather, isGathering]);

  // Handle canvas click to place treats
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if clicking inside elements like buttons or toys
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-clickable') || target.closest('button')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain treats to the lawn
    if (y < 28) return;

    const items: ('cookie' | 'apple' | 'star')[] = ['cookie', 'apple', 'star'];
    const randomType = items[Math.floor(Math.random() * items.length)];

    const newTreat = {
      id: Date.now() + Math.random(),
      x,
      y,
      type: randomType,
      size: 20 + Math.random() * 10
    };

    setDroppedTreats(prev => [...prev, newTreat]);
    playRewardSound();
    
    // Spawn speech bubbles for nearest pet
    if (entitiesRef.current.length > 0) {
      let nearestIdx = 0;
      let minDist = 99999;
      entitiesRef.current.forEach((p, idx) => {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < minDist) {
          minDist = d;
          nearestIdx = idx;
        }
      });
      
      const targetPet = entitiesRef.current[nearestIdx];
      targetPet.targetX = x;
      targetPet.targetY = y;
      targetPet.status = 'walking';
      targetPet.speed = 1.25;
      
      // Fun speech bubble
      const foodCalls = ['咦！前面有飘香的小点心落下来啦！🍪', '有香甜水果吃啦！冲鸭！🍎', '亮晶晶的魔力星星糖！小兔子要吃！🍬'];
      targetPet.bubbleText = foodCalls[Math.floor(Math.random() * foodCalls.length)];
      targetPet.bubbleTimer = 25;
    }
  };

  // Click flower to trigger spring leap bounce!
  const triggerFlowerBounce = (id: number) => {
    setFlowers(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, scale: 1.85 };
      }
      return f;
    }));
    playRewardSound();

    setTimeout(() => {
      setFlowers(prev => prev.map(f => {
        if (f.id === id) return { ...f, scale: 1.0 };
        return f;
      }));
    }, 400);
  };

  // Ring gathering bell
  const ringGatheringBell = () => {
    setIsGathering(true);
    playLevelUpSound();
    setTimeout(() => {
      setIsGathering(false);
    }, 3500);
  };

  // SVG Renderer helper for accessories worn in the garden
  const renderAccessoryOverlay = (accessory: string) => {
    switch (accessory) {
      case 'glasses':
        return (
          // Elegant nerd spectacles (3D looking black-frame, round)
          <g transform="translate(18, 4)" stroke="#1e293b" strokeWidth="2.5" fill="none">
            <circle cx="9" cy="11" r="5" fill="#ffffff" fillOpacity="0.15" />
            <circle cx="21" cy="11" r="5" fill="#ffffff" fillOpacity="0.15" />
            <line x1="14" y1="11" x2="16" y2="11" strokeWidth="3" />
            <line x1="4" y1="11" x2="6" y2="10" />
            <line x1="24" y1="10" x2="26" y2="11" />
          </g>
        );
      case 'magic_hat':
        return (
          // Deep Indigo Magical Wizard Hat with golden shimmering star
          <g transform="translate(14, -18)" stroke="#581c87" strokeWidth="1" fill="#6b21a8">
            <path d="M4 18L15 -2L25 18Z" />
            <ellipse cx="15" cy="18" rx="14" ry="4" stroke="#a21caf" fill="#c084fc" />
            <polygon points="15,-6 17,-2 21,-2 18,1 19,5 15,3 11,5 12,1 9,-2 13,-2" fill="#eab308" stroke="#ca8a04" strokeWidth="0.8" />
          </g>
        );
      case 'bowtie':
        return (
          // Beautiful 3D plastic bowtie under the chin (Y: 21-25 area)
          <g transform="translate(16, 23)" fill="#f43f5e" stroke="#be123c" strokeWidth="1.2">
            <path d="M2 1L8 5L2 9Z" />
            <path d="M18 1L12 5L18 9Z" />
            <circle cx="10" cy="5" r="3" fill="#fda4af" />
          </g>
        );
      case 'scarf':
        return (
          // Stripy warm cozy hand-knitted winter scarf draped on chest
          <g transform="translate(11, 22)">
            <path d="M4 2 C12 6, 18 6, 24 2 C26 7, 22 10, 15 10 C8 10, 4 6, 4 2Z" fill="#ea580c" stroke="#c2410c" strokeWidth="1" />
            {/* hanging portion */}
            <path d="M12 8L10 17" stroke="#fb923c" strokeWidth="4" strokeLinecap="round" />
            <path d="M17 8L18 19" stroke="#ea580c" strokeWidth="4.5" strokeLinecap="round" />
          </g>
        );
      case 'gold_crown':
        return (
          // Little 3D golden sparkles crown
          <g transform="translate(14, -13)" filter="drop-shadow(0px 3px 2px rgba(0,0,0,0.15))">
            <path d="M4 14L8 4L15 10L22 4L26 14Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
            <circle cx="8" cy="3" r="1.5" fill="#facc15" />
            <circle cx="15" cy="9" r="1.5" fill="#facc15" />
            <circle cx="22" cy="3" r="1.5" fill="#facc15" />
            <line x1="5" y1="14" x2="25" y2="14" stroke="#d97706" strokeWidth="1.5" />
          </g>
        );
      case 'angel_wings':
        return (
          // Translucent wings in background on side
          <g transform="translate(-10, 3)" opacity="0.85" fill="#38bdf8" stroke="#0ea5e9" strokeWidth="0.8">
            {/* Left wing */}
            <path d="M4 12 C-8 4, -12 20, 2 30 C-3 22, -2 14, 4 12Z" fill="#bae6fd" />
            {/* Right wing translated */}
            <g transform="translate(68, 0) scale(-1, 1)">
              <path d="M4 12 C-8 4, -12 20, 2 30 C-3 22, -2 14, 4 12Z" fill="#bae6fd" />
            </g>
          </g>
        );
      case 'explorer_goggles':
        return (
          // Retro aircraft aviator goggles sat up high on forehead
          <g transform="translate(17, -2)" stroke="#78350f" strokeWidth="2.5" fill="none">
            <rect x="5" y="4" width="8" height="6" rx="2" fill="#bae6fd" />
            <rect x="15" y="4" width="8" height="6" rx="2" fill="#bae6fd" />
            <line x1="12.5" y1="7" x2="15" y2="7" strokeWidth="3" />
            <line x1="2" y1="7" x2="5" y2="7" strokeWidth="1.5" />
            <line x1="23" y1="7" x2="26" y2="7" strokeWidth="1.5" />
          </g>
        );
      default:
        return null;
    }
  };

  // Base cute round pet shape render inside the canvas playground
  const renderMiniPetBody = (animal: AnimalType, status: string) => {
    const isSleeping = status === 'sleeping';
    
    switch (animal) {
      case 'cat':
        return (
          <g>
            <radialGradient id="miniCatBody" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="60%" stopColor="#fdb04d" />
              <stop offset="100%" stopColor="#ea580c" />
            </radialGradient>
            
            {/* Ears */}
            <path d="M12 12 L2 0 L16 6 Z" fill="#eb7026" />
            <path d="M38 12 L48 0 L34 6 Z" fill="#eb7026" />
            <path d="M12 12 L6 3 L15 8 Z" fill="#fda4af" />
            <path d="M38 12 L44 3 L35 8 Z" fill="#fda4af" />

            {/* Back tail */}
            <path d="M42 36 C52 38, 55 24, 48 16" fill="none" stroke="#eb7026" strokeWidth="5" strokeLinecap="round" />

            {/* Body base */}
            <circle cx="25" cy="27" r="21" fill="url(#miniCatBody)" />
            <circle cx="25" cy="29" r="11" fill="#ffffff" opacity="0.85" />

            {/* Small feline whiskers */}
            <path d="M6 26H0 M6 30H1 M44 26H50 M44 30H49" stroke="#c2410c" strokeWidth="1.5" />

            {/* Eyes */}
            {isSleeping ? (
              <path d="M13 22Q17 25 20 22 M30 22Q33 25 37 22" stroke="#7c2d12" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            ) : (
              <>
                <circle cx="17" cy="21" r="3.2" fill="#2d0601" />
                <circle cx="33" cy="21" r="3.2" fill="#2d0601" />
                <circle cx="16" cy="20" r="1" fill="#ffffff" />
                <circle cx="32" cy="20" r="1" fill="#ffffff" />
              </>
            )}

            {/* Nose & cute cat mouth */}
            <polygon points="25,23 23,21 27,21" fill="#fda4af" />
            <path d="M21 26Q25 29 29 26" stroke="#9a3412" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        );

      case 'dog':
        return (
          <g>
            <radialGradient id="miniDogBody" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fffeea" />
              <stop offset="50%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
            
            {/* Tail */}
            <path d="M43 33 C52 32, 53 20, 47 14" fill="none" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />

            {/* Floppy hanging ears */}
            <path d="M10 14 C2 14, 0 28, 6 36 C10 40, 15 28, 14 18 Z" fill="#b45309" />
            <path d="M40 14 C48 14, 50 28, 44 36 C40 40, 35 28, 36 18 Z" fill="#b45309" />

            {/* Spherical body */}
            <circle cx="25" cy="27" r="21" fill="url(#miniDogBody)" />
            <circle cx="25" cy="30" r="11" fill="#fffbeb" />

            {/* Snout with small brown nose */}
            <ellipse cx="25" cy="25" rx="7" ry="5.5" fill="#fffbeb" stroke="#b45309" strokeWidth="0.8" />
            <polygon points="25,23 22,20 28,20" fill="#451a03" />

            {/* Face/Status */}
            {isSleeping ? (
              <path d="M12 19Q16 22 19 19 M31 19Q34 22 38 19" stroke="#451a03" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            ) : (
              <>
                <circle cx="16" cy="18" r="3.2" fill="#3b1e04" />
                <circle cx="34" cy="18" r="3.2" fill="#3b1e04" />
                <circle cx="15" cy="17" r="1" fill="#ffffff" />
                <circle cx="33" cy="17" r="1" fill="#ffffff" />
                {/* little red panting tongue */}
                <path d="M23 27v4c0 2 4 2 4 0v-4" fill="#f43f5e" />
              </>
            )}
          </g>
        );

      case 'panda':
        return (
          <g>
            <radialGradient id="miniPandaWhite" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="75%" stopColor="#edf2f7" />
              <stop offset="100%" stopColor="#94a3b8" />
            </radialGradient>
            
            {/* Big black ears */}
            <circle cx="11" cy="10" r="7.5" fill="#1e293b" />
            <circle cx="39" cy="10" r="7.5" fill="#1e293b" />

            {/* Sphere body */}
            <circle cx="25" cy="27" r="21" fill="url(#miniPandaWhite)" />
            
            {/* Black arm shoulder band */}
            <path d="M1 28 C3 16, 47 16, 49 28 L46 36 C42 22, 8 22, 4 36 Z" fill="#1e293b" />

            {/* Black eye patches */}
            <ellipse cx="17" cy="22" rx="5.5" ry="7.5" fill="#1e293b" transform="rotate(-15 17 22)" />
            <ellipse cx="33" cy="22" rx="5.5" ry="7.5" fill="#1e293b" transform="rotate(15 33 22)" />

            {/* Beads of eyes */}
            {isSleeping ? (
              <path d="M15 22h4 M31 22h4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <>
                <circle cx="17" cy="21" r="2" fill="#ffffff" />
                <circle cx="33" cy="21" r="2" fill="#ffffff" />
                <circle cx="17" cy="21" r="0.8" fill="#000000" />
                <circle cx="33" cy="21" r="0.8" fill="#000000" />
              </>
            )}

            {/* Nose & tiny split smile */}
            <ellipse cx="25" cy="25" rx="3.5" ry="2" fill="#0f172a" />
            <path d="M22 28Q25 30 28 28" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </g>
        );

      case 'rabbit':
        return (
          <g>
            <radialGradient id="miniRabbitBody" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#fdf4ff" />
              <stop offset="100%" stopColor="#d946ef" />
            </radialGradient>
            
            {/* Fluffy tail on left back */}
            <circle cx="6" cy="34" r="5" fill="#fcf6fd" stroke="#e879f9" strokeWidth="0.8" />

            {/* Long rabbit ears with pink inside */}
            <g transform="translate(11, -9)">
              <rect x="0" y="0" width="6.5" height="19" rx="3" fill="#ffffff" stroke="#e879f9" strokeWidth="0.8" />
              <rect x="1.5" y="3" width="3.5" height="13" rx="1.5" fill="#fda4af" />
            </g>
            <g transform="translate(325, -9) scale(-1, 1)">
              {/* Mirrors on scale */}
              <g transform="translate(292, 0)">
                <rect x="0" y="0" width="6.5" height="19" rx="3" fill="#ffffff" stroke="#e879f9" strokeWidth="0.8" />
                <rect x="1.5" y="3" width="3.5" height="13" rx="1.5" fill="#fda4af" />
              </g>
            </g>

            {/* Main white bunny body */}
            <circle cx="25" cy="27" r="21" fill="url(#miniRabbitBody)" />
            <ellipse cx="25" cy="30" rx="10" ry="6.5" fill="#fae8ff" />

            {/* Eyes */}
            {isSleeping ? (
              <path d="M14 22Q17 24 20 22 M30 22Q33 24 36 22" stroke="#701a75" strokeWidth="2.5" fill="none" />
            ) : (
              <>
                <circle cx="17" cy="21" r="3.2" fill="#6b21a8" />
                <circle cx="33" cy="21" r="3.2" fill="#6b21a8" />
                <circle cx="15" cy="19" r="1" fill="#ffffff" />
                <circle cx="31" cy="19" r="1" fill="#ffffff" />
              </>
            )}

            {/* Cute button bunny nose */}
            <ellipse cx="25" cy="24" rx="2.5" ry="1.8" fill="#fda4af" />
            <path d="M21 27Q25 30 29 27" stroke="#701a75" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            
            {/* Bunny buck teeth */}
            <rect x="23.5" y="27.5" width="3" height="3" fill="#ffffff" stroke="#701a75" strokeWidth="0.8" />
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <section className="w-full px-4 sm:px-8 mt-4 select-none">
      <div className="max-w-7xl mx-auto bg-pink-50/50 p-5 rounded-[32px] border-[3px] border-pink-200/60 shadow-sm">
        
        {/* Garden headers and weather controller bar */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-400 text-white text-lg font-black rounded-2xl border-b-4 border-pink-600 shadow-sm">
              🏡
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                <span>萌宠守护梦幻庄园</span>
                <span className="text-[10px] font-black text-pink-600 bg-pink-100/60 border border-pink-200 px-2.5 py-0.5 rounded-full font-sans">
                  {!showAllPets ? '单宠清爽模式' : '萌友大合照'}
                </span>
              </h3>
              <p className="text-xs text-rose-800/80 font-bold tracking-wide">
                {!showAllPets 
                  ? '当前仅显示您专属的宝贝！点击右侧“👥 宠物大汇合”可召唤全家人心爱的动物伙伴哦！' 
                  : '全家的小可爱都在大坪上面欢聚互动、说悄悄话呢！点击天气让景色变幻吧！🌺'}
              </p>
            </div>
          </div>

          {/* Chunky weather control buttons with direct "Pressed" tactile look */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Show My Pet / Show All Pets switch */}
            <button
              onClick={() => { setShowAllPets(!showAllPets); playRewardSound(); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border
                ${!showAllPets
                  ? 'bg-rose-500 text-white border-rose-700 border-b-[4px] hover:bg-rose-400 hover:border-b-[3px] active:translate-y-[2px] active:border-b-[1px]'
                  : 'bg-white text-rose-500 border-pink-200 border-b-[4px] hover:bg-pink-50/50 hover:border-b-[2px] hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0'
                }`}
              title="切换显示独宠或多宠"
            >
              <span>{showAllPets ? '🐾 仅看我的宝贝' : '👥 宠物大汇合'}</span>
            </button>

            <span className="text-pink-200 mx-1 font-bold">|</span>

            {/* Sunny weather button */}
            <button
              onClick={() => { setWeather('sunny'); playRewardSound(); }}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border
                ${weather === 'sunny'
                  ? 'bg-amber-400 text-stone-900 border-amber-600 border-b-[4px] font-bold'
                  : 'bg-white text-stone-600 border-stone-250 border-b-[4px] hover:border-b-[2px] hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0'
                }`}
              title="晴空万里"
            >
              <Sun className="w-3.5 h-3.5 text-amber-600" />
              <span>晴空</span>
            </button>

            {/* Rainy weather button */}
            <button
              onClick={() => { setWeather('rainy'); playRewardSound(); }}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border
                ${weather === 'rainy'
                  ? 'bg-sky-400 text-white border-sky-600 border-b-[4px] font-bold'
                  : 'bg-white text-stone-600 border-stone-250 border-b-[4px] hover:border-b-[2px] hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0'
                }`}
              title="淅沥小雨"
            >
              <CloudRain className="w-3.5 h-3.5 text-sky-500" />
              <span>避雨</span>
            </button>

            {/* Rainbow weather button */}
            <button
              onClick={() => { setWeather('rainbow'); playRewardSound(); }}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border
                ${weather === 'rainbow'
                  ? 'bg-pink-400 text-white border-pink-650 border-b-[4px] font-bold'
                  : 'bg-white text-stone-600 border-stone-250 border-b-[4px] hover:border-b-[2px] hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0'
                }`}
              title="七彩霓虹"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>彩虹</span>
            </button>

            {/* Starry weather button */}
            <button
              onClick={() => { setWeather('starry'); playRewardSound(); }}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border
                ${weather === 'starry'
                  ? 'bg-indigo-900 text-amber-200 border-indigo-950 border-b-[4px] font-bold'
                  : 'bg-white text-stone-600 border-stone-250 border-b-[4px] hover:border-b-[2px] hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0'
                }`}
              title="梦幻星夜"
            >
              <Moon className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
              <span>星晨</span>
            </button>

            <span className="text-pink-200 mx-1 font-bold">|</span>

            {/* Physical gathered bell - Gathers everyone */}
            <button
              onClick={ringGatheringBell}
              disabled={isGathering}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-400 hover:bg-rose-500 text-white border-b-[4px] border-rose-600 hover:border-b-[2px] hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0 text-xs font-black rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="敲钟集结大合照"
            >
              <Volume2 className="w-3.5 h-3.5 animate-bounce" />
              <span>敲钟集结</span>
            </button>

          </div>

        </div>

        {/* MAIN INTERACTIVE GARDEN CANVAS */}
        <div 
          onClick={handleCanvasClick}
          className={`w-full h-[320px] rounded-3xl relative overflow-hidden shadow-inner border transition-all duration-1000 select-none
            ${weather === 'sunny'
              ? 'bg-gradient-to-b from-sky-200 via-sky-150 to-emerald-100 border-sky-300'
              : weather === 'rainy'
              ? 'bg-gradient-to-b from-slate-400 via-sky-900 to-emerald-950/90 border-slate-500'
              : weather === 'rainbow'
              ? 'bg-gradient-to-b from-sky-200 via-fuchsia-100 to-emerald-50 border-sky-200'
              : 'bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-900 border-indigo-950'
            }`}
        >
          {/* Sunny rotating big Sun element */}
          {weather === 'sunny' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
              className="absolute top-4 right-8 w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center opacity-85 select-none pointer-events-none filter blur-[0.5px] shadow-[0_0_12px_rgba(251,191,36,0.5)]"
            >
              <div className="w-14 h-14 bg-amber-300 rounded-full border border-amber-200 flex items-center justify-center">
                ☀️
              </div>
            </motion.div>
          )}

          {/* Rainbow neon curve overlay */}
          {weather === 'rainbow' && (
            <div className="absolute top-2 left-10 right-10 h-32 pointer-events-none select-none opacity-80 filter blur-[0.4px]">
              <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
                <path d="M 0 100 Q 200 10 400 100" fill="none" stroke="#f43f5e" strokeWidth="6" opacity="0.65" />
                <path d="M 0 100 Q 200 18 400 100" fill="none" stroke="#fb923c" strokeWidth="6" opacity="0.65" />
                <path d="M 0 100 Q 200 26 400 100" fill="none" stroke="#facc15" strokeWidth="6" opacity="0.65" />
                <path d="M 0 100 Q 200 34 400 100" fill="none" stroke="#4ade80" strokeWidth="6" opacity="0.65" />
                <path d="M 0 100 Q 200 42 400 100" fill="none" stroke="#38bdf8" strokeWidth="6" opacity="0.65" />
                <path d="M 0 100 Q 200 50 400 100" fill="none" stroke="#818cf8" strokeWidth="6" opacity="0.65" />
                <path d="M 0 100 Q 200 58 400 100" fill="none" stroke="#c084fc" strokeWidth="6" opacity="0.65" />
              </svg>
            </div>
          )}

          {/* Starry Night glowing moon & stars blinking */}
          {weather === 'starry' && (
            <>
              <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 6 }}
                className="absolute top-4 right-10 w-12 h-12 text-3xl opacity-90 select-none pointer-events-none drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]"
              >
                🌙
              </motion.div>
              {/* Star blinker dots */}
              <div className="absolute top-6 left-[15%] text-white text-xs select-none pointer-events-none animate-pulse">★</div>
              <div className="absolute top-12 left-[30%] text-white text-[9px] select-none pointer-events-none animate-ping duration-1000">✦</div>
              <div className="absolute top-5 left-[50%] text-white text-[10px] select-none pointer-events-none animate-pulse">★</div>
              <div className="absolute top-10 left-[75%] text-white text-xs select-none pointer-events-none animate-pulse">✦</div>
            </>
          )}

          {/* Raining Overlay particles */}
          {weather === 'rainy' && (
            <div className="absolute inset-0 select-none pointer-events-none overflow-hidden z-20">
              <div className="absolute top-0 left-0 right-0 h-full bg-slate-900/10" />
              <div className="float-rain flex flex-wrap justify-between w-[150%] h-[150%] -translate-y-10 scale-95 opacity-40">
                {[...Array(24)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, 400], x: [0, -30] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.9 + Math.random() * 0.6,
                      ease: 'linear',
                      delay: Math.random() * 1
                    }}
                    className="w-[1.5px] h-9 bg-sky-300 rounded-full"
                    style={{ marginLeft: `${Math.random() * 4}%` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* BACKGROUND BACKGROUND LANDSCAPE (Beautiful Grass Lawn) */}
          {/* 3D clay-effect grass landscape slope */}
          <div className={`absolute bottom-0 left-0 right-0 h-[72%] rounded-t-[44px] transition-all duration-1000 shadow-inner
            ${weather === 'sunny'
              ? 'bg-gradient-to-b from-emerald-400 via-emerald-500 to-green-600 border-t border-emerald-300'
              : weather === 'rainy'
              ? 'bg-gradient-to-b from-emerald-900/90 via-emerald-950 to-green-950 border-t border-emerald-800'
              : weather === 'rainbow'
              ? 'bg-gradient-to-b from-emerald-400 via-green-500 to-emerald-600 border-t border-emerald-300'
              : 'bg-gradient-to-b from-emerald-950 via-green-950 to-emerald-900 border-t border-emerald-900'
            }`}
          />

          {/* THE GIANT 3D MUSHROOM SHELTER (躲雨屋) */}
          <div className="absolute left-[12%] bottom-[25%] w-36 h-36 select-none pointer-events-none z-10">
            <svg 
              className="w-full h-full filter drop-shadow-[0_10px_15px_rgba(15,23,42,0.22)]"
              viewBox="0 0 134 134"
            >
              {/* Mushroom stem */}
              <path d="M60 70 C55 125, 80 125, 75 70" fill="#fef3c7" stroke="#dac387" strokeWidth="1.5" />
              <ellipse cx="67" cy="118" rx="14" ry="5.5" fill="#dac387" opacity="0.3" />

              {/* Large Red Mushroom cap */}
              <path d="M12 70 C12 30, 122 30, 122 70 C122 76, 12 76, 12 70Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
              
              {/* White rounds */}
              <circle cx="34" cy="50" r="8" fill="#ffffff" />
              <circle cx="67" cy="42" r="10" fill="#ffffff" />
              <circle cx="102" cy="53" r="7.5" fill="#ffffff" />
              <ellipse cx="64" cy="62" rx="11" ry="5.5" fill="#ffffff" />
              <circle cx="12" cy="70" r="3" fill="#ffffff" />
              <circle cx="122" cy="70" r="3" fill="#ffffff" />

              {/* Shadow under cap */}
              <ellipse cx="67" cy="73" rx="42" ry="5" fill="#dac387" opacity="0.9" />
              
              {/* Text label */}
              <text x="32" y="130" className="text-[9px] font-mono font-bold" fill="#792512" opacity="0.75">躲雨亭 shelter</text>
            </svg>
          </div>

          {/* SEED CLAY TREE ON RIGHT */}
          <svg 
            className="absolute right-[8%] bottom-[24%] w-24 h-40 select-none pointer-events-none z-10 filter drop-shadow-[0_8px_12px_rgba(15,23,42,0.18)]"
            viewBox="0 0 100 140"
          >
            {/* trunk */}
            <path d="M44 90 C40 135, 54 135, 50 90" fill="#78350f" />
            {/* fluffy foliage layers */}
            <circle cx="47" cy="75" r="23" fill="#15803d" opacity="0.9" />
            <circle cx="34" cy="60" r="21" fill="#166534" opacity="0.9" />
            <circle cx="60" cy="58" r="22" fill="#22c55e" opacity="0.85" />
            <circle cx="47" cy="46" r="22" fill="#4ade80" opacity="0.9" />
          </svg>

          {/* GORGEOUS FLOWERS THAT BOUNCE WHEN CLICKED */}
          {flowers.map((f) => (
            <div
              key={f.id}
              onClick={() => triggerFlowerBounce(f.id)}
              className="absolute interactive-clickable cursor-pointer z-10 p-2 transform origin-bottom hover:scale-110 active:scale-90 transition-transform"
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                transform: `scale(${f.scale})`,
              }}
            >
              <svg width="22" height="28" viewBox="0 0 22 28">
                {/* Stem */}
                <path d="M11 11 Q15 20, 11 28" fill="none" stroke="#22c55e" strokeWidth="2.5" />
                {/* Leaf */}
                <path d="M11 19Q18 19, 13 15Z" fill="#15803d" />
                {/* Flower circle petals */}
                <circle cx="11" cy="10" r="4.5" fill={f.color} />
                <circle cx="6" cy="10" r="4" fill={f.color} opacity="0.9" />
                <circle cx="16" cy="10" r="4" fill={f.color} opacity="0.9" />
                <circle cx="11" cy="5" r="4" fill={f.color} opacity="0.9" />
                <circle cx="11" cy="15" r="4" fill={f.color} opacity="0.9" />
                {/* Core */}
                <circle cx="11" cy="10" r="2.8" fill="#fcd34d" />
              </svg>
            </div>
          ))}

          {/* DROPPED ITEMS/TREATS FEEDERS LAYER */}
          <AnimatePresence>
            {droppedTreats.map((treat) => (
              <motion.div
                key={treat.id}
                initial={{ y: -60, x: treat.x + '%', opacity: 0 }}
                animate={{ y: 0, x: treat.x + '%', opacity: 1, rotate: 360 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
                className="absolute text-xl pointer-events-none select-none z-10"
                style={{
                  top: `${treat.y - 4}%`,
                  left: `calc(${treat.x}% - 10px)`
                }}
              >
                {treat.type === 'cookie' ? '🍪' : treat.type === 'apple' ? '🍎' : '🍬'}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* LIVE PET ENTITIES ROAMING AROUND */}
          {petEntities.filter(p => showAllPets ? true : p.memberId === activeMemberId).map((pet) => {
            const isEscaping = pet.status === 'escaping';
            const isEating = pet.status === 'eating';
            
            return (
              <div
                key={pet.memberId}
                className="absolute z-30 transition-all duration-150 select-none cursor-pointer group"
                style={{
                  left: `${pet.x}%`,
                  top: `${pet.y}%`,
                  transform: `translate(-25px, -35px)` // offset center coordinates
                }}
              >
                {/* Interactive Speech Bubbles (Over pet's head, animated in/out) */}
                <AnimatePresence>
                  {pet.bubbleText && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: -2 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      className="absolute bottom-[48px] left-[50%] -translate-x-1/2 bg-white/94 border-2 border-stone-200 text-[10px] font-black text-stone-700 px-3 py-2 rounded-2xl shadow-md w-[140px] text-center select-none leading-relaxed min-w-[124px] pointer-events-none z-40 filter backdrop-blur-xs"
                    >
                      {/* Triangle accent anchor */}
                      <div className="absolute top-[100%] left-[50%] -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-stone-200" />
                      <div className="absolute top-[96%] left-[50%] -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-white" />
                      
                      <span>{pet.bubbleText}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sibling ownership indicator mini pill */}
                <span className="absolute bottom-[-18px] left-[50%] -translate-x-1/2 bg-stone-900/75 border border-white/10 text-[8px] text-white font-mono font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap opacity-65 group-hover:opacity-100 transition-opacity flex items-center gap-1 select-none pointer-events-none">
                  <span>{pet.avatar} {pet.name}</span>
                </span>

                {/* Animated Pet SVGs Wrapper */}
                <motion.div
                  animate={
                    isEating
                      ? { scaleY: [1, 0.84, 1.05, 1], rotate: [0, 6, -6, 0] }
                      : isEscaping
                      ? { y: [0, -8, 0, -8, 0], scaleY: [1, 1.08, 0.95, 1.08, 1] } // running bounce
                      : pet.status === 'walking'
                      ? { rotate: [-2, 2, -2], y: [0, -2.5, 0] }
                      : { scaleY: [1, 0.97, 1.01, 1] } // idle breathing
                  }
                  transition={{
                    duration: isEating ? 0.45 : isEscaping ? 0.4 : pet.status === 'walking' ? 0.35 : 3.0,
                    repeat: Infinity,
                  }}
                  style={{
                    transform: `scaleX(${pet.flip ? -1 : 1})`,
                    display: 'block'
                  }}
                  className="w-12 h-12 relative flex items-center justify-center filter drop-shadow-[0_5px_6px_rgba(0,0,0,0.15)]"
                >
                  <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                    {/* Base mini animal vector body */}
                    {renderMiniPetBody(pet.animalType, pet.status)}
                    
                    {/* Active accessory wardrobe item overlaid */}
                    {renderAccessoryOverlay(pet.accessory)}
                  </svg>
                </motion.div>

              </div>
            );
          })}

          {/* Click to plant notification signpost on grass */}
          <div className="absolute left-[38%] top-[12%] text-center pointer-events-none select-none hidden sm:block opacity-45">
            <p className="text-[10px] font-bold text-stone-500 bg-white/70 backdrop-blur-xs px-3 py-1 rounded-full border border-stone-150 shadow-xs flex items-center gap-1">
              🍪 点击草坪空地，可以投下美味小饼干引出宠物哦！
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
