import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  Flame, 
  Award, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  Download, 
  Server, 
  LogOut, 
  Edit2, 
  Check, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { User, Task } from '../types';
import { sound } from '../utils/audio';

interface ProfileViewProps {
  user: User | null;
  tasks: Task[];
  onUpdateProfile: (name: string) => void;
  onLogout: () => void;
  onOpenApiInspector: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  tasks,
  onUpdateProfile,
  onLogout,
  onOpenApiInspector,
  darkMode,
  onToggleDarkMode,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleSaveName = () => {
    if (newName.trim()) {
      onUpdateProfile(newName.trim());
      setIsEditingName(false);
      sound.playPop();
    }
  };

  const handleToggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    sound.setMuted(nextState);
    if (!nextState) sound.playPop();
  };

  const handleExportData = () => {
    const dataToExport = {
      user,
      tasks,
      exportedAt: new Date().toISOString(),
      appVersion: '2.0.0-react-native-spec',
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskpulse_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    sound.playComplete();
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
      {/* User Header Profile Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-md">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-2xl object-cover bg-white"
              />
            ) : (
              <div className="w-full h-full rounded-2xl bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] text-white">
            ✓
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <div className="flex items-center gap-1.5 justify-center sm:justify-start">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-none"
              />
              <button
                onClick={handleSaveName}
                className="p-1 rounded-lg bg-blue-600 text-white cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {user?.name || 'Alex Rivera'}
              </h3>
              <button
                onClick={() => setIsEditingName(true)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user?.email}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px]">
              <Flame className="w-3 h-3 text-amber-500 fill-current" /> {user?.streakDays || 5} Day Streak
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">
              <Award className="w-3 h-3 text-emerald-500" /> {user?.tasksCompletedCount || 18} Completed
            </span>
          </div>
        </div>
      </div>

      {/* App & System Preferences */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="font-bold text-slate-800 dark:text-slate-200">App Preferences</h4>

        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            {darkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Dark Appearance</span>
              <p className="text-[10px] text-slate-400">Toggle dark / light mobile theme</p>
            </div>
          </div>
          <button
            onClick={onToggleDarkMode}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
              darkMode ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Audio / Haptic Sound FX Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Sound Feedback</span>
              <p className="text-[10px] text-slate-400">Web Audio chimes for completions and actions</p>
            </div>
          </div>
          <button
            onClick={handleToggleSound}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
              !isMuted ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                !isMuted ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Developer & Backend Tools */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <h4 className="font-bold text-slate-800 dark:text-slate-200">Backend & Data Utilities</h4>

        {/* API Inspector Button */}
        <button
          onClick={onOpenApiInspector}
          className="w-full p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-emerald-900 dark:text-emerald-200 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-2.5 text-left">
            <Server className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="font-bold block">Inspect Node.js REST API</span>
              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80">
                View routes, send live curl tests, inspect JWT headers
              </span>
            </div>
          </div>
          <span className="text-xs font-bold">Open →</span>
        </button>

        {/* Export JSON button */}
        <button
          onClick={handleExportData}
          className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-slate-800 dark:text-slate-200 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-2.5 text-left">
            <Download className="w-4 h-4 text-blue-500" />
            <div>
              <span className="font-bold block">Export Tasks & Profile Data</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                Download full state JSON file backup
              </span>
            </div>
          </div>
          {exportSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Downloaded
            </span>
          ) : (
            <span className="text-xs font-bold text-blue-600">Export ↓</span>
          )}
        </button>
      </div>

      {/* Logout Action */}
      <div className="pt-2">
        <button
          onClick={onLogout}
          className="w-full p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Account</span>
        </button>
      </div>
    </div>
  );
};
