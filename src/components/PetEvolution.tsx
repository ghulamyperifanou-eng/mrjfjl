import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PetState, AnimalType } from '../types';
import { Sparkles, Heart, Edit2, Check, Moon, Sun, Award, Wand2 } from 'lucide-react';
import { playWiggleSound, playEatSound, playLevelUpSound } from '../utils/audio';

interface PetEvolutionProps {
  petState: PetState;
  memberPoints: number;
  onChangePetState: (updated: Partial<PetState>) => void;
  onAddLog: (type: 'reward' | 'deduct' | 'level_up' | 'redeem' | 'custom_penalty' | 'pet_grow', title: string, change: number) => void;
  onDeductPoints: (amount: number, reason: string) => boolean;
}

export const PetEvolution: React.FC<PetEvolutionProps> = ({
  petState,
  memberPoints,
  onChangePetState,
  onAddLog,
  onDeductPoints,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(petState.name);
  const [showConfig, setShowConfig] = useState(false);
  const [configTab, setConfigTab] = useState<'species' | 'wardrobe'>('wardrobe');
  const [showHearts, setShowHearts] = useState<number[]>([]);
  const [fallingFoods, setFallingFoods] = useState<{ id: number; type: 'milk' | 'cake' | 'star' | 'ball' | 'bath' }[]>([]);

  // Get stage titles based on Level
  const getStageTitle = (level: number) => {
    if (level === 1) return { name: '🍼 软萌幼崽 (Baby)', style: 'text-sky-500 bg-sky-50 border-sky-100' };
    if (level === 2) return { name: '🎒 幼年期 (Kid)', style: 'text-emerald-500 bg-emerald-50 border-emerald-100' };
    if (level === 3) return { name: '⚡ 灵动期 (Teen)', style: 'text-amber-500 bg-amber-50 border-amber-100' };
    if (level === 4) return { name: '👑 成年期 (Adult)', style: 'text-purple-500 bg-purple-50 border-purple-100' };
    return { name: '🌌 守护灵兽 (Guardian)', style: 'text-rose-500 bg-rose-50 border-rose-100 animate-pulse' };
  };

  const currentStageInfo = getStageTitle(petState.level);

  const handlePetClick = () => {
    if (petState.status === 'sleeping') {
      onChangePetState({ status: 'idle' });
      onAddLog('pet_grow', `唤醒了 ${petState.name}`, 0);
      playWiggleSound();
      return;
    }

    playWiggleSound();
    const id = Date.now();
    setShowHearts((prev) => [...prev, id]);
    setTimeout(() => {
      setShowHearts((prev) => prev.filter((h) => h !== id));
    }, 1200);

    onChangePetState({ status: 'happy' });
    setTimeout(() => {
      onChangePetState({ status: 'idle' });
    }, 1500);
  };

  // Interactive Feeding/Playing System - Now entirely FREE (no point deduction!), consuming a Play Pass instead.
  const handleFeedOrPlay = (type: 'milk' | 'cake' | 'star' | 'ball' | 'bath') => {
    if (petState.status === 'sleeping') return;

    const currentPasses = petState.playPasses !== undefined ? petState.playPasses : 5;
    if (currentPasses <= 0) {
      alert(`【互动次数不足】${petState.name} 现在想歇会儿啦～\n\n小雅/小航宝，快去完成「每日任务」或启动「专注时钟」吧！\n完成任何一项任务或专注，都能自动赠送 3 次免费逗玩/洗澡/喂食次数哦！❤️`);
      return;
    }

    let expWeight = 5;
    let actionChinese = '喂牛奶';
    let foodIcon = '🍼';

    if (type === 'cake') {
      expWeight = 15;
      actionChinese = '喂精致小蛋糕';
      foodIcon = '🍰';
    } else if (type === 'star') {
      expWeight = 10;
      actionChinese = '喂魔力星星糖';
      foodIcon = '⭐';
    } else if (type === 'ball') {
      expWeight = 8;
      actionChinese = '陪玩橡皮球';
      foodIcon = '⚽';
    } else if (type === 'bath') {
      expWeight = 12;
      actionChinese = '泡泡清洗洗澡';
      foodIcon = '🧼';
    }

    // Trigger feeding animations & sounds
    playEatSound();
    onChangePetState({ status: type === 'ball' || type === 'bath' ? 'happy' : 'eating' });

    const foodId = Date.now();
    setFallingFoods((prev) => [...prev, { id: foodId, type }]);

    // Calculate Growth/Experience points increase
    setTimeout(() => {
      setFallingFoods((prev) => prev.filter((f) => f.id !== foodId));
      
      let nextExperience = petState.experience + expWeight;
      let currentLevel = petState.level;
      let nextLevelExp = petState.nextLevelExp;
      let triggerLevelUp = false;

      // Handle continuous level up logic
      while (nextExperience >= nextLevelExp) {
        nextExperience -= nextLevelExp;
        currentLevel += 1;
        nextLevelExp = currentLevel === 1 ? 40 : currentLevel === 2 ? 100 : currentLevel === 3 ? 200 : currentLevel === 4 ? 400 : currentLevel * 150;
        triggerLevelUp = true;
      }

      if (triggerLevelUp) {
        playLevelUpSound();
        onChangePetState({
          level: currentLevel,
          experience: nextExperience,
          nextLevelExp: nextLevelExp,
          totalFedTimes: petState.totalFedTimes + 1,
          status: 'happy',
          playPasses: currentPasses - 1
        });
        onAddLog('level_up', `🎉 太棒啦！${petState.name} 升级啦！成长为 [LV.${currentLevel} • ${getStageTitle(currentLevel).name}]！(花费 0 积分 • 消耗 1 次互动数)`, 0);
      } else {
        onChangePetState({
          experience: nextExperience,
          totalFedTimes: petState.totalFedTimes + 1,
          status: 'happy',
          playPasses: currentPasses - 1
        });
        onAddLog('pet_grow', `${petState.name} 体验了免费 [${foodIcon} ${actionChinese}]，经验值 +${expWeight} EXP (消耗 1 次互动，剩余 ${currentPasses - 1} 次)`, 0);
      }

      setTimeout(() => {
        onChangePetState({ status: 'idle' });
      }, 1500);

    }, 900);
  };

  const handleSaveName = () => {
    if (newName.trim()) {
      onChangePetState({ name: newName.trim() });
      setIsEditingName(false);
      onAddLog('pet_grow', `给宠物改名为: ${newName.trim()}`, 0);
    }
  };

  // Change animal type
  const handleSelectAnimalType = (type: AnimalType) => {
    onChangePetState({ animalType: type });
    onAddLog('pet_grow', `将宠物变身更换为: ${type === 'cat' ? '喵喵猫咪' : type === 'dog' ? '旺旺狗狗' : type === 'panda' ? '圆滚熊猫' : '乖乖兔子'}`, 0);
    playWiggleSound();
  };

  const WARDROBES = [
    { id: 'none', name: '自然本真萌', icon: '🐾', minLevel: 1, desc: '不戴任何挂饰，重温最本真的可爱' },
    { id: 'glasses', name: '聪慧小黑镜', icon: '👓', minLevel: 1, desc: '博学大黑框眼镜，智慧气息拉满' },
    { id: 'bowtie', name: '绅士红领结', icon: '🎀', minLevel: 2, desc: '挺阔拉风英伦红领结，帅气小绅士' },
    { id: 'scarf', name: '暖心红围巾', icon: '🧣', minLevel: 2, desc: '蓬松红条纹围巾，保持常温好乖巧' },
    { id: 'explorer_goggles', name: '冒险拉风镜', icon: '🥽', minLevel: 3, desc: '拉风蒸汽朋克飞行镜，向高空启航' },
    { id: 'magic_hat', name: '奇迹巫师帽', icon: '🎩', minLevel: 3, desc: '紫夜魔法帽，顶端环绕着晶莹的星辰' },
    { id: 'gold_crown', name: '至臻黄金冠', icon: '👑', minLevel: 4, desc: '熠熠生辉黄金顶冠，等级大师的象征' },
    { id: 'angel_wings', name: '天使圣洁翼', icon: '🧚', minLevel: 4, desc: '泛着粉兰晶莹浮光的羽翼，自由自在' }
  ];

  const handleSelectAccessory = (id: string, name: string) => {
    onChangePetState({ accessory: id });
    onAddLog('pet_grow', `${petState.name} 穿戴了换装衣装: 【${name}】！👗`, 0);
    playWiggleSound();
  };

  const renderAccessoryOverlayLarge = (accessory: string) => {
    const isDog = petState.animalType === 'dog';
    const headY = isDog ? 58 : 62;
    
    switch (accessory) {
      case 'glasses':
        return (
          <g transform={`translate(48, ${headY - 14})`} stroke="#1e293b" strokeWidth="3.2" fill="none" filter="url(#shadow3d)">
            <circle cx="11" cy="11" r="10" fill="white" fillOpacity="0.15" />
            <circle cx="41" cy="11" r="10" fill="white" fillOpacity="0.15" />
            <line x1="21" y1="11" x2="31" y2="11" strokeWidth="4.5" />
            <line x1="1" y1="11" x2="4" y2="9" />
            <line x1="51" y1="11" x2="48" y2="9" />
          </g>
        );
      case 'magic_hat':
        return (
          <g transform={`translate(38, ${headY - 86})`} stroke="#4c1d95" strokeWidth="1.5" fill="#5b21b6" filter="url(#shadow3d)">
            <path d="M6 56L37 -4L68 56Z" />
            <ellipse cx="37" cy="56" rx="42" ry="9" stroke="#701a75" fill="#8b5cf6" />
            <polygon points="37,-16 41,-6 51,-6 43,1 46,11 37,5 28,11 31,1 23,-6 33,-6" fill="#facc15" stroke="#d97706" strokeWidth="1" />
          </g>
        );
      case 'bowtie':
        return (
          <g transform="translate(48, 80)" fill="#ef4444" stroke="#991b1b" strokeWidth="2.5" filter="url(#shadow3d)">
            <path d="M2 1L22 13L2 25Z" />
            <path d="M52 1L32 13L52 25Z" />
            <circle cx="27" cy="13" r="8" fill="#fca5a5" />
          </g>
        );
      case 'scarf':
        return (
          <g transform="translate(36, 78)" filter="url(#shadow3d)">
            <path d="M6 3 C22 13, 52 13, 68 3 C74 13, 64 22, 37 22 C10 22, 2 13, 6 3Z" fill="#ea580c" stroke="#9a3412" strokeWidth="1.5" />
            <path d="M24 18L18 42" stroke="#facc15" strokeWidth="10" strokeLinecap="round" />
            <path d="M42 18L48 48" stroke="#ea580c" strokeWidth="11" strokeLinecap="round" />
          </g>
        );
      case 'gold_crown':
        return (
          <g transform={`translate(38, ${headY - 76})`} filter="url(#shadow3d)">
            <path d="M6 46L14 14L37 32L60 14L68 46Z" fill="url(#goldBell3d)" stroke="#92400e" strokeWidth="1.5" />
            <circle cx="14" cy="10" r="4.5" fill="#fef08a" stroke="#b45309" strokeWidth="1" />
            <circle cx="37" cy="27" r="4.5" fill="#fef08a" stroke="#b45309" strokeWidth="1" />
            <circle cx="60" cy="10" r="4.5" fill="#fef08a" stroke="#b45309" strokeWidth="1" />
            <line x1="8" y1="46" x2="66" y2="46" stroke="#92400e" strokeWidth="2.5" />
          </g>
        );
      case 'explorer_goggles':
        return (
          <g transform={`translate(42, ${headY - 26})`} stroke="#451a03" strokeWidth="4" fill="none" filter="url(#shadow3d)">
            <rect x="12" y="6" width="18" height="15" rx="5" fill="#bae6fd" stroke="#451a03" strokeWidth="3" />
            <rect x="36" y="6" width="18" height="15" rx="5" fill="#bae6fd" stroke="#451a03" strokeWidth="3" />
            <line x1="30" y1="13.5" x2="36" y2="13.5" strokeWidth="5" />
            <line x1="0" y1="13.5" x2="12" y2="13.5" strokeWidth="2.5" />
            <line x1="54" y1="13.5" x2="66" y2="13.5" strokeWidth="2.5" />
          </g>
        );
      case 'angel_wings':
        return (
          <g transform="translate(-16, 68)" opacity="0.9" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="2.5" filter="url(#shadow3d)">
            <path d="M12 25 C-12 -5, -35 25, -2 60 C-15 40, -10 20, 12 25Z" fill="#f0f9ff" />
            <g transform="translate(182, 0) scale(-1, 1)">
              <path d="M12 25 C-12 -5, -35 25, -2 60 C-15 40, -10 20, 12 25Z" fill="#f0f9ff" />
            </g>
          </g>
        );
      default:
        return null;
    }
  };

  // Custom animal renders with stunning 3D stereoscopic clay/toy effects
  const renderAnimalSVG = () => {
    const isSleeping = petState.status === 'sleeping';
    const isHappy = petState.status === 'happy';
    const isEating = petState.status === 'eating';
    const level = petState.level;

    // Common properties based on level:
    const decorationScale = level >= 4 ? 1.15 : level >= 3 ? 1.05 : 0.95;

    // Shared 3D definition headers
    const sharedDefs = (
      <defs>
        {/* Soft 3D drop shadows */}
        <filter id="shadow3d" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="7" stdDeviation="3.5" floodColor="#0F172A" floodOpacity="0.16" />
        </filter>
        <filter id="cheekBlush" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
        
        {/* Cat radial lighting */}
        <radialGradient id="catBody3d" cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
          <stop offset="0%" stopColor="#FFFCED" />
          <stop offset="25%" stopColor="#FFDCA8" />
          <stop offset="85%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#C2410C" />
        </radialGradient>
        <radialGradient id="catTummy3d" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#FFE7C4" />
          <stop offset="100%" stopColor="#FFD6A1" />
        </radialGradient>
        
        {/* Dog radial lighting */}
        <radialGradient id="dogBody3d" cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
          <stop offset="0%" stopColor="#FFFEEA" />
          <stop offset="30%" stopColor="#FCD34D" />
          <stop offset="85%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </radialGradient>
        <radialGradient id="dogTummy3d" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FCD34D" />
        </radialGradient>
        
        {/* Panda radial lighting */}
        <radialGradient id="pandaWhite3d" cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#F1F5F9" />
          <stop offset="90%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </radialGradient>
        <radialGradient id="pandaDark3d" cx="30%" cy="30%" r="70%" fx="25%" fy="25%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="45%" stopColor="#334155" />
          <stop offset="85%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </radialGradient>
        
        {/* Rabbit radial lighting */}
        <radialGradient id="rabbitBody3d" cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#FAE8FF" />
          <stop offset="85%" stopColor="#E0F2FE" /> {/* subtle spectrum reflection */}
          <stop offset="100%" stopColor="#D946EF" />
        </radialGradient>
        <radialGradient id="rabbitPink3d" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFF1F2" />
          <stop offset="70%" stopColor="#FCE7F3" />
          <stop offset="100%" stopColor="#F472B6" />
        </radialGradient>
        <radialGradient id="innerEar3d" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFF1F2" />
          <stop offset="100%" stopColor="#FDA4AF" />
        </radialGradient>

        {/* Accessory metal look */}
        <radialGradient id="goldBell3d" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="65%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#A16207" />
        </radialGradient>
        <radialGradient id="redCollar3d" cx="50%" cy="50%" r="100%">
          <stop offset="0%" stopColor="#FCA5A5" />
          <stop offset="100%" stopColor="#DC2626" />
        </radialGradient>
      </defs>
    );

    switch (petState.animalType) {
      case 'cat':
        return (
          <svg width="150" height="150" viewBox="0 0 150 150" fill="none" className="transform origin-bottom" style={{ transform: `scale(${decorationScale})` }}>
            {sharedDefs}
            
            {/* Ambient Base Shadow */}
            <ellipse cx="75" cy="132" rx="36" ry="7" fill="#0F172A" opacity="0.12" />
            
            {/* Cat Tail with 3D shadow */}
            <motion.path
              animate={{ rotate: isSleeping ? [3, -3, 3] : [-18, 22, -18] }}
              transition={{ repeat: Infinity, duration: isHappy ? 0.35 : 2.2, ease: 'easeInOut' }}
              d="M100 115C118 108 122 84 116 68C111 63 105 73 101 83"
              stroke="url(#catBody3d)" strokeWidth="6" strokeLinecap="round" fill="none"
              className="origin-[100px_110px]"
              filter="url(#shadow3d)"
            />

            {/* Cat Ears (3D Relief) */}
            <g filter="url(#shadow3d)">
              <path d="M42 45L20 12L53 28" fill="url(#catBody3d)" stroke="#F97316" strokeWidth="1.5" />
              <path d="M42 45L31 22L48 33" fill="url(#innerEar3d)" />

              <path d="M108 45L130 12L97 28" fill="url(#catBody3d)" stroke="#F97316" strokeWidth="1.5" />
              <path d="M108 45L119 22L102 33" fill="url(#innerEar3d)" />
            </g>

            {/* Body (3D Sphere) */}
            <circle cx="75" cy="98" r="38" fill="url(#catBody3d)" stroke="#EA580C" strokeWidth="1.5" filter="url(#shadow3d)" />
            <ellipse cx="75" cy="107" rx="20" ry="14" fill="url(#catTummy3d)" />

            {/* Head (3D Sphere) */}
            <circle cx="75" cy="62" r="32" fill="url(#catBody3d)" stroke="#EA580C" strokeWidth="1.5" filter="url(#shadow3d)" />

            {/* Specular 3D Gloss Highlight on head & tummy */}
            <ellipse cx="60" cy="46" rx="8" ry="4" fill="white" opacity="0.35" transform="rotate(-15 60 46)" />
            <ellipse cx="64" cy="92" rx="7" ry="2.5" fill="white" opacity="0.25" transform="rotate(-10 64 92)" />

            {/* Whiskers */}
            <path d="M28 62H13M30 68H16" stroke="#C2410C" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
            <path d="M122 62H137M120 68H134" stroke="#C2410C" strokeWidth="3" strokeLinecap="round" opacity="0.75" />

            {/* Level Accessory */}
            {level >= 2 && (
              // 3D Collar
              <path d="M49 83Q75 92 101 83" stroke="url(#redCollar3d)" strokeWidth="6" strokeLinecap="round" fill="none" filter="url(#shadow3d)" />
            )}
            {level >= 3 && (
              // Golden bell with 3D shimmer
              <circle cx="75" cy="88" r="7.5" fill="url(#goldBell3d)" stroke="#CA8A04" strokeWidth="1" filter="url(#shadow3d)" />
            )}
            {level >= 4 && (
              // Little Star Crown
              <g transform="translate(60, 12)" filter="url(#shadow3d)">
                <polygon points="15,0 19,8 28,10 21,16 23,25 15,20 7,25 9,16 2,10 11,8" fill="url(#goldBell3d)" stroke="#EA580C" strokeWidth="1" />
              </g>
            )}

            {/* Deep Glass Eyes & Status */}
            {isSleeping ? (
              <>
                <path d="M51 58Q59 64 64 58" stroke="#7C2D12" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M86 58Q91 64 99 58" stroke="#7C2D12" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M72 68L75 70L78 68" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : isEating || isHappy ? (
              <>
                <path d="M50 56C55 50 63 56 63 56" stroke="#9A3412" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M87 56C92 50 100 56 100 56" stroke="#9A3412" strokeWidth="4" strokeLinecap="round" fill="none" />
                {/* 3D Curved Mouth */}
                <path d="M67 67Q75 76 83 67" fill="#FDA4AF" stroke="#7C2D12" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                {/* 3D Beaded Glass Eye */}
                <circle cx="58" cy="58" r="5.5" fill="#2D0601" />
                <circle cx="92" cy="58" r="5.5" fill="#2D0601" />
                {/* Highlights */}
                <circle cx="56.5" cy="56" r="2" fill="white animate-pulse" />
                <circle cx="90.5" cy="56" r="2" fill="white animate-pulse" />
                <circle cx="59.5" cy="59.5" r="0.8" fill="white" />
                <circle cx="93.5" cy="59.5" r="0.8" fill="white" />
                
                {/* Nose / Mouth */}
                <ellipse cx="75" cy="65" rx="3" ry="2" fill="#7C2D12" />
                <path d="M68 68Q75 73 82 68" stroke="#7C2D12" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              </>
            )}

            {/* Glowing Volumetric Cheek Blushes */}
            <circle cx="44" cy="67" r="5" fill="#EF4444" opacity="0.35" filter="url(#cheekBlush)" />
            <circle cx="106" cy="67" r="5" fill="#EF4444" opacity="0.35" filter="url(#cheekBlush)" />

            {/* Active Wardrobe Dress-up accessory item rendered on top */}
            {renderAccessoryOverlayLarge(petState.accessory || 'none')}
          </svg>
        );

      case 'dog':
        return (
          <svg width="150" height="150" viewBox="0 0 150 150" fill="none" className="transform origin-bottom" style={{ transform: `scale(${decorationScale})` }}>
            {sharedDefs}
            
            {/* Ambient Ground Shadow */}
            <ellipse cx="75" cy="132" rx="36" ry="7" fill="#0F172A" opacity="0.12" />

            {/* Wagging Tail with 3D shadow */}
            <motion.path
              animate={{ rotate: isSleeping ? [2, -2, 2] : [-22, 22, -22] }}
              transition={{ repeat: Infinity, duration: isHappy ? 0.28 : 2, ease: 'easeInOut' }}
              d="M103 112C123 108 129 82 122 70C117 65 111 74 107 84"
              stroke="url(#dogBody3d)" strokeWidth="7" strokeLinecap="round" fill="none"
              className="origin-[103px_110px]"
              filter="url(#shadow3d)"
            />

            {/* Floppy 3D overlapping Ears */}
            <motion.path
              animate={{ rotate: isHappy ? [-8, 8, -8] : [0, 0] }}
              transition={{ repeat: Infinity, duration: 0.9 }}
              d="M32 35C20 35 10 52 16 75C20 85 33 83 35 58Z" fill="url(#dogBody3d)" stroke="#92400E" strokeWidth="1" filter="url(#shadow3d)"
            />
            <motion.path
              animate={{ rotate: isHappy ? [8, -8, 8] : [0, 0] }}
              transition={{ repeat: Infinity, duration: 0.9 }}
              d="M118 35C130 35 140 52 134 75C130 85 117 83 115 58Z" fill="url(#dogBody3d)" stroke="#92400E" strokeWidth="1" filter="url(#shadow3d)"
            />

            {/* Body (3D sphere) */}
            <circle cx="75" cy="98" r="38" fill="url(#dogBody3d)" stroke="#B45309" strokeWidth="1.5" filter="url(#shadow3d)" />
            <circle cx="75" cy="103" r="16" fill="url(#dogTummy3d)" />

            {/* Head (3D sphere) */}
            <circle cx="75" cy="58" r="32" fill="url(#dogBody3d)" stroke="#B45309" strokeWidth="1.5" filter="url(#shadow3d)" />

            {/* Specular highlights for 3D visual shine */}
            <ellipse cx="60" cy="42" rx="8" ry="4" fill="white" opacity="0.32" transform="rotate(-15 60 42)" />
            <ellipse cx="63" cy="91" rx="6" ry="2.5" fill="white" opacity="0.25" transform="rotate(-12 63 91)" />

            {/* Chubby Snout area with 3D gradient */}
            <ellipse cx="75" cy="68" rx="14" ry="10" fill="url(#dogTummy3d)" stroke="#B45309" strokeWidth="1" />
            <polygon points="75,65 70,61 80,61" fill="#451A03" filter="url(#shadow3d)" />

            {/* Accessories */}
            {level >= 2 && (
              // Green 3D Collar
              <path d="M49 81Q75 90 101 81" stroke="#10B981" strokeWidth="6" strokeLinecap="round" fill="none" filter="url(#shadow3d)" />
            )}
            {level >= 3 && (
              // Shimmer gold Bone badge
              <path d="M68 86H82M66 84C66 81 70 81 70 84M66 88C66 91 70 91 70 88M84 84C84 81 88 81 88 84M84 88C84 91 88 91 88 88" stroke="url(#goldBell3d)" strokeWidth="3.5" strokeLinecap="round" filter="url(#shadow3d)" />
            )}
            {level >= 4 && (
              // King crown
              <path d="M60 20L66 30L75 22L84 30L90 20L84 36H66L60 20Z" fill="url(#goldBell3d)" stroke="#B45309" strokeWidth="1.5" filter="url(#shadow3d)" />
            )}

            {/* Eye beads & face status */}
            {isSleeping ? (
              <>
                <path d="M49 53Q56 59 62 53" stroke="#451A03" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M88 53Q95 59 101 53" stroke="#451A03" strokeWidth="4" strokeLinecap="round" fill="none" />
              </>
            ) : isEating || isHappy ? (
              <>
                <path d="M47 53Q55 45 62 53" stroke="#451A03" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M88 53Q96 45 103 53" stroke="#451A03" strokeWidth="4" strokeLinecap="round" fill="none" />
                {/* Panting tongue with shadow */}
                <path d="M71 70V79C71 84 79 84 79 79V70" fill="#F43F5E" stroke="#92400E" strokeWidth="1.5" filter="url(#shadow3d)" />
              </>
            ) : (
              <>
                <circle cx="55" cy="51" r="5.5" fill="#3B1E04" />
                <circle cx="95" cy="51" r="5.5" fill="#3B1E04" />
                <circle cx="53" cy="49" r="2" fill="white" />
                <circle cx="93" cy="49" r="2" fill="white" />
                <circle cx="56.5" cy="52.5" r="0.8" fill="white" />
                <circle cx="96.5" cy="52.5" r="0.8" fill="white" />
                <path d="M72 72Q75 75 78 72" stroke="#451A03" strokeWidth="3" strokeLinecap="round" fill="none" />
              </>
            )}

            {/* Glow Cheek blush */}
            <circle cx="41" cy="63" r="5" fill="#FDA4AF" opacity="0.6" filter="url(#cheekBlush)" />
            <circle cx="109" cy="63" r="5" fill="#FDA4AF" opacity="0.6" filter="url(#cheekBlush)" />

            {/* Active Wardrobe Dress-up accessory item rendered on top */}
            {renderAccessoryOverlayLarge(petState.accessory || 'none')}
          </svg>
        );

      case 'panda':
        return (
          <svg width="150" height="150" viewBox="0 0 150 150" fill="none" className="transform origin-bottom" style={{ transform: `scale(${decorationScale})` }}>
            {sharedDefs}
            
            {/* Ambient Ground Shadow */}
            <ellipse cx="75" cy="132" rx="36" ry="7" fill="#0F172A" opacity="0.14" />

            {/* Dark 3D Bamboo nodes */}
            <g opacity="0.32" filter="url(#shadow3d)">
              <rect x="25" y="10" width="8" height="120" rx="2" fill="url(#goldBell3d)" />
              <path d="M25 40Q35 35 42 42" stroke="#4D7C0F" strokeWidth="3" />
              <path d="M25 80Q15 75 8 82" stroke="#4D7C0F" strokeWidth="3" />
            </g>

            {/* Large Volumetric 3D Ears */}
            <circle cx="44" cy="38" r="15.5" fill="url(#pandaDark3d)" stroke="#1E293B" strokeWidth="1.5" filter="url(#shadow3d)" />
            <circle cx="106" cy="38" r="15.5" fill="url(#pandaDark3d)" stroke="#1E293B" strokeWidth="1.5" filter="url(#shadow3d)" />

            {/* Body (volumetric white/dark sphere) */}
            <circle cx="75" cy="98" r="38" fill="url(#pandaDark3d)" stroke="#0F172A" strokeWidth="1.5" filter="url(#shadow3d)" />
            <ellipse cx="75" cy="101" rx="24" ry="20" fill="url(#pandaWhite3d)" stroke="#0F172A" strokeWidth="1" />

            {/* Head (3D sphere white glass) */}
            <circle cx="75" cy="62" r="32" fill="url(#pandaWhite3d)" stroke="#475569" strokeWidth="1.5" filter="url(#shadow3d)" />

            {/* Specular gloss for 3D finish */}
            <ellipse cx="60" cy="46" rx="8" ry="4" fill="white" opacity="0.4" transform="rotate(-15 60 46)" />
            <ellipse cx="62" cy="90" rx="7" ry="3" fill="white" opacity="0.3" transform="rotate(-10 62 90)" />

            {/* Dark Eye-Patches */}
            <ellipse cx="58" cy="60" rx="9" ry="11.5" fill="url(#pandaDark3d)" transform="rotate(-15 58 60)" />
            <ellipse cx="92" cy="60" rx="9" ry="11.5" fill="url(#pandaDark3d)" transform="rotate(15 92 60)" />

            {/* Level upgrades */}
            {level >= 2 && (
              // 3D cozy Scarf
              <path d="M48 81L75 92L102 81" stroke="url(#redCollar3d)" strokeWidth="7" strokeLinecap="round" filter="url(#shadow3d)" />
            )}
            {level >= 3 && (
              // Fresh green volumetric bamboo stick
              <path d="M100 95L122 72" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" filter="url(#shadow3d)" />
            )}
            {level >= 4 && (
              // 3D Imperial Gold Crown
              <g transform="translate(62, 11)" filter="url(#shadow3d)">
                <polygon points="12,0 16,8 24,10 18,15 20,23 12,18 4,23 6,15 0,10 8,8" fill="url(#goldBell3d)" stroke="#D97706" strokeWidth="1" />
              </g>
            )}

            {/* Nose, mouth and express beads */}
            <ellipse cx="75" cy="66" rx="5.5" fill="#0F172A" />

            {isSleeping ? (
              <>
                <circle cx="58" cy="60" r="3" fill="white" opacity="0.32" />
                <circle cx="92" cy="60" r="3" fill="white" opacity="0.32" />
                <path d="M71 72Q75 75 79 72" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : isEating || isHappy ? (
              <>
                <path d="M53 58L61 63" stroke="white" strokeWidth="3" strokeLinecap="round" />
                <path d="M97 58L89 63" stroke="white" strokeWidth="3" strokeLinecap="round" />
                <path d="M67 70C67 78 83 78 83 70" fill="#FDA4AF" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
              </>
            ) : (
              <>
                <circle cx="58" cy="58" r="3.5" fill="white" />
                <circle cx="92" cy="58" r="3.5" fill="white" />
                <circle cx="57" cy="57" r="1.5" fill="#0F172A" />
                <circle cx="91" cy="57" r="1.5" fill="#0F172A" />
                <path d="M71 71Q75 74 79 71" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
              </>
            )}

            {/* Ambient cheek blush glow */}
            <circle cx="43" cy="72" r="4.5" fill="#F43F5E" opacity="0.32" filter="url(#cheekBlush)" />
            <circle cx="107" cy="72" r="4.5" fill="#F43F5E" opacity="0.32" filter="url(#cheekBlush)" />

            {/* Active Wardrobe Dress-up accessory item rendered on top */}
            {renderAccessoryOverlayLarge(petState.accessory || 'none')}
          </svg>
        );

      case 'rabbit':
        return (
          <svg width="150" height="150" viewBox="0 0 150 150" fill="none" className="transform origin-bottom" style={{ transform: `scale(${decorationScale})` }}>
            {sharedDefs}
            
            {/* Soft Ambient Ground Shadow */}
            <ellipse cx="75" cy="132" rx="36" ry="7" fill="#0F172A" opacity="0.1" />

            {/* Long 3D twitching bunny Ears */}
            <motion.g
              animate={{ rotate: isSleeping ? [-3, 3, -3] : isHappy ? [-14, 14, -14] : [-4, 4, -4] }}
              transition={{ repeat: Infinity, duration: isHappy ? 0.38 : 2.1, ease: 'easeInOut' }}
              className="origin-[50px_45px]"
              filter="url(#shadow3d)"
            >
              <rect x="36" y="5" width="15" height="46" rx="7.5" fill="url(#rabbitBody3d)" stroke="#F472B6" strokeWidth="1" />
              <rect x="40" y="10" width="7" height="33" rx="3.5" fill="url(#innerEar3d)" />
            </motion.g>

            <motion.g
              animate={{ rotate: isSleeping ? [3, -3, 3] : isHappy ? [14, -14, 14] : [4, -4, 4] }}
              transition={{ repeat: Infinity, duration: isHappy ? 0.38 : 2.1, ease: 'easeInOut' }}
              className="origin-[100px_45px]"
              filter="url(#shadow3d)"
            >
              <rect x="100" y="5" width="14" height="46" rx="7" fill="url(#rabbitBody3d)" stroke="#F472B6" strokeWidth="1" />
              <rect x="104" y="10" width="6" height="33" rx="3" fill="url(#innerEar3d)" />
            </motion.g>

            {/* Body (3D white/purple sphere) */}
            <circle cx="75" cy="98" r="38" fill="url(#rabbitBody3d)" stroke="#E879F9" strokeWidth="1" filter="url(#shadow3d)" />
            <ellipse cx="75" cy="108" rx="16" ry="10" fill="url(#rabbitPink3d)" />

            {/* Fluffy tail on left side */}
            <circle cx="34" cy="110" r="10.5" fill="url(#rabbitBody3d)" stroke="#E879F9" strokeWidth="1" filter="url(#shadow3d)" />

            {/* Head (3D white/purple sphere) */}
            <circle cx="75" cy="62" r="32" fill="url(#rabbitBody3d)" stroke="#D946EF" strokeWidth="1" filter="url(#shadow3d)" />

            {/* Specular gloss highlights */}
            <ellipse cx="60" cy="46" rx="8" ry="4" fill="white" opacity="0.38" transform="rotate(-15 60 46)" />
            <ellipse cx="63" cy="91" rx="6" ry="2.5" fill="white" opacity="0.25" transform="rotate(-10 63 91)" />

            {/* Accessories */}
            {level >= 2 && (
              // bow-knot tie at collar in 3D
              <path d="M63 79L87 79L75 88Z" fill="#F43F5E" stroke="#9D174D" strokeWidth="1" filter="url(#shadow3d)" />
            )}
            {level >= 3 && (
              // Carrot emblem around collar
              <g transform="translate(71,83)" filter="url(#shadow3d)">
                <path d="M0 0L4 10L8 0C8 0 8 -3 4 -3C0 -3 0 0 0 0Z" fill="#F97316" />
                <path d="M2 -3L4 -6L6 -3" stroke="#22C55E" strokeWidth="1.5" />
              </g>
            )}
            {level >= 4 && (
              // Pink Tiara diadem
              <path d="M58 27L63 35L75 24L87 35L92 27L75 38H58Z" fill="url(#innerEar3d)" stroke="#9D174D" strokeWidth="1" filter="url(#shadow3d)" />
            )}

            {/* Express bunny face & beads */}
            {isSleeping ? (
              <>
                <path d="M51 58Q57 64 63 58" stroke="#701A75" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M87 58Q93 64 99 58" stroke="#701A75" strokeWidth="3" strokeLinecap="round" fill="none" />
                <polygon points="75,67 72,64 78,64" fill="#F472B6" />
              </>
            ) : isEating || isHappy ? (
              <>
                <path d="M49 56C54 50 62 56 62 56" stroke="#701A75" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M88 56C92 50 100 56 100 56" stroke="#701A75" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <ellipse cx="75" cy="65" rx="3" ry="2" fill="#EC4899" />
                <path d="M68 68Q75 75 82 68" stroke="#701A75" strokeWidth="2" strokeLinecap="round" fill="none" />
                <rect x="73.5" y="68.5" width="3" height="3" fill="white" stroke="#701A75" strokeWidth="1" />
              </>
            ) : (
              <>
                <circle cx="56" cy="58" r="5.5" fill="#6B21A8" />
                <circle cx="94" cy="58" r="5.5" fill="#6B21A8" />
                <circle cx="54" cy="56" r="2" fill="white" />
                <circle cx="92" cy="56" r="2" fill="white" />
                <circle cx="57" cy="59" r="0.8" fill="white" />
                <circle cx="95" cy="59" r="0.8" fill="white" />
                
                <ellipse cx="75" cy="66" rx="3" ry="2.2" fill="#EC4899" />
                <path d="M69 70Q75 73 81 70" stroke="#701A75" strokeWidth="3" strokeLinecap="round" fill="none" />
              </>
            )}

            {/* Whiskers */}
            <line x1="38" y1="68" x2="25" y2="68" stroke="#D946EF" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            <line x1="112" y1="68" x2="125" y2="68" stroke="#D946EF" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />

            {/* Fluffy Glow blush */}
            <circle cx="43" cy="68" r="5" fill="#F472B6" opacity="0.5" filter="url(#cheekBlush)" />
            <circle cx="107" cy="68" r="5" fill="#F472B6" opacity="0.5" filter="url(#cheekBlush)" />

            {/* Active Wardrobe Dress-up accessory item rendered on top */}
            {renderAccessoryOverlayLarge(petState.accessory || 'none')}
          </svg>
        );
    }
  };

  return (
    <div id="pet-evolution-card" className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 relative flex flex-col items-center overflow-hidden">
      
      {/* Decorative Stage Banner */}
      <div className="absolute top-4 left-4 z-10">
        <span className={`text-[10px] font-mono font-bold tracking-wide px-3 py-1.5 rounded-full border select-none transition-all shadow-xs ${currentStageInfo.style}`}>
          LV.{petState.level} • {currentStageInfo.name}
        </span>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="p-1.5 rounded-full bg-stone-50 border border-stone-200 hover:border-indigo-400 text-stone-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer shadow-xs"
          title="宠物设置"
        >
          <Wand2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            const nextStatus = petState.status === 'sleeping' ? 'idle' : 'sleeping';
            onChangePetState({ status: nextStatus });
            onAddLog('pet_grow', `${petState.name} ${nextStatus === 'sleeping' ? '进入了梦乡 💤' : '舒适地醒来了 ☀️'}`, 0);
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-xs ${
            petState.status === 'sleeping'
              ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
              : 'bg-stone-50 border-stone-200 hover:border-stone-300 text-stone-600 hover:bg-stone-100'
          }`}
        >
          {petState.status === 'sleeping' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
              <span>唤醒动物</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>让其入睡</span>
            </>
          )}
        </button>
      </div>

      {/* Configuration Drawer with Dual Tabs (Species Selector + Dressing Closet) */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full bg-stone-50 border-2 border-indigo-100 rounded-2xl p-4 mt-10 mb-3 z-10 flex flex-col gap-3 select-none overflow-hidden filter drop-shadow-sm"
          >
            {/* Direct physical pressed style dual tabs config */}
            <div className="flex items-center justify-between border-b border-indigo-50 pb-2 mb-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setConfigTab('species')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border
                    ${configTab === 'species'
                      ? 'bg-indigo-600 text-white border-indigo-700 border-b-[3px]'
                      : 'bg-white text-stone-600 border-stone-200 border-b-[3px] hover:border-b-[2px] hover:translate-y-[1px]'
                    }`}
                >
                  🐾 动物变身
                </button>
                <button
                  onClick={() => setConfigTab('wardrobe')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border
                    ${configTab === 'wardrobe'
                      ? 'bg-indigo-600 text-white border-indigo-700 border-b-[3px]'
                      : 'bg-white text-stone-600 border-stone-200 border-b-[3px] hover:border-b-[2px] hover:translate-y-[1px]'
                    }`}
                >
                  👗 萌宠换装
                </button>
              </div>
              <button 
                onClick={() => setShowConfig(false)} 
                className="text-[10px] text-stone-400 font-extrabold hover:text-indigo-600 cursor-pointer bg-white px-2 py-1 rounded-md border border-stone-150"
              >
                收起面板
              </button>
            </div>

            {/* TAB CONTENT: SPECIES TRANSFORM */}
            {configTab === 'species' && (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] text-stone-400 font-bold">小勇士，你可以随时在四种蠢萌的小动物物种之间进行魔法变身噢！</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { type: 'cat' as const, label: '喵喵猫咪', emoji: '🐱' },
                    { type: 'dog' as const, label: '旺旺狗狗', emoji: '🐶' },
                    { type: 'panda' as const, label: '滚滚熊猫', emoji: '🐼' },
                    { type: 'rabbit' as const, label: '乖乖白兔', emoji: '🐰' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => handleSelectAnimalType(item.type)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer active:scale-95 border-b-[4px]
                        ${petState.animalType === item.type
                          ? 'bg-indigo-50 border-indigo-500 font-black text-indigo-700 scale-95 border-b-[1px] translate-y-[3px]'
                          : 'bg-white hover:bg-stone-50 border-stone-250 text-stone-600 hover:border-b-[2px] hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0'
                        }`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="text-[10px] mt-1 font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: DRESSING CLOSET WARDROBE */}
            {configTab === 'wardrobe' && (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-100/60 p-1 rounded-md mb-0.5 animate-pulse">
                  🧸 升级提升等级可以解锁更华丽的靓丽萌宠换装挂饰！
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WARDROBES.map((item) => {
                    const isLocked = petState.level < item.minLevel;
                    const isEquipped = (petState.accessory || 'none') === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        disabled={isLocked}
                        onClick={() => handleSelectAccessory(item.id, item.name)}
                        className={`flex flex-col items-center p-2 rounded-xl border text-center relative transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed group border-b-[4px]
                          ${isLocked
                            ? 'bg-stone-100 border-stone-200'
                            : isEquipped
                            ? 'bg-amber-50 border-amber-400 font-black text-amber-900 border-b-[1px] translate-y-[3px]'
                            : 'bg-white border-stone-250 text-stone-600 hover:bg-stone-50 hover:border-b-[2px] hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0'
                          }`}
                        title={item.desc}
                      >
                        {/* Lock overlay tag */}
                        {isLocked ? (
                          <span className="absolute top-1 right-1 text-[8px] font-black bg-stone-400 text-white px-1 rounded-full scale-85">
                            🔒 LV.{item.minLevel}
                          </span>
                        ) : isEquipped ? (
                          <span className="absolute top-1 right-1 text-[8px] font-black bg-amber-500 text-stone-900 px-1 rounded-full scale-85">
                            穿着中
                          </span>
                        ) : null}

                        <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                        <span className="text-[10px] mt-1 font-bold">{item.name}</span>
                        <p className="text-[7px] text-stone-450 truncate max-w-full leading-tight font-medium">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Pet Name section */}
      <div className="mt-8 mb-2 flex flex-col items-center">
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="px-3 py-1 border border-stone-200 rounded-lg text-lg font-bold text-center focus:outline-none focus:ring-1 focus:ring-indigo-400 w-36 bg-stone-50"
              maxLength={12}
              autoFocus
            />
            <button
              onClick={handleSaveName}
              className="p-1 rounded bg-green-500 text-white cursor-pointer hover:bg-green-600"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 group">
            <h2 className="text-xl font-extrabold text-stone-800 tracking-tight">{petState.name}</h2>
            <button
              onClick={() => setIsEditingName(true)}
              className="p-1 text-stone-300 hover:text-stone-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer duration-200"
              title="修改昵称"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <p className="text-xs text-stone-400 mt-1 max-w-[280px] text-center leading-relaxed font-medium">
          {petState.animalType === 'cat' && '这是一只喜欢睡午觉和小鱼干的软皮猫咪。'}
          {petState.animalType === 'dog' && '这是一只超级活泼、随时摇尾巴的快乐金毛小狗。'}
          {petState.animalType === 'panda' && '这是一个憨厚好动、最喜欢抱着翠绿竹子的国宝大熊猫。'}
          {petState.animalType === 'rabbit' && '这是一只双耳修长灵敏、最喜欢吃甜脆胡萝卜的温柔白兔。'}
        </p>
      </div>

      {/* Main Interactive Stage Box */}
      <div 
        onClick={handlePetClick}
        className={`w-full max-w-[325px] aspect-square rounded-3xl relative flex items-center justify-center cursor-pointer overflow-hidden group select-none mt-2 shadow-xs transition-all duration-500 ${
          petState.animalType === 'cat'
            ? 'bg-gradient-to-b from-orange-50 to-orange-100/50 border border-orange-50'
            : petState.animalType === 'dog'
            ? 'bg-gradient-to-b from-amber-50 to-amber-100/50 border border-amber-50'
            : petState.animalType === 'panda'
            ? 'bg-gradient-to-b from-slate-100 to-stone-200/50 border border-slate-100'
            : 'bg-gradient-to-b from-fuchsia-50 to-pink-100/50 border border-fuchsia-50'
        }`}
      >
        {/* Sky overlays for sleeping mode */}
        <AnimatePresence>
          {petState.status === 'sleeping' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex flex-col items-end p-4 pointer-events-none z-10"
            >
              <Moon className="w-6 h-6 text-yellow-105 opacity-90 fill-yellow-100" />
              <span className="text-[10px] text-white/50 opacity-80 font-mono absolute bottom-4 left-4 tracking-widest font-bold">SLEEPING...💤</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Hearts Particles */}
        <AnimatePresence>
          {showHearts.map((heartId, idx) => (
            <motion.div
              key={heartId}
              initial={{ opacity: 0, y: 40, scale: 0.5, x: (idx % 2 === 0 ? -30 : 30) }}
              animate={{ opacity: 1, y: -80, scale: 1.2, x: (idx % 2 === 0 ? -55 : 55) }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="absolute text-rose-500 pointer-events-none z-20"
            >
              <Heart className="w-6 h-6 fill-current" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Falling Food Item Animation */}
        <AnimatePresence>
          {fallingFoods.map((food) => (
            <motion.div
              key={food.id}
              initial={{ y: -120, x: 0, rotate: 0 }}
              animate={{ y: 20, rotate: 360 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeIn' }}
              className="absolute text-3xl pointer-events-none z-10"
            >
              {food.type === 'milk' ? '🍼' : food.type === 'cake' ? '🍰' : food.type === 'star' ? '⭐' : food.type === 'ball' ? '⚽' : '🧼🫧'}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Zzz Floatings */}
        {petState.status === 'sleeping' && (
          <div className="absolute top-1/4 left-1/3 text-indigo-300 font-bold pointer-events-none text-xs select-none space-y-1 z-20">
            <motion.div animate={{ y: [0, -15, 0], x: [0, 8, 0], opacity: [0.3, 0.9, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="text-sm font-semibold select-none">Zzz</motion.div>
            <motion.div animate={{ y: [0, -10, 0], x: [0, -5, 0], opacity: [0.1, 0.7, 0.1] }} transition={{ repeat: Infinity, duration: 2.3 }} className="text-xs font-semibold select-none">Zz</motion.div>
          </div>
        )}

        {/* PET VISUAL AREA */}
        <motion.div
          animate={
            petState.status === 'sleeping'
              ? { scaleY: [1, 0.96, 1], scaleX: [1, 1.02, 1], y: [0, 3, 0] }
              : petState.status === 'happy'
              ? { scaleY: [1, 1.14, 0.92, 1.1, 1], y: [0, -22, 0, -8, 0], rotate: [0, -4, 4, -2, 0] }
              : petState.status === 'eating'
              ? { scaleY: [1, 0.9, 1.05, 1], scaleX: [1, 1.1, 0.95, 1], rotate: [0, 3, -3, 0] }
              : { scaleY: [1, 0.97, 1.01, 1], y: [0, 2.5, -0.5, 0] } // breathing
          }
          transition={{
            duration: petState.status === 'sleeping' ? 3.5 : petState.status === 'happy' ? 1.1 : petState.status === 'eating' ? 0.6 : 3.2,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="relative filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.06)]"
        >
          {renderAnimalSVG()}
        </motion.div>
      </div>

      {/* Experience Growth Bar */}
      <div className="w-full mt-5 select-none">
        <div className="flex justify-between items-center text-xs font-mono mb-1.5">
          <span className="text-stone-400 font-bold">PET EXPERT GROWTH GROWTH GROW 兽生成长经验 (EXP)</span>
          <span className="text-stone-600 font-black">
            {petState.experience} / {petState.nextLevelExp} EXP
          </span>
        </div>
        <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden border border-stone-100 p-[1.5px]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((petState.experience / petState.nextLevelExp) * 100, 100)}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`h-full rounded-full bg-gradient-to-r ${
              petState.animalType === 'cat'
                ? 'from-orange-400 via-amber-400 to-yellow-500'
                : petState.animalType === 'dog'
                ? 'from-amber-400 via-orange-400 to-rose-400'
                : petState.animalType === 'panda'
                ? 'from-teal-400 via-sky-400 to-indigo-500'
                : 'from-fuchsia-400 via-pink-400 to-rose-400'
            }`}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-stone-400 font-bold font-mono mt-1">
          <span>LV.{petState.level}</span>
          <span>还需 {(petState.nextLevelExp - petState.experience)} EXP 升级至大世界 LV.{petState.level + 1}</span>
          <span>LV.{petState.level + 1}</span>
        </div>
      </div>

      {/* Interactive Food Buttons (COSTS 0 POINTS, USES FREE PLAY PASSES) */}
      <div className="w-full mt-5 bg-stone-50/70 p-3.5 rounded-2xl border border-stone-100">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-3">
          <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            ✨ 萌宠养成互动区 (免消耗积分 🌸 只做放松娱乐)
          </p>
          <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100/60 px-2.5 py-1 rounded-full flex items-center gap-1 select-none font-mono">
            🔋 剩余互动机会: {petState.playPasses !== undefined ? petState.playPasses : 5} 次
          </span>
        </div>

        <div className="w-full grid grid-cols-2 sm:grid-cols-5 gap-2">
          
          <button
            onClick={() => handleFeedOrPlay('milk')}
            disabled={petState.status === 'sleeping'}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-orange-50 border border-orange-100 hover:bg-orange-100 active:scale-95 transition-all text-center cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed group"
            title="喂香甜热牛奶，+5 EXP (不花积分！)"
          >
            <span className="text-xl group-hover:scale-125 transition-transform duration-200">🍼</span>
            <span className="text-[10px] text-orange-700 font-bold mt-1">喂牛奶</span>
            <span className="text-[8px] text-orange-400 font-mono mt-0.5 font-bold">免费 (+5XP)</span>
          </button>

          <button
            onClick={() => handleFeedOrPlay('cake')}
            disabled={petState.status === 'sleeping'}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 active:scale-95 transition-all text-center cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed group"
            title="喂草莓夹心蛋糕，+15 EXP (不花积分！)"
          >
            <span className="text-xl group-hover:scale-125 transition-transform duration-200">🍰</span>
            <span className="text-[10px] text-amber-700 font-bold mt-1">吃蛋糕</span>
            <span className="text-[8px] text-amber-400 font-mono mt-0.5 font-bold">免费 (+15XP)</span>
          </button>

          <button
            onClick={() => handleFeedOrPlay('bath')}
            disabled={petState.status === 'sleeping'}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-sky-50 border border-sky-100 hover:bg-sky-100 active:scale-95 transition-all text-center cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed group"
            title="泡泡洗澡刷毛，+12 EXP (不花积分！)"
          >
            <span className="text-xl group-hover:scale-125 transition-transform duration-200">🧼</span>
            <span className="text-[10px] text-sky-700 font-bold mt-1">给洗澡</span>
            <span className="text-[8px] text-sky-400 font-mono mt-0.5 font-bold">免费 (+12XP)</span>
          </button>

          <button
            onClick={() => handleFeedOrPlay('star')}
            disabled={petState.status === 'sleeping'}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-yellow-50 border border-yellow-200 hover:bg-yellow-105 active:scale-95 transition-all text-center cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed group"
            title="喂魔力香甜星星糖，+10 EXP (不花积分！)"
          >
            <span className="text-xl group-hover:scale-125 transition-transform duration-200">⭐</span>
            <span className="text-[10px] text-yellow-750 font-bold mt-1">星星糖</span>
            <span className="text-[8px] text-yellow-505 font-mono mt-0.5 font-bold">免费 (+10XP)</span>
          </button>

          <button
            onClick={() => handleFeedOrPlay('ball')}
            disabled={petState.status === 'sleeping'}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-fuchsia-50 border border-fuchsia-100 hover:bg-fuchsia-100 active:scale-95 transition-all text-center cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed group"
            title="抛接球互动嬉戏，+8 EXP (不花积分！)"
          >
            <span className="text-xl group-hover:scale-125 transition-transform duration-200">⚽</span>
            <span className="text-[10px] text-fuchsia-700 font-bold mt-1">抛球玩</span>
            <span className="text-[8px] text-fuchsia-400 font-mono mt-0.5 font-bold">免费 (+8XP)</span>
          </button>

        </div>
      </div>

    </div>
  );
};
