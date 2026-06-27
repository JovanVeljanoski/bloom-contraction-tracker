/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Square, Wind, CheckCircle2, Edit3 } from 'lucide-react';
import { Contraction, Intensity } from '../types';

interface ActiveTimerProps {
  activeContraction: Contraction | null;
  onStart: () => void;
  onStop: (intensity: Intensity, notes: string) => void;
  lastContraction: Contraction | null;
  onUpdateContraction: (id: string, intensity: Intensity, notes: string) => void;
}

export default function ActiveTimer({
  activeContraction,
  onStart,
  onStop,
  lastContraction,
  onUpdateContraction,
}: ActiveTimerProps) {
  const [duration, setDuration] = useState(0);
  const [timeSinceLast, setTimeSinceLast] = useState<number | null>(null);
  
  // Quick-add optional values for the most recently completed contraction
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [quickIntensity, setQuickIntensity] = useState<Intensity>('Unspecified');
  const [quickNotes, setQuickNotes] = useState('');
  const [showQuickAddSuccess, setShowQuickAddSuccess] = useState(false);

  // Auto-dismiss state for the post-contraction optional feedback card
  const [dismissSecondsLeft, setDismissSecondsLeft] = useState(30);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // Breathing animation stage: 'inhale', 'exhale'
  const [breathStage, setBreathStage] = useState<'inhale' | 'exhale'>('inhale');

  // Countdown auto-dismiss effect
  useEffect(() => {
    if (!lastSavedId || isUserInteracting) return;
    setDismissSecondsLeft(30);

    const interval = setInterval(() => {
      setDismissSecondsLeft((prev) => {
        if (prev <= 1) {
          setLastSavedId(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lastSavedId, isUserInteracting]);

  // Timer for active contraction duration
  useEffect(() => {
    if (!activeContraction) {
      setDuration(0);
      return;
    }
    // Recompute from Date.now() each tick so background-tab throttling can't
    // drift the displayed elapsed time.
    setDuration(Math.floor((Date.now() - activeContraction.startTime) / 1000));
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - activeContraction.startTime) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [activeContraction]);

  // Timer for time since last contraction ended (Rest Time)
  useEffect(() => {
    const endTime = lastContraction?.endTime ?? null;
    if (activeContraction || endTime === null) {
      setTimeSinceLast(null);
      return;
    }
    // Clamp to 0 so a backward clock change can never show a negative rest.
    const elapsed = () => Math.max(0, Math.floor((Date.now() - endTime) / 1000));
    setTimeSinceLast(elapsed());
    const interval = setInterval(() => setTimeSinceLast(elapsed()), 1000);
    return () => clearInterval(interval);
  }, [activeContraction, lastContraction]);

  // Breathing coach cycle: 4 seconds inhale, 4 seconds exhale
  useEffect(() => {
    if (!activeContraction) return;
    setBreathStage('inhale');
    const interval = setInterval(() => {
      setBreathStage((prev) => (prev === 'inhale' ? 'exhale' : 'inhale'));
    }, 4000);
    return () => clearInterval(interval);
  }, [activeContraction]);

  // Reset quick add when a new contraction is started
  const handleStart = () => {
    setLastSavedId(null);
    setShowQuickAddSuccess(false);
    setQuickNotes('');
    setQuickIntensity('Unspecified');
    setIsUserInteracting(false);
    onStart();
  };

  // Instant stop & save (Intensity is optional, defaulted to Unspecified)
  const handleStop = () => {
    if (!activeContraction) return;
    const currentId = activeContraction.id;
    // Call onStop instantly, saving with default optional parameters
    onStop('Unspecified', '');
    // Setup quick editing for the newly completed entry
    setLastSavedId(currentId);
    setIsUserInteracting(false);
    setDismissSecondsLeft(30);
  };

  const handleSaveQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastSavedId) return;

    // Delegate the update to the parent, which persists it to IndexedDB.
    onUpdateContraction(lastSavedId, quickIntensity, quickNotes);
    setShowQuickAddSuccess(true);
    setTimeout(() => {
      setLastSavedId(null);
      setShowQuickAddSuccess(false);
    }, 2000);
  };

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatRestTime = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  return (
    <div id="active-timer-container" className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
      
      {/* Resting Period indicator */}
      <div id="rest-status-bar" className="h-12 mb-4 flex items-center justify-center">
        {!activeContraction && timeSinceLast !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-dutch-cream text-sm text-charcoal-warm font-medium border border-powder-blue"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-powder-blue animate-ping inline-block" />
            <span className="font-mono">REST TIME SINCE LAST: {formatRestTime(timeSinceLast)}</span>
          </motion.div>
        )}
        
        {activeContraction && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-soft-rose/25 text-sm text-charcoal-warm font-semibold border border-soft-rose"
          >
            <Wind className="w-4 h-4 text-warm-clay animate-pulse" />
            <span>Contraction Active — Breathe gently</span>
          </motion.div>
        )}
      </div>

      {/* Main Touch Circle Control (prominent, 100% surface area clickable) */}
      <div id="timer-trigger-circle" className="relative w-80 h-80 flex items-center justify-center">
        
        {/* Soft, Calm Orbiting Dot & Track (Hypnotic rhythm & focus indicator) */}
        <div className="absolute inset-4 rounded-full border border-dashed border-dutch-cream pointer-events-none opacity-80 animate-pulse -z-20" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 rounded-full pointer-events-none -z-10"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-soft-rose shadow-[0_0_12px_#fca3b7] border-2 border-white" />
        </motion.div>

        {/* Breathing Coach rings */}
        <AnimatePresence>
          {activeContraction && (
            <motion.div
              key="breath-coach"
              initial={{ scale: 0.9, opacity: 0.3 }}
              animate={{
                scale: breathStage === 'inhale' ? 1.2 : 0.95,
                opacity: breathStage === 'inhale' ? 0.6 : 0.2,
              }}
              transition={{ duration: 4, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-soft-rose/10 border-2 border-soft-rose/50 -z-10"
            />
          )}
        </AnimatePresence>

        {/* Outer styling border */}
        <div className="absolute inset-2 rounded-full border border-dutch-cream -z-10" />

        {/* The Action Button - Entire 100% surface area is touch and click responsive */}
        <motion.button
          id={activeContraction ? "stop-timer-btn" : "start-timer-btn"}
          whileTap={{ scale: 0.95 }}
          onClick={activeContraction ? handleStop : handleStart}
          style={activeContraction ? undefined : { backgroundColor: '#d6acd6' }}
          className={`w-72 h-72 rounded-full flex flex-col items-center justify-center p-8 shadow-md transition-all duration-350 select-none cursor-pointer focus:outline-none ${
            activeContraction
              ? 'bg-gradient-to-tr from-dutch-cream to-soft-rose/25 hover:from-dutch-cream hover:to-soft-rose/40 border-4 border-soft-rose text-charcoal-warm'
              : 'border-4 border-powder-blue hover:opacity-90 text-charcoal-warm'
          }`}
        >
          {activeContraction ? (
            <div className="flex flex-col items-center text-center w-full">
              <span className="text-sm uppercase tracking-widest text-text-muted font-bold mb-1">
                Duration
              </span>
              <span className="text-6xl font-mono font-bold tracking-tight text-charcoal-warm mb-3">
                {formatTime(duration)}
              </span>
              
              {/* Dynamic Breathing coaching phrase - Butter-soft opacity cross-fades */}
              <div className="h-10 flex flex-col items-center justify-center relative overflow-hidden w-full">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={breathStage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                    className="absolute text-sm font-display font-semibold text-delft-blue tracking-wide"
                  >
                    {breathStage === 'inhale' ? '🌸 Inhale pure peace' : '🍃 Exhale all tension'}
                  </motion.span>
                </AnimatePresence>
              </div>

              <div className="mt-5 px-5 py-2.5 rounded-full bg-soft-rose/50 hover:bg-soft-rose/70 text-sm font-bold tracking-wider uppercase flex items-center gap-2 transition-colors border border-soft-rose/40">
                <Square className="w-3.5 h-3.5 fill-charcoal-warm text-charcoal-warm" /> Stop & Save
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center w-full">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 border border-powder-blue/60 shadow-sm">
                <Play className="w-6 h-6 fill-charcoal-warm text-charcoal-warm translate-x-0.5" />
              </div>
              <span className="text-2xl font-display font-bold tracking-wide text-charcoal-warm">
                Tap to Start
              </span>
              <p className="text-sm text-text-muted max-w-[200px] mt-2 leading-relaxed">
                Click anywhere in this circle as soon as a contraction begins.
              </p>
            </div>
          )}
        </motion.button>
      </div>

      {/* Non-blocking OPTIONAL Notes/Intensity entry for the contraction just completed */}
      <AnimatePresence>
        {lastSavedId && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full mt-6 bg-white border border-powder-blue rounded-3xl p-5 shadow-sm relative overflow-hidden"
          >
            {/* Visual Countdown Progress Bar */}
            {!isUserInteracting && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-dutch-cream overflow-hidden">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: `${(dismissSecondsLeft / 30) * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                  className="h-full bg-soft-rose"
                />
              </div>
            )}

            {showQuickAddSuccess ? (
              <div className="text-center py-4 text-soft-rose font-medium flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-soft-rose fill-soft-rose/10" />
                <span className="text-sm text-charcoal-warm font-semibold">Contraction updated successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleSaveQuickAdd} className="space-y-4 pt-1">
                <div className="flex justify-between items-center gap-2">
                  <h4 className="text-sm font-bold text-charcoal-warm uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-warm-clay" />
                    Adjust Last Contraction
                  </h4>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setLastSavedId(null)}
                      className="text-xs text-warm-clay hover:text-soft-rose font-bold cursor-pointer bg-dutch-cream/55 px-2.5 py-1 rounded-lg"
                    >
                      Skip
                    </button>
                  </div>
                </div>

                {/* Intensity selector (Optional) */}
                <div>
                  <span className="text-xs text-text-muted uppercase tracking-wider block mb-1.5">
                    Intensity:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['Unspecified', 'Mild', 'Moderate', 'Strong'] as Intensity[]).map((level) => {
                      const activeStyles = {
                        Unspecified: 'bg-dutch-cream border-text-muted text-charcoal-warm font-semibold shadow-xs',
                        Mild: 'bg-sage-green/30 border-sage-green text-charcoal-warm font-semibold shadow-xs',
                        Moderate: 'bg-powder-blue/40 border-powder-blue text-charcoal-warm font-semibold shadow-xs',
                        Strong: 'bg-soft-rose/35 border-soft-rose text-charcoal-warm font-semibold shadow-xs',
                      };
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => {
                            setQuickIntensity(level);
                            setIsUserInteracting(true);
                          }}
                          className={`py-1.5 px-1 text-xs border rounded-xl cursor-pointer transition-all ${
                            quickIntensity === level
                              ? activeStyles[level]
                              : 'border-dutch-cream bg-white text-text-muted hover:bg-dutch-cream/40'
                          }`}
                        >
                          {level === 'Unspecified' ? 'None' : level}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Notes */}
                <div>
                  <label htmlFor="quick-notes-input" className="text-xs text-text-muted uppercase tracking-wider block mb-1">
                    Notes / Position:
                  </label>
                  <input
                    id="quick-notes-input"
                    type="text"
                    placeholder="e.g. Rocking on birth ball, back aches..."
                    value={quickNotes}
                    onChange={(e) => {
                      setQuickNotes(e.target.value);
                      setIsUserInteracting(true);
                    }}
                    maxLength={100}
                    className="w-full px-3 py-1.5 bg-dutch-white border border-powder-blue rounded-xl text-sm text-charcoal-warm placeholder-text-muted/65 focus:outline-none focus:border-delft-blue"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-soft-rose text-charcoal-warm rounded-xl text-sm font-bold hover:bg-opacity-95 cursor-pointer transition-all flex items-center justify-center gap-1 shadow-xs border border-soft-rose/40"
                >
                  Save & Complete
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
