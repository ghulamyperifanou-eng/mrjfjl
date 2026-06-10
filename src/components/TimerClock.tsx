import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, StopCircle, Zap, ShieldCheck, HelpCircle, Save, Award } from 'lucide-react';
import { playTickSound, playFinishSound } from '../utils/audio';

interface TimerClockProps {
  onAwardPoints: (amount: number, reason: string) => void;
  petSleeping: boolean;
  onSetPetStatus: (status: 'idle' | 'happy' | 'eating' | 'sleeping' | 'dizzy') => void;
}

export const TimerClock: React.FC<TimerClockProps> = ({
  onAwardPoints,
  petSleeping,
  onSetPetStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'clock' | 'countdown' | 'stopwatch'>('clock');

  // 1. Real-time Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Countdown Timer State
  const [countdownMinutes, setCountdownMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownPreset, setCountdownPreset] = useState(25);
  const [autoReward, setAutoReward] = useState(true); // Reward points upon completion
  const [isTickSoundEnabled, setIsTickSoundEnabled] = useState(false);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync preset minutes change
  const handlePresetChange = (mins: number) => {
    setCountdownPreset(mins);
    setCountdownMinutes(mins);
    setSecondsRemaining(mins * 60);
    setIsCountingDown(false);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  };

  const startCountdown = () => {
    if (secondsRemaining <= 0) return;
    setIsCountingDown(true);
    // Put pet to sleep during study focus for deep concentration!
    onSetPetStatus('sleeping');
  };

  const pauseCountdown = () => {
    setIsCountingDown(false);
  };

  const resetCountdown = () => {
    setIsCountingDown(false);
    setSecondsRemaining(countdownMinutes * 60);
    onSetPetStatus('idle');
  };

  // Run Countdown Interval
  useEffect(() => {
    if (isCountingDown) {
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Count finished!
            setIsCountingDown(false);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            
            // Play success bell
            playFinishSound();
            
            // Calculate dynamic points rewards: 1 point per 2 minutes, min 5 points, max 50 points
            if (autoReward) {
              const pointsEarned = Math.min(50, Math.max(5, Math.round(countdownMinutes)));
              onAwardPoints(pointsEarned, `专注倒计时完成 [${countdownMinutes}分钟]`);
            }
            onSetPetStatus('happy');
            setTimeout(() => onSetPetStatus('idle'), 4000);
            return 0;
          }
          if (isTickSoundEnabled) {
            playTickSound();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isCountingDown, countdownMinutes, autoReward, isTickSoundEnabled]);

  // 3. Stopwatch State
  const [stopwatchTime, setStopwatchTime] = useState(0); // in ms
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const stopwatchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startStopwatch = () => {
    setIsStopwatchRunning(true);
    startTimeRef.current = Date.now() - stopwatchTime;
  };

  const pauseStopwatch = () => {
    setIsStopwatchRunning(false);
  };

  const resetStopwatch = () => {
    setIsStopwatchRunning(false);
    setStopwatchTime(0);
    setLaps([]);
  };

  const recordLap = () => {
    setLaps((prev) => [stopwatchTime, ...prev]);
  };

  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchTime(Date.now() - startTimeRef.current);
      }, 50);
    } else {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    }
    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [isStopwatchRunning]);

  // Formatting helpers
  const formatTimeDigital = (date: Date) => {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return { hh, mm, ss };
  };

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatStopwatch = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  };

  const { hh, mm, ss } = formatTimeDigital(currentTime);
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const formattedDate = `${currentTime.getFullYear()}年${currentTime.getMonth() + 1}月${currentTime.getDate()}日 • ${weekdays[currentTime.getDay()]}`;

  return (
    <div id="timer-clock-card" className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 flex flex-col justify-between h-full min-h-[460px]">
      
      {/* Tab Selectors */}
      <div className="flex gap-1.5 p-1 bg-stone-50 rounded-2xl border border-stone-100 mb-6 shrink-0">
        <button
          onClick={() => setActiveTab('clock')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'clock'
              ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100/30'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>时钟表盘</span>
        </button>

        <button
          onClick={() => setActiveTab('countdown')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'countdown'
              ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100/30'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>专注倒计时</span>
        </button>

        <button
          onClick={() => setActiveTab('stopwatch')} // keep tab key as 'stopwatch' to avoid changing types of activeTab
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'stopwatch'
              ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100/30'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-sky-500" />
          <span>专注正计时</span>
        </button>
      </div>

      {/* RENDER ACTIVE TAB VIEW */}
      <div className="flex-1 flex flex-col justify-center items-center py-4">
        
        {/* TAB 1: REALTIME CLOCK VIEW */}
        {activeTab === 'clock' && (
          <div className="text-center space-y-5 flex flex-col items-center">
            {/* Analog Styled Dial Accent */}
            <div className="w-24 h-24 rounded-full border-4 border-stone-100 border-dashed flex items-center justify-center animate-spin-slow">
              <Clock className="w-8 h-8 text-indigo-400" />
            </div>

            {/* Glowing Big Clock Screen */}
            <div className="space-y-1">
              <div className="flex items-center justify-center font-mono text-4xl sm:text-5xl font-black text-stone-800 tracking-tight">
                <span>{hh}</span>
                <span className="text-indigo-400 mx-1 animate-pulse">:</span>
                <span>{mm}</span>
                <span className="text-indigo-400 mx-1 animate-pulse">:</span>
                <span className="text-xl text-stone-400 font-bold self-end justify-self-start ml-1 pb-1">{ss}</span>
              </div>
              <p className="text-xs text-stone-400 font-semibold tracking-wide">{formattedDate}</p>
            </div>

            <p className="text-[10px] text-stone-400/80 max-w-[200px] leading-relaxed">
              随时关注时间流逝，培养珍惜时间的优良品质。
            </p>
          </div>
        )}

        {/* TAB 2: COUNTDOWN STUDY CONCENTRATION FOCUS TIMER */}
        {activeTab === 'countdown' && (
          <div className="w-full text-center space-y-5">
            
            {/* Display digits */}
            <div>
              <div className="text-5xl font-mono font-black text-stone-800 tracking-wider">
                {formatCountdown(secondsRemaining)}
              </div>
              <span className="text-[10px] font-bold text-indigo-500 mt-1 inline-block">
                {isCountingDown ? '🔥 萌宠陪你认真专注中...' : '💤 准备好开始专注了吗'}
              </span>
            </div>

            {/* Presets and Custom minutes setup */}
            {!isCountingDown && (
              <div className="space-y-3 px-2">
                <div className="flex gap-1 justify-center flex-wrap">
                  {[5, 10, 15, 25, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handlePresetChange(mins)}
                      className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                        countdownPreset === mins
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-stone-100 hover:bg-stone-50 text-stone-500'
                      }`}
                    >
                      {mins}分钟
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 max-w-[240px] mx-auto">
                  <span className="text-[10px] text-stone-400 font-bold">手动设分钟:</span>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={countdownMinutes}
                    onChange={(e) => {
                      const v = Math.max(1, Number(e.target.value));
                      setCountdownMinutes(v);
                      setSecondsRemaining(v * 60);
                      setCountdownPreset(0);
                    }}
                    className="w-14 px-1.5 py-0.5 border border-stone-200 text-xs font-bold text-center rounded bg-stone-50 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Rewards Checkboxes */}
            <div className="flex flex-col items-center gap-2 bg-stone-50 p-2.5 rounded-2xl border border-stone-100/60 max-w-[280px] mx-auto text-left">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoReward}
                  onChange={(e) => setAutoReward(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-indigo-600 border-stone-300"
                />
                <span className="text-[10px] font-bold text-stone-600">🏆 完成自动获得 {Math.min(50, Math.max(5, Math.round(countdownMinutes)))} 技能经验(积分)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isTickSoundEnabled}
                  onChange={(e) => setIsTickSoundEnabled(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-indigo-600 border-stone-300"
                />
                <span className="text-[10px] text-stone-500">🔊 滴答滴答背景音 (模拟木鱼声)</span>
              </label>
            </div>

            {/* Countdown Buttons Panel */}
            <div className="flex gap-2.5 justify-center">
              {isCountingDown ? (
                <>
                  <button
                    onClick={pauseCountdown}
                    className="p-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-sm cursor-pointer active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    <Pause className="w-4 h-4" />
                    <span>挂起专注</span>
                  </button>
                  <button
                    onClick={resetCountdown}
                    className="p-3.5 bg-stone-200 hover:bg-stone-300 text-stone-650 rounded-full cursor-pointer active:scale-95 transition-all text-xs"
                    title="重置"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={startCountdown}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md cursor-pointer active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>开始专注</span>
                  </button>
                  <button
                    onClick={resetCountdown}
                    className="p-3.5 bg-stone-100 hover:bg-stone-250 text-stone-400 rounded-full cursor-pointer active:scale-95 transition-all"
                    title="重置进度"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FOCUS COUNTUP TIMER VIEW */}
        {activeTab === 'stopwatch' && (
          <div className="w-full text-center space-y-4">
            <div className="relative py-2">
              {/* Pulsating outline when running */}
              <div className={`mx-auto w-32 h-32 rounded-full border-4 border-dashed flex flex-col justify-center items-center transition-all duration-500 ${
                isStopwatchRunning 
                  ? 'border-emerald-400 rotate-spin-slow bg-emerald-50/20 scale-105' 
                  : 'border-stone-200 bg-stone-50'
              }`}>
                <Clock className={`w-8 h-8 ${isStopwatchRunning ? 'text-emerald-500 animate-bounce' : 'text-stone-400'}`} />
                <span className="text-[10px] text-stone-400 font-bold mt-1">
                  {isStopwatchRunning ? '正计时中' : '就绪'}
                </span>
              </div>
            </div>

            <div>
              <div className="text-5xl font-mono font-black text-stone-800 tracking-wider">
                {formatStopwatch(stopwatchTime).split('.')[0]} {/* Show quiet MM:SS first */}
                <span className="text-xs text-stone-400 font-bold ml-1 font-mono">
                  .{formatStopwatch(stopwatchTime).split('.')[1]}
                </span>
              </div>
              
              <div className="text-xs font-bold mt-1.5 min-h-[16px]">
                {isStopwatchRunning ? (
                  <span className="text-emerald-600 flex items-center justify-center gap-1 animate-pulse">
                    🌱 专注小树苗正在长大... 累积可奖: {Math.max(2, Math.round(Math.floor(stopwatchTime / 1000) / 30))} 积分!
                  </span>
                ) : stopwatchTime > 0 ? (
                  <span className="text-amber-600">
                    挂起中 • 已经努力了 {Math.floor(stopwatchTime / 1000)} 秒，继续加油！
                  </span>
                ) : (
                  <span className="text-stone-400">
                    适合任何没有固定时长的学习、阅读、乐器练习、打扫
                  </span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2.5 justify-center max-w-[280px] mx-auto">
              {isStopwatchRunning ? (
                <>
                  <button
                    onClick={pauseStopwatch}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold text-xs cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    title="暂停"
                  >
                    <Pause className="w-4 h-4" />
                    <span>挂起专注</span>
                  </button>
                  <button
                    onClick={() => {
                      // Claim Reward!
                      const totalSecs = Math.floor(stopwatchTime / 1000);
                      if (totalSecs < 10) {
                        alert('【专注时间太短啦】亲爱的宝贝，专注少于 10 秒是无法领取积分的哦～继续加油坚持一小会儿吧！🍀');
                        return;
                      }
                      
                      const pointsEarned = Math.min(50, Math.max(2, Math.round(totalSecs / 30))); // 1 point per 30 seconds, min 2, max 50
                      const durationStr = `${Math.floor(totalSecs / 60)}分${totalSecs % 60}秒`;
                      
                      // Award points
                      onAwardPoints(pointsEarned, `正计时专注完成 [${durationStr}]`);
                      
                      // Trigger pet status change
                      onSetPetStatus('happy');
                      setTimeout(() => onSetPetStatus('idle'), 3000);
                      
                      // Reset stopwatch
                      pauseStopwatch();
                      setStopwatchTime(0);
                    }}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-xs cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1 shadow-xs"
                    title="完成结算"
                  >
                    <Award className="w-4 h-4" />
                    <span>完成领取 P</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={startStopwatch}
                    className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-xs cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>开始专注正计时</span>
                  </button>
                  
                  {stopwatchTime > 0 && (
                    <button
                      onClick={resetStopwatch}
                      className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-500 rounded-full cursor-pointer active:scale-95 transition-all"
                      title="放弃进度重置"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER TIPS */}
      <div className="border-t border-stone-100/60 pt-4 text-center shrink-0">
        <span className="text-[10px] text-stone-400/80 font-medium">
          💡 时钟会自动运行。在倒计时期间，宠物会闭眼休息或陪伴专注。
        </span>
      </div>

    </div>
  );
};
