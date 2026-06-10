import React, { useState } from 'react';
import { RewardItem, ActionLog } from '../types';
import { ShoppingBag, Plus, Trash2, Heart, Sparkles, Check, Gift } from 'lucide-react';
import { playDeductSound } from '../utils/audio';

interface RewardStoreProps {
  rewards: RewardItem[];
  points: number;
  onAddReward: (reward: Omit<RewardItem, 'id'>) => void;
  onDeleteReward: (id: string) => void;
  onDeductPoints: (amount: number, reason: string) => boolean;
  onTriggerEatSpecial: (foodType: 'apple' | 'cake' | 'star') => void;
}

export const RewardStore: React.FC<RewardStoreProps> = ({
  rewards,
  points,
  onAddReward,
  onDeleteReward,
  onDeductPoints,
  onTriggerEatSpecial,
}) => {
  const [showAddReward, setShowAddReward] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCost, setNewCost] = useState(30);
  const [newCategory, setNewCategory] = useState<RewardItem['category']>('snack');
  const [selectedEmoji, setSelectedEmoji] = useState('🎁');

  const handleCreateReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddReward({
      title: newTitle.trim(),
      costPoints: Number(newCost) || 20,
      category: newCategory,
      icon: selectedEmoji,
      isCustom: true,
    });

    setNewTitle('');
    setNewCost(30);
    setShowAddReward(false);
  };

  const handleRedeem = (reward: RewardItem) => {
    const success = onDeductPoints(reward.costPoints, `兑换商品: ${reward.title}`);
    if (success) {
      playDeductSound();
      
      // If it's a pet treat category, trigger a fun pet feeding effect!
      if (reward.category === 'treat') {
        const type = reward.title.includes('星') ? 'star' : reward.title.includes('果') ? 'apple' : 'cake';
        onTriggerEatSpecial(type);
      }
    }
  };

  const getCategoryBadge = (category: RewardItem['category']) => {
    switch (category) {
      case 'treat':
        return { bg: 'bg-orange-50 text-orange-700', label: '宠物口粮', border: 'border-orange-100' };
      case 'snack':
        return { bg: 'bg-rose-50 text-rose-700', label: '零食冷饮', border: 'border-rose-100' };
      case 'recreation':
        return { bg: 'bg-purple-50 text-purple-700', label: '娱乐时光', border: 'border-purple-100' };
      case 'pet-play':
        return { bg: 'bg-indigo-50 text-indigo-700', label: '特权心愿', border: 'border-indigo-100' };
    }
  };

  return (
    <div id="reward-store-card" className="bg-white/90 rounded-[32px] border-[3px] border-pink-100 shadow-sm p-6 flex flex-col h-full font-sans">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-black text-rose-950 tracking-tight flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-500" />
            <span>积分心愿兑换店 🍦</span>
          </h3>
          <p className="text-xs text-rose-800/80 mt-0.5 font-bold">自己挣下的爱心，换来的甜点才加倍快乐哦！</p>
        </div>

        <button
          onClick={() => setShowAddReward(!showAddReward)}
          className="flex items-center gap-1.5 text-xs font-black bg-pink-400 text-white hover:bg-pink-300 px-3.5 py-2.5 rounded-xl border-pink-600 border-b-[4px] hover:border-b-[2px] hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0 cursor-pointer shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3px]" />
          <span>上架礼品</span>
        </button>
      </div>

      {/* Inline addition drawer */}
      {showAddReward && (
        <form onSubmit={handleCreateReward} className="bg-stone-50 border border-stone-100 p-4 rounded-2xl mb-4 space-y-3 z-10 shadow-xs">
          <h4 className="text-xs font-bold text-stone-600">上架全新心愿好礼</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-stone-400 font-semibold mb-1">愿望商品名称</label>
              <input
                type="text"
                placeholder="例如：去海洋馆游玩"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-stone-700 text-xs focus:ring-1 focus:ring-rose-400 focus:outline-none"
                maxLength={24}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-stone-400 font-semibold mb-1">消耗积分点数</label>
              <input
                type="number"
                min={5}
                max={2000}
                value={newCost}
                onChange={(e) => setNewCost(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-stone-700 text-xs focus:ring-1 focus:ring-rose-400 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-stone-400 font-semibold mb-1">心愿大类</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-stone-700 text-xs focus:ring-1 focus:ring-rose-400 focus:outline-none"
              >
                <option value="snack">🍿 零食冷饮</option>
                <option value="recreation">🎮 娱乐时光</option>
                <option value="pet-play">🏆 特权心愿</option>
                <option value="treat">🍖 宠物口粮</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-stone-400 font-semibold mb-1">好物符号</label>
              <div className="flex gap-1.5 flex-wrap">
                {['🎁', '📺', '🍦', '🎡', '🧸', '🍕', '📖', '🎬', '🍖'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`text-base p-1 rounded-lg border transition-all hover:scale-110 cursor-pointer ${
                      selectedEmoji === emoji ? 'border-rose-500 bg-rose-50' : 'border-stone-200 bg-white'
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
              onClick={() => setShowAddReward(false)}
              className="px-3 py-1 rounded-xl text-[10px] text-stone-500 hover:bg-stone-100 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1 rounded-xl text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              确认上架
            </button>
          </div>
        </form>
      )}

      {/* Grid of items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
        {rewards.map((reward) => {
          const badge = getCategoryBadge(reward.category);
          const canAfford = points >= reward.costPoints;

          return (
            <div
              key={reward.id}
              className={`p-3.5 rounded-[22px] border-[3px] bg-pink-50/10 flex flex-col justify-between hover:bg-pink-50/30 group transition-all duration-300 hover:scale-[1.02] border-pink-100/40 ${
                canAfford ? '' : 'opacity-70'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-2xl p-2 bg-white rounded-xl shadow-xs shrink-0 select-none border border-pink-100">{reward.icon}</span>
                  {reward.isCustom && (
                    <button
                      onClick={() => onDeleteReward(reward.id)}
                      className="p-1 text-pink-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="下架礼品"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-3">
                  <h4 className="text-xs font-black text-rose-955 line-clamp-1">{reward.title}</h4>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-black ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs font-mono font-black text-rose-600">
                      {reward.costPoints} P
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => handleRedeem(reward)}
                  disabled={!canAfford}
                  className={`w-full py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 border
                    ${canAfford
                      ? 'bg-rose-500 hover:bg-rose-400 text-white border-rose-750 border-b-[4px] hover:border-b-[2px] hover:translate-y-[2px] active:translate-y-[4px] active:border-b-0 shadow-sm'
                      : 'bg-stone-100 text-stone-400 cursor-not-allowed border-stone-200 border-b-[2px]'
                    }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{canAfford ? '立即兑换' : '积分不足'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
