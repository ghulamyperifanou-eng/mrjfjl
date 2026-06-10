import React, { useState } from 'react';
import { ChoreItem, ActionLog } from '../types';
import { Check, Plus, Trash2, Award, Heart, HelpCircle, ShieldAlert, Sparkles, BookOpen, Brush, Coffee, Book } from 'lucide-react';
import { playRewardSound, playDeductSound } from '../utils/audio';

interface ChoreManagerProps {
  chores: ChoreItem[];
  onAddChore: (chore: Omit<ChoreItem, 'id'>) => void;
  onDeleteChore: (id: string) => void;
  onRewardPoints: (amount: number, reason: string) => void;
  onDeductPoints: (amount: number, reason: string) => boolean;
}

export const ChoreManager: React.FC<ChoreManagerProps> = ({
  chores,
  onAddChore,
  onDeleteChore,
  onRewardPoints,
  onDeductPoints,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPoints, setNewPoints] = useState(15);
  const [newCategory, setNewCategory] = useState<'chore' | 'study' | 'behavior' | 'health'>('chore');

  // Custom quick points adjusters
  const [manualType, setManualType] = useState<'add' | 'deduct'>('add');
  const [manualPoints, setManualPoints] = useState(10);
  const [manualReason, setManualReason] = useState('');

  // Built-in presets for adding customized tasks
  const iconPresets = [
    { name: 'BookOpen', label: '学习', icon: '📚' },
    { name: 'Brush', label: '家务', icon: '🧹' },
    { name: 'Coffee', label: '餐具', icon: '🍽️' },
    { name: 'Heart', label: '作息', icon: '💤' },
    { name: 'ShieldAlert', label: '习惯', icon: '🌱' },
  ];

  const [selectedIcon, setSelectedIcon] = useState('🧹');

  const handleCreateChore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddChore({
      title: newTitle.trim(),
      rewardPoints: Number(newPoints) || 10,
      category: newCategory,
      icon: selectedIcon,
      isCustom: true,
    });

    setNewTitle('');
    setNewPoints(15);
    setShowAddForm(false);
  };

  const handleManualAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReason.trim()) return;

    const points = Number(manualPoints) || 10;
    if (manualType === 'add') {
      onRewardPoints(points, `手动奖分: ${manualReason.trim()}`);
      playRewardSound();
    } else {
      const success = onDeductPoints(points, `手动扣分: ${manualReason.trim()}`);
      if (success) {
        playDeductSound();
      }
    }
    setManualReason('');
  };

  const handleCompleteChore = (chore: ChoreItem) => {
    onRewardPoints(chore.rewardPoints, `完成任务: ${chore.title}`);
    playRewardSound();
  };

  const getCategoryTheme = (category: ChoreItem['category']) => {
    switch (category) {
      case 'chore':
        return { bg: 'bg-emerald-50 text-emerald-700', label: '家务管理', border: 'border-emerald-100' };
      case 'study':
        return { bg: 'bg-indigo-50 text-indigo-700', label: '学习提升', border: 'border-indigo-100' };
      case 'behavior':
        return { bg: 'bg-amber-50 text-amber-700', label: '行为塑造', border: 'border-amber-100' };
      case 'health':
        return { bg: 'bg-sky-50 text-sky-700', label: '健康作息', border: 'border-sky-100' };
    }
  };

  return (
    <div id="chore-manager-container" className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      
      {/* LEFT: Task Chore Board list */}
      <div className="bg-white/90 rounded-[32px] border-[3px] border-pink-100 shadow-sm p-6 flex flex-col font-sans">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-black text-rose-950 tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-pink-500" />
              <span>家庭每日习惯榜 🏆</span>
            </h3>
            <p className="text-xs text-rose-800/80 mt-0.5 font-bold">按时按量兑现好作息，记录成长的每一天！</p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 text-xs font-black bg-pink-400 text-white hover:bg-pink-300 px-4 py-2.5 rounded-xl transition-all border-pink-600 border-b-[4px] hover:border-b-[2px] hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增日常</span>
          </button>
        </div>

        {/* Create Form inline drawer/pop */}
        {showAddForm && (
          <form onSubmit={handleCreateChore} className="bg-stone-50 border border-stone-100 p-4 rounded-2xl mb-4 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold text-stone-600">添加自定义项目</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-stone-400 font-semibold mb-1">任务名称</label>
                <input
                  type="text"
                  placeholder="例如：收拾自己的玩具房"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-stone-700 text-xs focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                  maxLength={24}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-400 font-semibold mb-1">奖励积分</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={newPoints}
                  onChange={(e) => setNewPoints(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-stone-700 text-xs focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-stone-400 font-semibold mb-1">习惯分类</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-stone-700 text-xs focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                >
                  <option value="chore">🧹 家务整理</option>
                  <option value="study">📚 专注学习</option>
                  <option value="behavior">🌱 行为塑造</option>
                  <option value="health">💤 健康作息</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-stone-400 font-semibold mb-1">选择图标</label>
                <div className="flex gap-1.5 flex-wrap">
                  {['🧹', '📚', '🍽️', '💤', '🌱', '🦷', '🐱', '✨'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedIcon(emoji)}
                      className={`text-base p-1 rounded-lg border transition-all hover:scale-110 cursor-pointer ${
                        selectedIcon === emoji ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 bg-white'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 rounded-xl text-[10px] text-stone-500 hover:bg-stone-100 cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-1 rounded-xl text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                创建项目
              </button>
            </div>
          </form>
        )}

        {/* Chores List */}
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {chores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-stone-300">
              <BookOpen className="w-10 h-10 opacity-30 stroke-1" />
              <p className="text-xs text-stone-400 mt-2">暂无安排，快点击右上角新增吧！</p>
            </div>
          ) : (
            chores.map((chore) => {
              const theme = getCategoryTheme(chore.category);
              return (
                <div
                  key={chore.id}
                  className={`flex items-center justify-between p-3.5 bg-stone-50/40 rounded-2xl border border-stone-100 hover:bg-stone-50 hover:border-stone-200 hover:shadow-xs transition-all group duration-200`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl shrink-0 p-1.5 bg-white rounded-xl shadow-xs">{chore.icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-stone-700 tracking-tight">{chore.title}</h4>
                      <div className="flex gap-1.5 items-center mt-1">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${theme.bg}`}>
                          {theme.label}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 font-bold">
                          +{chore.rewardPoints} 积分
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Delete Custom chore button */}
                    {chore.isCustom && (
                      <button
                        onClick={() => onDeleteChore(chore.id)}
                        className="p-1.5 bg-white hover:bg-rose-50 hover:text-rose-500 border border-stone-100 text-stone-300 rounded-xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        title="删除该项目"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleCompleteChore(chore)}
                      className="py-1.5 px-3 bg-emerald-400 hover:bg-emerald-300 text-white rounded-xl border-b-[4px] border-emerald-600 hover:border-b-[2px] hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0 flex items-center justify-center cursor-pointer font-black gap-1 text-xs transition-all shadow-sm"
                      title="标记完成并获得积分"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                      <span>已完成</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Manual Point Award / Penalty Adjuster */}
      <div className="bg-white/90 rounded-[32px] border-[3px] border-pink-100 shadow-sm p-6 flex flex-col justify-between font-sans">
        <div>
          <h3 className="text-lg font-black text-rose-950 tracking-tight flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <span>日常自律评定器 🧸</span>
          </h3>
          <p className="text-xs text-rose-800/80 mt-0.5 font-bold">家长专属。可即时扣减或发放奖励积分，正向引导好习惯。</p>
 
          <form onSubmit={handleManualAction} className="mt-4 space-y-4">
            {/* Toggle Reward or Penalty */}
            <div>
              <label className="block text-[10px] text-rose-600 font-bold mb-1.5">评定类型</label>
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-pink-50/50 rounded-2xl border-2 border-pink-100">
                <button
                  type="button"
                  onClick={() => setManualType('add')}
                  className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    manualType === 'add'
                      ? 'bg-rose-400 text-white border-b-[4px] border-rose-600 shadow-sm'
                      : 'text-rose-850 hover:bg-pink-100/30'
                  }`}
                >
                  🟢 奖励加分
                </button>
                <button
                  type="button"
                  onClick={() => setManualType('deduct')}
                  className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    manualType === 'deduct'
                      ? 'bg-rose-400 text-white border-b-[4px] border-rose-600 shadow-sm'
                      : 'text-rose-850 hover:bg-pink-100/30'
                  }`}
                >
                  🔴 扣减积分
                </button>
              </div>
            </div>
 
            {/* Input Points Weight */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] text-rose-600 font-bold">积分额度</label>
                <span className="text-xs font-mono text-rose-950 font-black">{manualPoints} P</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="5"
                  max="150"
                  step="5"
                  value={manualPoints}
                  onChange={(e) => setManualPoints(Number(e.target.value))}
                  className="w-full h-1 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>
              <div className="grid grid-cols-5 gap-1.5 mt-2">
                {[10, 20, 30, 50, 100].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setManualPoints(v)}
                    className={`py-1.5 text-xs font-mono font-black rounded-lg border-2 cursor-pointer text-center transition-all ${
                      manualPoints === v ? 'border-pink-500 bg-pink-100/60 text-pink-750 font-bold border-b-[4px]' : 'border-stone-200 text-stone-500 hover:bg-stone-50 border-b-[4px] hover:border-b-[2px] hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0'
                    }`}
                  >
                    {v}P
                  </button>
                ))}
              </div>
            </div>
 
            {/* Reason Text */}
            <div>
              <label className="block text-[10px] text-rose-600 font-bold mb-1">评定原因 / 评语</label>
              <input
                type="text"
                placeholder={manualType === 'add' ? '例如：主动倒垃圾，受到邻居好评' : '例如：睡觉磨磨蹭蹭，不守时行为'}
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50/50 border-2 border-pink-150 rounded-xl text-stone-800 text-xs focus:ring-1 focus:ring-pink-300 focus:outline-none"
                maxLength={40}
                required
              />
            </div>
 
            <button
              type="submit"
              className={`w-full py-2.5 rounded-2xl text-xs font-black text-white shadow-xs border-b-[5px] hover:border-b-[2px] hover:translate-y-[2px] active:translate-y-[5px] active:border-b-0 transition-all cursor-pointer ${
                manualType === 'add'
                  ? 'bg-emerald-400 border-emerald-600 hover:bg-emerald-350'
                  : 'bg-rose-400 border-rose-600 hover:bg-rose-350'
              }`}
            >
              {manualType === 'add' ? `✨ 发放奖励 + ${manualPoints} 积分` : `💥 正式执行扣减 - ${manualPoints} 积分`}
            </button>
          </form>
        </div>

        {/* Helpful Tip */}
        <div className="bg-pink-50/40 rounded-2xl p-3 border-2 border-pink-100 flex gap-2 items-start mt-4">
          <span className="text-xs mt-0.5">💡</span>
          <p className="text-[10px] text-rose-800/80 leading-relaxed font-bold">
            <strong className="text-rose-950 font-black">科学自律意见：</strong>积分评定不宜过密，引导并建立孩子内心对于生活及学习习惯的主动渴望，更能培养出健康长久的自我驱动力。
          </p>
        </div>
      </div>

    </div>
  );
};
