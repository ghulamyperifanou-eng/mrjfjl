import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PetState, ChoreItem, RewardItem, ActionLog, Member, AnimalType } from './types';
import { PetEvolution } from './components/PetEvolution';
import { GardenPlayground } from './components/GardenPlayground';
import { ChoreManager } from './components/ChoreManager';
import { RewardStore } from './components/RewardStore';
import { TimerClock } from './components/TimerClock';
import { ActionHistory } from './components/ActionHistory';
import {
  Trophy,
  RotateCcw,
  Users,
  Plus,
  Sparkles,
  Heart,
  X,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { playLevelUpSound, playRewardSound, playDeductSound } from './utils/audio';

// Default mock chores
const DEFAULT_CHORES: ChoreItem[] = [
  { id: '1', title: '认真刷牙足 3分钟', rewardPoints: 10, category: 'health', icon: '🦷' },
  { id: '2', title: '专注写功课 25分钟', rewardPoints: 25, category: 'study', icon: '📚' },
  { id: '3', title: '独立收拾整理课桌/书架', rewardPoints: 15, category: 'chore', icon: '🧹' },
  { id: '4', title: '按时上床睡觉 (十点前)', rewardPoints: 20, category: 'health', icon: '💤' },
  { id: '5', title: '主动浇花/给植物松土', rewardPoints: 10, category: 'chore', icon: '🌱' },
  { id: '6', title: '主动替家长捶捶背/倒杯水', rewardPoints: 12, category: 'behavior', icon: '💖' },
];

// Default rewards in shop
const DEFAULT_REWARDS: RewardItem[] = [
  { id: 'w1', title: '看高画质动画片 30分钟', costPoints: 40, category: 'recreation', icon: '📺' },
  { id: 'w2', title: '兑换一份美味小冰激凌', costPoints: 30, category: 'snack', icon: '🍦' },
  { id: 'w3', title: '畅玩沙盒或平板游戏 15分钟', costPoints: 50, category: 'recreation', icon: '🎮' },
  { id: 'w4', title: '周末任性免做洗碗卡 1次', costPoints: 80, category: 'pet-play', icon: '🏆' },
  { id: 'w5', title: '自选一件漂亮书本或拼图', costPoints: 200, category: 'pet-play', icon: '🧩' },
  { id: 'w6', title: '选购一款心仪毛绒娃娃或模型', costPoints: 300, category: 'pet-play', icon: '🧸' },
];

const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm1',
    name: '姐姐小雅',
    avatar: '👧',
    points: 120,
    pet: {
      name: '橘宝猫',
      animalType: 'cat',
      level: 1,
      experience: 15,
      nextLevelExp: 40,
      totalFedTimes: 3,
      status: 'idle',
      lastFed: Date.now(),
      playPasses: 5
    }
  },
  {
    id: 'm2',
    name: '弟弟小航',
    avatar: '👦',
    points: 80,
    pet: {
      name: '柴柴狗',
      animalType: 'dog',
      level: 1,
      experience: 10,
      nextLevelExp: 40,
      totalFedTimes: 4,
      status: 'idle',
      lastFed: Date.now(),
      playPasses: 5
    }
  }
];

const INITIAL_LOGS: ActionLog[] = [
  {
    id: 'l-init',
    memberId: 'm1',
    memberName: '姐姐小雅',
    timestamp: Date.now() - 3600000,
    type: 'reward',
    title: '初始化加入积分系统，获得 120 启动元气积分！',
    pointsChange: 120,
    currentTotal: 120,
  },
  {
    id: 'l-init2',
    memberId: 'm2',
    memberName: '弟弟小航',
    timestamp: Date.now(),
    type: 'reward',
    title: '喜入驻多成员金库系统，分配 80 元气积分！',
    pointsChange: 80,
    currentTotal: 80,
  }
];

export default function App() {
  const [members, setMembers] = useState<Member[]>(() => {
    const stored = localStorage.getItem('family_members_v2');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { /* ignore */ }
    }
    return INITIAL_MEMBERS;
  });

  const [activeMemberId, setActiveMemberId] = useState<string>(() => {
    const stored = localStorage.getItem('family_active_member_id_v2');
    if (stored && stored !== 'undefined') {
      return stored;
    }
    return INITIAL_MEMBERS[0].id;
  });

  const [chores, setChores] = useState<ChoreItem[]>(() => {
    const stored = localStorage.getItem('family_pet_chores');
    return stored ? JSON.parse(stored) : DEFAULT_CHORES;
  });

  const [rewards, setRewards] = useState<RewardItem[]>(() => {
    const stored = localStorage.getItem('family_pet_rewards');
    return stored ? JSON.parse(stored) : DEFAULT_REWARDS;
  });

  const [logs, setLogs] = useState<ActionLog[]>(() => {
    const stored = localStorage.getItem('family_pet_logs');
    return stored ? JSON.parse(stored) : INITIAL_LOGS;
  });

  // Adding Custom Member Modal/Dialog Inline state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAvatar, setNewMemberAvatar] = useState('🧒');
  const [newPetName, setNewPetName] = useState('圆滚熊猫');
  const [newAnimalType, setNewAnimalType] = useState<AnimalType>('panda');

  const avatarPreset = ['🧒', '👧', '👦', '👶', '🧑', '👱', '🦊', '🐨', '🐼', '🦄', '🐰', '🦁'];

  // Persist State to Local Storage
  useEffect(() => {
    localStorage.setItem('family_members_v2', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('family_active_member_id_v2', activeMemberId);
  }, [activeMemberId]);

  useEffect(() => {
    localStorage.setItem('family_pet_chores', JSON.stringify(chores));
    localStorage.setItem('family_pet_rewards', JSON.stringify(rewards));
    localStorage.setItem('family_pet_logs', JSON.stringify(logs));
  }, [chores, rewards, logs]);

  // Derived current active member object
  const activeMember = members.find((m) => m.id === activeMemberId) || members[0] || INITIAL_MEMBERS[0];

  const handleSwitchMember = (id: string) => {
    setActiveMemberId(id);
    playRewardSound();
  };

  // Add Member Action Handler
  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newId = `m-${Date.now()}`;
    const initialPet: PetState = {
      name: newPetName.trim() || '大白兔',
      animalType: newAnimalType,
      level: 1,
      experience: 0,
      nextLevelExp: 40,
      totalFedTimes: 0,
      status: 'idle',
      lastFed: Date.now(),
      playPasses: 5,
    };

    const addedMember: Member = {
      id: newId,
      name: newMemberName.trim(),
      avatar: newMemberAvatar,
      points: 100, // Starts with 100 points
      pet: initialPet,
    };

    setMembers((prev) => [...prev, addedMember]);
    setActiveMemberId(newId);

    // Write log entry
    setLogs((prev) => [
      {
        id: `l-c-${Date.now()}`,
        memberId: newId,
        memberName: newMemberName.trim(),
        timestamp: Date.now(),
        type: 'reward',
        title: `欢迎新家庭成员 ${newMemberName.trim()} 加入！获得系统大礼包 100 初始积分并赠送 5 次免费萌宠互动机会！`,
        pointsChange: 100,
        currentTotal: 100,
      },
      ...prev
    ]);

    // Reset Form
    setNewMemberName('');
    setNewPetName('');
    setShowAddMemberModal(false);
    playLevelUpSound();
  };

  // Dynamic Point Reward system helper for active member
  const handleRewardPoints = (amount: number, reason: string) => {
    setMembers((prevMembers) =>
      prevMembers.map((m) => {
        if (m.id === activeMemberId) {
          const updatedPoints = m.points + amount;

          const isTaskOrFocus = reason.includes('任务') || reason.includes('专注') || reason.includes('日常');
          const passesToAward = isTaskOrFocus ? 3 : 1;

          setLogs((pastLogs) => [
            {
              id: `log-${Date.now()}-${Math.random()}`,
              memberId: m.id,
              memberName: m.name,
              timestamp: Date.now(),
              type: 'reward' as const,
              title: `${reason}，恭喜免费充能获得 +${passesToAward} 次逗玩与喂食/洗澡机会！🌸`,
              pointsChange: amount,
              currentTotal: updatedPoints,
            },
            ...pastLogs,
          ]);

          const currentPasses = m.pet.playPasses !== undefined ? m.pet.playPasses : 5;
          return {
            ...m,
            points: updatedPoints,
            pet: {
              ...m.pet,
              playPasses: currentPasses + passesToAward,
            }
          };
        }
        return m;
      })
    );
  };

  // Point Deduct system helper for active member
  const handleDeductPoints = (amount: number, reason: string): boolean => {
    let success = false;
    
    if (activeMember.points < amount) {
      alert(`[余额不足] 对不起 ${activeMember.name} 宝，你当前只有 ${activeMember.points} 积分，不足以兑换 [${reason}] (需要 ${amount} 积分)！请多做家务、专注计时获取积分吧！`);
      return false;
    }

    success = true;
    setMembers((prevMembers) =>
      prevMembers.map((m) => {
        if (m.id === activeMemberId) {
          const updatedPoints = m.points - amount;

          setLogs((pastLogs) => [
            {
              id: `log-${Date.now()}-${Math.random()}`,
              memberId: m.id,
              memberName: m.name,
              timestamp: Date.now(),
              type: 'deduct' as const,
              title: reason,
              pointsChange: -amount,
              currentTotal: updatedPoints,
            },
            ...pastLogs,
          ]);

          return { ...m, points: updatedPoints };
        }
        return m;
      })
    );

    return success;
  };

  // Pet configuration change helper for active member
  const handleSetPetState = (updated: Partial<PetState>) => {
    setMembers((prevMembers) =>
      prevMembers.map((m) => {
        if (m.id === activeMemberId) {
          return {
            ...m,
            pet: {
              ...m.pet,
              ...updated
            }
          };
        }
        return m;
      })
    );
  };

  // Quick Action Log helper (for manual entry logging)
  const handlePostGenericLog = (
    type: ActionLog['type'],
    title: string,
    change: number
  ) => {
    setLogs((prev) => [
      {
        id: `l-${Date.now()}`,
        memberId: activeMember.id,
        memberName: activeMember.name,
        timestamp: Date.now(),
        type,
        title,
        pointsChange: change,
        currentTotal: activeMember.points,
      },
      ...prev,
    ]);
  };

  // Add Custom Habit Chore to shared system
  const handleAddChore = (chore: Omit<ChoreItem, 'id'>) => {
    const newItem: ChoreItem = {
      ...chore,
      id: `c-${Date.now()}`,
    };
    setChores((prev) => [newItem, ...prev]);
    handlePostGenericLog('reward', `新增家庭共享任务: ${chore.title}`, 0);
  };

  const handleDeleteChore = (id: string) => {
    setChores((prev) => prev.filter((c) => c.id !== id));
  };

  // Add Reward store item to shared wall
  const handleAddReward = (reward: Omit<RewardItem, 'id'>) => {
    const newItem: RewardItem = {
      ...reward,
      id: `w-${Date.now()}`,
    };
    setRewards((prev) => [newItem, ...prev]);
    handlePostGenericLog('reward', `新增货架礼品：${reward.title}`, 0);
  };

  const handleDeleteReward = (id: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== id));
  };

  // General clear logs
  const handleClearLogs = () => {
    if (confirm('确认清空所有家庭成员的积分印记与成长日志吗？（积分余额不会受到影响）')) {
      setLogs([]);
    }
  };

  // System Re-genesis reset
  const handleResetSystem = () => {
    if (confirm('⚠️ 警告：您确定要彻底重置家庭积分树系统吗？您自定义添加的所有家庭成员、私房积分，以及共享货架上的个性任务将悉数清零，并恢复初始设定！')) {
      localStorage.clear();
      setMembers(INITIAL_MEMBERS);
      setActiveMemberId(INITIAL_MEMBERS[0].id);
      setChores(DEFAULT_CHORES);
      setRewards(DEFAULT_REWARDS);
      setLogs(INITIAL_LOGS);
    }
  };

  // Gift Treat special trigger: automatically feeds animal with custom animation trigger!
  const handleTriggerEatSpecial = (type: 'apple' | 'cake' | 'star') => {
    handleSetPetState({ status: 'eating' });
    setTimeout(() => {
      handleSetPetState({ status: 'happy' });
      setTimeout(() => {
        handleSetPetState({ status: 'idle' });
      }, 1500);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#FFF0F3] select-none flex flex-col font-sans text-stone-800 antialiased pb-12">
      
      {/* HEADER BANNER */}
      <header className="w-full bg-white/95 border-b-[4px] border-pink-100 py-4 px-4 sm:px-8 shadow-xs sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-400 text-white text-xl rounded-2xl border-b-4 border-pink-600 shadow-sm animate-bounce">
              🌸
            </div>
            <div>
              <h1 className="text-lg font-black text-rose-950 tracking-tight flex items-center gap-2">
                <span>萌宠成长守护乐园 🧸</span>
                <span className="text-[10px] font-extrabold text-white bg-pink-500 rounded-full px-2 py-0.5 shadow-sm">
                  家庭自律版
                </span>
              </h1>
              <p className="text-xs text-pink-600/80 font-bold tracking-wide">
                用健康好作息交换成长爱心，和孩子一起陪伴超萌宠物幸福进化！✨
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetSystem}
              className="flex items-center gap-1.5 text-[10px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 px-3.5 py-1.5 rounded-full border border-rose-200 border-b-[3px] hover:border-b-[1px] hover:translate-y-[2px] active:translate-y-[3px] active:border-b-0 transition-all cursor-pointer"
              title="大清档重建计划"
            >
              <RotateCcw className="w-3 h-3" />
              <span>重置乐园</span>
            </button>
            <span className="text-xs font-mono font-medium text-pink-200">|</span>
            <span className="text-[10px] font-black bg-pink-50 text-pink-600 px-3 py-1.5 rounded-full border border-pink-100 shadow-sm">
              ✨ Adorable Pet Space
            </span>
          </div>

        </div>
      </header>

      {/* MULTIPLE MEMBERS SWITCHER STRIP */}
      <section className="w-full px-4 sm:px-8 mt-6">
        <div className="max-w-7xl mx-auto bg-white/90 border-[3px] border-pink-100 p-5 rounded-[32px] shadow-xs">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-black text-rose-950 flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-pink-500" />
                <span>家庭小成员超级客厅 HUB</span>
              </h3>
              <p className="text-xs text-rose-800/80 font-bold">点击头像切换操作成员（每个宝贝拥有自己独立的自律积分和可爱的动物伙伴）</p>
            </div>

            {/* Quick button to spawn Add Member Modal */}
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="flex items-center gap-1 text-xs font-black text-white bg-pink-400 hover:bg-pink-300 border-pink-600 border-b-[4px] hover:border-b-[2px] hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0 px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>新增家庭子成员</span>
            </button>
          </div>

          {/* Members grid list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {members.map((m) => {
              const isActive = m.id === activeMemberId;
              return (
                <div
                  key={m.id}
                  onClick={() => handleSwitchMember(m.id)}
                  className={`p-3 rounded-[20px] transition-all duration-300 cursor-pointer flex items-center justify-between group border-[3px]
                    ${isActive
                      ? 'border-pink-400 bg-pink-50/90 border-b-[2px] translate-y-[3px]'
                      : 'border-pink-100/40 hover:border-pink-200 bg-white border-b-[5px] hover:border-b-[3px] hover:translate-y-[2px] active:translate-y-[5px] active:border-b-0'
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl shrink-0 p-1.5 rounded-xl bg-pink-50 group-hover:scale-110 transition-transform">
                      {m.avatar}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-rose-950 truncate">{m.name}</p>
                      <p className="text-[10px] font-bold text-pink-500 block mt-0.5">
                        🐾 {m.pet.name} (LV.{m.pet.level})
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs font-mono font-black ${isActive ? 'text-pink-600' : 'text-amber-500'}`}>
                      {m.points}
                    </span>
                    <span className="text-[9px] text-stone-400 font-bold ml-0.5">P</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ADORABLE INLINE MODAL TO ADD MEMBER */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-stone-150 p-6 max-w-md w-full relative"
          >
            <button
              onClick={() => setShowAddMemberModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer text-stone-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-2xl">🎉</span>
              <h3 className="text-base font-black text-stone-850">入驻系统：新增家庭小成员</h3>
            </div>
            <p className="text-xs text-stone-400 tracking-wide font-medium leading-relaxed mb-4">
              为孩子定义一个空间，将奖励他 100 初始积分和初始的宠物。在上面记录并积累他的好作息吧！
            </p>

            <form onSubmit={handleCreateMember} className="space-y-4">
              
              {/* Member Name */}
              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1.5">成员称呼 / 名字</label>
                <input
                  type="text"
                  placeholder="例如：妹妹小雅、聪聪"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50/50 border border-stone-200 rounded-xl text-stone-800 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  maxLength={10}
                  required
                />
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1.5">选择孩子专属头像</label>
                <div className="flex gap-1.5 flex-wrap">
                  {avatarPreset.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewMemberAvatar(emoji)}
                      className={`text-xl p-2 rounded-xl border transition-all hover:scale-110 cursor-pointer ${
                        newMemberAvatar === emoji ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-200' : 'border-stone-200 bg-white'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-1">
                {/* Pet Select Type */}
                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1.5">选择初始萌宠</label>
                  <select
                    value={newAnimalType}
                    onChange={(e) => setNewAnimalType(e.target.value as AnimalType)}
                    className="w-full px-3 py-2 bg-stone-50/50 border border-stone-200 rounded-xl text-stone-700 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  >
                    <option value="cat">猫咪 🐱 (喵喵小橘)</option>
                    <option value="dog">狗狗 🐶 (旺旺柴犬)</option>
                    <option value="panda">熊猫 🐼 (憨憨熊猫)</option>
                    <option value="rabbit">兔子 🐰 (乖乖白兔)</option>
                  </select>
                </div>

                {/* Pet Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-500 mb-1.5">给萌宠起个好听名字</label>
                  <input
                    type="text"
                    placeholder="如：棉花糖"
                    value={newPetName}
                    onChange={(e) => setNewPetName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50/50 border border-stone-200 rounded-xl text-stone-800 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 border border-stone-250 bg-white hover:bg-stone-50 text-stone-600 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer transition-colors"
                >
                  确定创建
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

      {/* DASHBOARD HERO BALANCE BANNER */}
      <section className="w-full px-4 sm:px-8 mt-6">
        <div className="max-w-7xl mx-auto bg-gradient-to-r from-stone-800 via-stone-900 to-indigo-950 p-6 rounded-3xl text-white shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-indigo-500/10 to-transparent pointer-events-none rounded-full" />
          <div className="absolute bottom-[-50px] left-[15%] w-44 h-44 bg-radial from-amber-500/10 to-transparent pointer-events-none rounded-full" />

          <div className="flex items-center gap-4 z-10 min-w-0 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 font-mono text-3xl shrink-0 select-none">
              {activeMember.avatar}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-black tracking-widest text-indigo-300 uppercase bg-indigo-400/20 border border-indigo-400/30 px-2 py-0.5 rounded-md">
                  当前操作成员：{activeMember.name}
                </span>
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  🐾 专属动物伙伴: <strong className="underline decoration-wavy">{activeMember.pet.name} (LV.{activeMember.pet.level})</strong>
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-1.5 tracking-tight">
                欢迎回来，{activeMember.name}，今天也要赢取成长印记吗？
              </h2>
              <p className="text-xs text-stone-350 font-bold mt-1 max-w-xl truncate">
                完成列表日常任务，或专注学习25分钟，就能获得相应的爱心积分，拿去喂饱并升级您的小动物伙伴吧！
              </p>
            </div>
          </div>

          {/* Golden Balance Screen */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4 z-10 select-none min-w-[210px] shadow-sm shrink-0 self-stretch md:self-auto justify-between md:justify-start">
            <div className="text-right flex-1">
              <span className="text-[9px] uppercase font-bold text-amber-300 font-mono tracking-wider block">个人积分余额 PORTFOLIO</span>
              <span className="text-3xl font-mono font-black text-white pr-1">
                {activeMember.points}
              </span>
              <span className="text-xs font-bold text-amber-300 font-sans">积分 (P)</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-400 flex items-center justify-center text-white border border-indigo-450">
              <Trophy className="w-5 h-5 animate-pulse" />
            </div>
          </div>

        </div>
      </section>

      {/* COOPERATIVE GARDEN PLAYGROUND FOR ALL FAMILY PETS */}
      <GardenPlayground members={members} activeMemberId={activeMemberId} />

      {/* CORE GRID LAYOUT */}
      <main className="w-full px-4 sm:px-8 mt-6 flex-1 select-none">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* COLUMN 1: PET PORTFOLIO (Left 5 Slots) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Pet Interactive Evolution stage */}
            <PetEvolution
              petState={activeMember.pet}
              memberPoints={activeMember.points}
              onChangePetState={handleSetPetState}
              onAddLog={handlePostGenericLog}
              onDeductPoints={handleDeductPoints}
            />

            {/* Action Transactions log */}
            <ActionHistory
              logs={logs}
              onClearLogs={handleClearLogs}
              members={members}
            />

          </div>

          {/* COLUMN 2: WORKSPACE CHORE && TIMER CHANNELS (Right 7 Slots) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Focus Clock timer */}
            <TimerClock
              onAwardPoints={handleRewardPoints}
              petSleeping={activeMember.pet.status === 'sleeping'}
              onSetPetStatus={(status) => handleSetPetState({ status })}
            />

            {/* shared Chore tasks manager panel */}
            <ChoreManager
              chores={chores}
              onAddChore={handleAddChore}
              onDeleteChore={handleDeleteChore}
              onRewardPoints={handleRewardPoints}
              onDeductPoints={handleDeductPoints}
            />

            {/* shared rewards store card */}
            <RewardStore
              rewards={rewards}
              points={activeMember.points}
              onAddReward={handleAddReward}
              onDeleteReward={handleDeleteReward}
              onDeductPoints={handleDeductPoints}
              onTriggerEatSpecial={handleTriggerEatSpecial}
            />

          </div>

        </div>
      </main>

    </div>
  );
}
