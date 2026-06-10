import React, { useState } from 'react';
import { ActionLog } from '../types';
import { Clock, Trash2, ArrowUpRight, ArrowDownRight, Gift, Star, Filter } from 'lucide-react';

interface ActionHistoryProps {
  logs: ActionLog[];
  onClearLogs: () => void;
  members: { id: string; name: string; avatar: string }[];
}

export const ActionHistory: React.FC<ActionHistoryProps> = ({ logs, onClearLogs, members }) => {
  const [filterType, setFilterType] = useState<'all' | 'reward' | 'deduct' | 'redeem' | 'pet_grow'>('all');
  const [filterMemberId, setFilterMemberId] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    // Member Filter
    if (filterMemberId !== 'all' && log.memberId !== filterMemberId) {
      return false;
    }
    // Type Filter
    if (filterType === 'all') return true;
    if (filterType === 'reward') return log.type === 'reward';
    if (filterType === 'deduct') return log.type === 'deduct' || log.type === 'custom_penalty';
    if (filterType === 'redeem') return log.type === 'redeem';
    if (filterType === 'pet_grow') return log.type === 'pet_grow' || log.type === 'level_up';
    return true;
  });

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${mm}/${dd} ${hh}:${min}`;
  };

  return (
    <div id="action-history-card" className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 flex flex-col h-full">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h3 className="text-lg font-bold text-stone-800 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <span>家族积分成长日志书</span>
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">记录每一次分数奖励、扣除、喂养、多成员兑换细节</p>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="self-end sm:self-auto flex items-center gap-1 text-[10px] font-bold text-stone-450 hover:text-rose-500 border border-stone-100 hover:border-rose-100 px-3 py-1.5 rounded-xl cursor-pointer transition-all duration-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>清空全部</span>
          </button>
        )}
      </div>

      {/* Filter and controls bar */}
      <div className="space-y-3 mb-4 bg-stone-50/40 p-3 rounded-2xl border border-stone-100/65">
        
        {/* Member Selector Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="text-stone-500 font-bold">按成员过滤:</span>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterMemberId('all')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                filterMemberId === 'all'
                  ? 'bg-stone-700 text-white border-stone-700'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
            >
              🌍 所有成员
            </button>
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => setFilterMemberId(m.id)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                  filterMemberId === m.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {m.avatar} {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* Action Type Filter Tabs */}
        <div className="flex gap-1.5 scrollbar-none overflow-x-auto pb-0.5">
          {[
            { key: 'all', label: '📖 全部类型' },
            { key: 'reward', label: '🟢 任务奖分' },
            { key: 'deduct', label: '🔴 行为扣分' },
            { key: 'redeem', label: '🎁 礼品兑换' },
            { key: 'pet_grow', label: '🐾 宠物成长' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key as any)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border shrink-0 transition-all cursor-pointer ${
                filterType === tab.key
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white border-stone-100 hover:bg-stone-50 text-stone-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 flex-1">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-stone-300">
            <Clock className="w-10 h-10 mx-auto stroke-1 opacity-30" />
            <p className="text-xs text-stone-400 mt-2">未找到匹配成长印记 & 习惯记录！</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isAdd = log.pointsChange > 0;
            const pointsColor = isAdd ? 'text-emerald-600 font-extrabold' : log.pointsChange < 0 ? 'text-rose-600 font-extrabold' : 'text-stone-400 font-bold';
            const bgClass = isAdd ? 'bg-emerald-50/40 text-emerald-600' : log.pointsChange < 0 ? 'bg-rose-50/40 text-rose-600' : 'bg-stone-100 text-stone-500';

            // Find current actor details
            const actor = members.find((m) => m.id === log.memberId);

            return (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-stone-50 border border-stone-50/60 transition-all duration-150"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Category icon */}
                  <div className={`p-2 rounded-xl shrink-0 ${bgClass}`}>
                    {log.type === 'reward' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : log.type === 'redeem' ? (
                      <Gift className="w-4 h-4" />
                    ) : log.type === 'level_up' ? (
                      <Star className="w-4 h-4 fill-current animate-pulse text-amber-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-700 leading-normal flex items-center gap-1.5 flex-wrap">
                      <span className="bg-indigo-50 text-indigo-700 text-[9px] px-1 py-0.5 rounded font-black shrink-0">
                        {actor ? `${actor.avatar} ${actor.name}` : log.memberName || '未知'}
                      </span>
                      <span className="truncate">{log.title}</span>
                    </p>
                    <span className="text-[9px] font-mono font-medium text-stone-400 block mt-0.5">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <span className={`text-xs font-mono font-black ${pointsColor}`}>
                    {log.pointsChange > 0 ? `+${log.pointsChange}` : log.pointsChange < 0 ? `${log.pointsChange}` : `+0`} P
                  </span>
                  <p className="text-[9px] font-mono text-stone-400 font-bold mt-0.5">结余 {log.currentTotal} P</p>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
