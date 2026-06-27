/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, RefreshCw, BookOpen, Compass, ShieldCheck } from 'lucide-react';
import { Contraction, Intensity } from './types';
import ActiveTimer from './components/ActiveTimer';
import StatsGrid from './components/StatsGrid';
import ContractionCharts from './components/ContractionCharts';
import ContractionHistory from './components/ContractionHistory';
import HelpCenter from './components/HelpCenter';
import {
  getAllContractions,
  putAllContractions,
  setActiveContraction as persistActive,
  getActiveContraction,
  clearContractions,
} from './db';

export default function App() {
  const [contractions, setContractions] = useState<Contraction[]>([]);
  const [activeContraction, setActiveContraction] = useState<Contraction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mirror of activeContraction kept in a ref so handlers can read the latest
  // value synchronously (e.g. to stamp the stop time at the exact tap moment).
  const activeContractionRef = useRef<Contraction | null>(null);
  activeContractionRef.current = activeContraction;

  // Load data from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [stored, active] = await Promise.all([
          getAllContractions(),
          getActiveContraction(),
        ]);
        if (cancelled) return;
        setContractions(stored);
        setActiveContraction(active);
      } catch (error) {
        console.error('Error loading data from IndexedDB', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist contractions to IndexedDB whenever they change
  useEffect(() => {
    if (isLoading) return;
    putAllContractions(contractions).catch((error) =>
      console.error('Error saving contractions to IndexedDB', error)
    );
  }, [contractions, isLoading]);

  // Persist active contraction state to IndexedDB
  useEffect(() => {
    if (isLoading) return;
    persistActive(activeContraction).catch((error) =>
      console.error('Error saving active contraction to IndexedDB', error)
    );
  }, [activeContraction, isLoading]);

  // Handle beginning of a contraction
  const handleStartContraction = useCallback(() => {
    const newActive: Contraction = {
      id: crypto.randomUUID(),
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      intensity: 'Unspecified',
      notes: '',
    };
    setActiveContraction(newActive);
  }, []);

  // Handle completion of a contraction. The length is recorded at the exact
  // moment Stop is tapped — the optional intensity/notes follow-up only
  // patches those fields afterward (see handleUpdateContraction).
  const handleStopContraction = useCallback((intensity: Intensity, notes: string) => {
    const current = activeContractionRef.current;
    if (!current) return;

    const endTime = Date.now();
    const duration = Math.max(1, Math.floor((endTime - current.startTime) / 1000));

    const completed: Contraction = {
      ...current,
      endTime,
      duration,
      intensity,
      notes,
    };

    // Prepend to list (latest first) and clear the active contraction. These
    // are independent setState calls (no nesting) so they stay pure and behave
    // correctly under StrictMode.
    setContractions((prev) => [completed, ...prev]);
    setActiveContraction(null);
  }, []);

  // Handle deleting an individual record
  const handleDeleteContraction = useCallback((id: string) => {
    setContractions((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Handle modifying Notes or Intensity for a past record
  const handleUpdateContraction = useCallback((id: string, intensity: Intensity, notes: string) => {
    setContractions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, intensity, notes } : c))
    );
  }, []);

  // Handle manually logging a missed contraction
  const handleAddManualContraction = useCallback(
    (startTime: number, endTime: number, intensity: Intensity, notes: string) => {
      const duration = Math.max(1, Math.floor((endTime - startTime) / 1000));
      const manual: Contraction = {
        id: crypto.randomUUID(),
        startTime,
        endTime,
        duration,
        intensity,
        notes,
      };

      // Insert sorted chronologically (latest startTime first)
      setContractions((prev) => {
        const newList = [...prev, manual];
        return newList.sort((a, b) => b.startTime - a.startTime);
      });
    },
    []
  );

  // Safe reset of all tracked data
  const handleClearAll = useCallback(() => {
    setContractions([]);
    setActiveContraction(null);
    clearContractions().catch((e) => console.error('Error clearing IndexedDB', e));
  }, []);

  // Find latest completed contraction for rest timing
  const lastContraction = contractions.length > 0 ? contractions[0] : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dutch-white flex flex-col items-center justify-center text-charcoal-warm text-sm font-sans">
        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-delft-blue" />
        <span>Preparing your calming space...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dutch-white text-charcoal-warm pb-16 font-sans antialiased">

      {/* Calm & Reassuring Header */}
      <header className="border-b border-dutch-cream bg-white/80 backdrop-blur-md sticky top-0 z-10 py-4 px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">

          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-soft-rose/40 to-powder-blue/40 border border-powder-blue flex items-center justify-center shadow-xs">
              <Heart className="w-5 h-5 text-warm-clay fill-soft-rose/25" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-display font-bold tracking-tight text-charcoal-warm">Bloom</h1>
              </div>
              <p className="text-sm text-text-muted">A soothing, private tracker & progression roadmap</p>
            </div>
          </div>

          {/* Gentle supportive reminder quote */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-dutch-cream/45 border border-dutch-cream/60 text-sm text-text-muted">
            <Compass className="w-3.5 h-3.5 text-delft-blue animate-pulse" />
            <span className="font-medium italic">"With every wave, your body is breathing and opening. Trust your rhythm."</span>
          </div>

          {/* Privacy badge */}
          <div className="flex items-center gap-1 text-xs uppercase font-bold text-charcoal-warm bg-powder-blue/25 px-3.5 py-1 rounded-full border border-powder-blue/50">
            <ShieldCheck className="w-3.5 h-3.5 text-delft-blue" />
            <span>100% Private</span>
          </div>

        </div>
      </header>

      {/* Main Layout — single vertical flow, in order: timer, stats, history, graphs, support, comfort */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="space-y-8 flex flex-col items-center">

          {/* Real-time contraction trigger module (centered) */}
          <div className="w-full bg-white border border-dutch-cream rounded-[32px] p-6 shadow-xs">
            <ActiveTimer
              activeContraction={activeContraction}
              onStart={handleStartContraction}
              onStop={handleStopContraction}
              lastContraction={lastContraction}
              onUpdateContraction={handleUpdateContraction}
            />
          </div>

          {/* Statistics and 5-1-1 checker (summary statistics) */}
          <div className="w-full">
            <StatsGrid contractions={contractions} />
          </div>

          {/* History table */}
          <div className="w-full">
            <ContractionHistory
              contractions={contractions}
              onDelete={handleDeleteContraction}
              onUpdate={handleUpdateContraction}
              onAddManual={handleAddManualContraction}
              onClearAll={handleClearAll}
            />
          </div>

          {/* Visual trends graphs */}
          <div className="w-full">
            <ContractionCharts contractions={contractions} />
          </div>

          {/* Support Center & Labor Guide */}
          <div className="w-full">
            <HelpCenter contractions={contractions} />
          </div>

          {/* Reassuring Educational / Comfort Card */}
          <div className="w-full p-6 bg-white border border-dutch-cream rounded-3xl space-y-3 shadow-xs">
            <h4 className="text-sm uppercase tracking-widest text-text-muted font-bold flex items-center gap-1.5 border-b border-dutch-cream pb-2">
              <BookOpen className="w-4.5 h-4.5 text-delft-blue" /> Comfortable Breathing & Relaxation Guide
            </h4>
            <ul className="text-sm text-text-muted space-y-2.5 list-none pl-0">
              <li className="flex gap-2.5 items-start">
                <span className="text-warm-clay text-sm">🧘‍♀️</span>
                <p className="leading-relaxed">
                  <strong>Change Positions Often:</strong> Rocking on a birth ball, kneeling on all fours, or lying on your left side supported by pillows are extremely successful for reducing pelvis pressure.
                </p>
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="text-warm-clay text-sm">💧</span>
                <p className="leading-relaxed">
                  <strong>Nourishing Fluids:</strong> Sip fresh apple juice, chamomile tea, or water frequently to maintain your physical endurance during early labor waves.
                </p>
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="text-warm-clay text-sm">🌬️</span>
                <p className="leading-relaxed">
                  <strong>Reassuring Jaw Relaxation:</strong> Keep your mouth loose and open. A relaxed jaw directly correlates to a relaxed, opening cervix. Use the breathing coach rings above to relax your breathing.
                </p>
              </li>
            </ul>
          </div>

        </div>
      </main>

    </div>
  );
}
