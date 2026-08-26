import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Battery, 
  Smartphone, 
  Monitor, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  Server, 
  Plus, 
  CheckSquare, 
  Calendar, 
  Grid2X2, 
  BarChart3, 
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { sound } from '../utils/audio';

export type AppTab = 'tasks' | 'calendar' | 'matrix' | 'analytics' | 'profile';

interface MobileFrameProps {
  children: React.ReactNode;
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenCreateModal: () => void;
  onOpenApiInspector: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isLoggedIn: boolean;
  unreadCount?: number;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  activeTab,
  onSelectTab,
  onOpenCreateModal,
  onOpenApiInspector,
  darkMode,
  onToggleDarkMode,
  isLoggedIn,
  unreadCount = 0,
}) => {
  const [isSimulatorMode, setIsSimulatorMode] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  // Update mobile status bar clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    sound.setMuted(nextState);
    if (!nextState) sound.playPop();
  };

  const navItems: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'calendar', label: 'Schedule', icon: <Calendar className="w-5 h-5" /> },
    { id: 'matrix', label: 'Matrix', icon: <Grid2X2 className="w-5 h-5" /> },
    { id: 'analytics', label: 'Stats', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <UserIcon className="w-5 h-5" /> },
  ];

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center transition-colors duration-300 ${
      darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100/80 text-slate-900'
    }`}>
      {/* Top Floating Control Toolbar */}
      <header className="w-full max-w-5xl px-4 py-2.5 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md">
            TP
          </div>
          <div className="hidden sm:block">
            <span className="font-extrabold text-xs tracking-tight text-slate-900 dark:text-white">
              TaskPulse Mobile App
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">
              Node.js + JWT Backend
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* API Inspector Quick button */}
          <button
            onClick={onOpenApiInspector}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Server className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">REST API</span>
          </button>

          {/* View mode toggle (Simulator vs Fullscreen) */}
          <button
            onClick={() => {
              setIsSimulatorMode(!isSimulatorMode);
              sound.playPop();
            }}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 shadow-xs"
            title={isSimulatorMode ? 'Switch to Full-width Desktop' : 'Switch to Android Mobile Device Simulator'}
          >
            {isSimulatorMode ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden md:inline">Full View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden md:inline">Mobile Frame</span>
              </>
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-xs"
            title={isMuted ? 'Unmute audio feedback' : 'Mute audio feedback'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-xs"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </header>

      {/* Main Content Area: Device Simulator Frame or Full Responsive Container */}
      <main className="w-full flex-1 flex items-center justify-center p-0 sm:p-4 mb-2">
        <div
          className={`transition-all duration-300 relative flex flex-col overflow-hidden ${
            isSimulatorMode
              ? 'w-full sm:w-[410px] h-[100vh] sm:h-[840px] sm:max-h-[92vh] sm:rounded-[44px] bg-slate-50 dark:bg-slate-950 sm:shadow-2xl sm:shadow-slate-900/30 sm:border-[9px] border-slate-800 dark:border-slate-700 ring-1 ring-slate-900/10'
              : 'w-full max-w-4xl h-[90vh] rounded-3xl bg-slate-50 dark:bg-slate-950 shadow-xl border border-slate-200 dark:border-slate-800'
          }`}
        >
          {/* Android Simulator Status Bar (only in simulator mode or mobile view) */}
          <div className="w-full h-8 px-6 bg-transparent flex items-center justify-between text-xs select-none z-20 font-medium text-slate-800 dark:text-slate-200">
            {/* Clock */}
            <span className="font-bold text-[11px] tracking-wide">{currentTime || '09:41'}</span>

            {/* Camera Punch Hole Cutout (Simulated Android Pixel) */}
            {isSimulatorMode && (
              <div className="hidden sm:block w-4 h-4 rounded-full bg-black border border-slate-800/80 mx-auto" />
            )}

            {/* Status Icons: 5G, Wifi, Battery */}
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="text-[10px] font-bold">5G</span>
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4 fill-current" />
            </div>
          </div>

          {/* Main App Viewport */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {children}

            {/* Floating Action Button for adding tasks (Visible on task/calendar/matrix tabs when logged in) */}
            {isLoggedIn && activeTab !== 'profile' && activeTab !== 'analytics' && (
              <button
                id="fab-add-task"
                onClick={() => {
                  sound.playPop();
                  onOpenCreateModal();
                }}
                title="Create New Task"
                className="absolute bottom-4 right-4 w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/40 hover:shadow-blue-500/60 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer z-30"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Bottom Navigation Tab Bar (When logged in) */}
          {isLoggedIn && (
            <nav className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around z-20 shadow-lg">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-tab-${item.id}`}
                    onClick={() => {
                      onSelectTab(item.id);
                      sound.playPop();
                    }}
                    className={`flex-1 py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className={`relative p-1 rounded-xl transition-all ${
                      isActive ? 'bg-blue-50 dark:bg-blue-950/60 scale-110' : ''
                    }`}>
                      {item.icon}
                      {item.id === 'tasks' && unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Android Home Pill Indicator */}
          {isSimulatorMode && (
            <div className="w-full h-4 bg-white dark:bg-slate-900 flex items-center justify-center pb-1">
              <div className="w-28 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
