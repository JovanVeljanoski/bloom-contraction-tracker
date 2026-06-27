/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { useState } from 'react';
import { CheckCircle2, AlertCircle, Heart } from 'lucide-react';
import { Contraction, SummaryStats } from '../types';
import { assessLabor } from '../labor';
import { useNow } from '../useNow';

interface StatsGridProps {
  contractions: Contraction[];
}

export default function StatsGrid({ contractions }: StatsGridProps) {
  const [timeWindow, setTimeWindow] = useState<'1h' | '3h' | '24h' | 'all'>('all');

  // Tick once per second so sliding-window stats and the 5-1-1 "sustained for
  // 1 hour" check stay accurate as time passes (contractions age out of the
  // window, the sustained span crosses 60 minutes) without needing a tap.
  const now = useNow(1000);

  const completed = contractions.filter((c) => c.endTime !== null);

  // Compute statistics for a given list of contractions
  const getStatsForWindow = (
    window: '1h' | '3h' | '24h' | 'all',
    now: number
  ): SummaryStats => {
    let filtered = completed;

    if (window === '1h') {
      filtered = completed.filter((c) => now - c.startTime <= 60 * 60 * 1000);
    } else if (window === '3h') {
      filtered = completed.filter((c) => now - c.startTime <= 3 * 60 * 60 * 1000);
    } else if (window === '24h') {
      filtered = completed.filter((c) => now - c.startTime <= 24 * 60 * 60 * 1000);
    }

    if (filtered.length === 0) {
      return { averageDuration: 0, averageFrequency: 0, averageRest: 0, count: 0 };
    }

    // 1. Average Duration
    const totalDuration = filtered.reduce((acc, c) => acc + c.duration, 0);
    const averageDuration = totalDuration / filtered.length;

    // 2 & 3. Average interval (start-to-start) and rest (end-to-start),
    // computed between consecutive contractions WITHIN the window. Only pairs
    // contractions that are both in the selected window, so the averages
    // reflect that period and aren't skewed by a contraction just outside it.
    const chrono = [...filtered].sort((a, b) => a.startTime - b.startTime);
    let totalFrequency = 0;
    let totalRest = 0;
    let pairsCount = 0;
    for (let i = 1; i < chrono.length; i++) {
      const prev = chrono[i - 1];
      const cur = chrono[i];
      totalFrequency += (cur.startTime - prev.startTime) / 1000; // seconds
      // Rest = gap between previous end and current start; clamp so overlaps
      // never produce a negative value.
      totalRest += Math.max(0, (cur.startTime - (prev.endTime ?? cur.startTime)) / 1000);
      pairsCount++;
    }
    const averageFrequency = pairsCount > 0 ? totalFrequency / pairsCount : 0;
    const averageRest = pairsCount > 0 ? totalRest / pairsCount : 0;

    return {
      averageDuration,
      averageFrequency,
      averageRest,
      count: filtered.length,
    };
  };

  const currentStats = getStatsForWindow(timeWindow, now);

  // 5-1-1 assessment is shared with the HelpCenter Phase Detector via
  // `assessLabor`, so the two panels always agree. It is evaluated over a
  // sliding window of the last hour only (per midwife guidance).
  const rule511 = assessLabor(contractions, now);

  const formatDuration = (secs: number) => {
    if (secs === 0) return '--';
    if (secs < 60) return `${Math.round(secs)}s`;
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.round(secs % 60);
    return `${mins}m ${remainingSecs}s`;
  };

  const formatMinutes = (secs: number) => {
    if (secs === 0) return '--';
    const mins = secs / 60;
    if (mins < 1) return `${Math.round(secs)}s`;
    return `${mins.toFixed(1)}m`;
  };

  return (
    <div id="stats-grid-container" className="space-y-6 w-full">
      
      {/* 5-1-1 Rule Checker Visual Card */}
      <div id="labor-rule-checker" className="bg-white border border-dutch-cream rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-warm-clay fill-soft-rose/25" />
            <h3 className="text-sm font-display font-bold text-charcoal-warm">5-1-1 Quick Assessment</h3>
          </div>
          <span className="text-xs uppercase tracking-widest text-text-muted font-bold font-mono">
            Rule Thresholds
          </span>
        </div>

        {rule511.is511Met ? (
          <div className="p-4 rounded-2xl bg-soft-rose/25 border border-soft-rose text-sm text-charcoal-warm mb-5 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-warm-clay mt-0.5 animate-bounce" />
            <div>
              <p className="font-bold text-charcoal-warm">Active Labor 5-1-1 Pattern Met</p>
              <p className="text-sm leading-relaxed text-text-muted mt-1 font-medium">
                Your contractions match the 5-1-1 guidance: under 5 mins apart, lasting 1 min, sustained for 1 hour. We suggest calling your midwife or doctor to plan your departure.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-dutch-cream/45 border border-dutch-cream text-sm text-text-muted mb-5 leading-relaxed">
            🌸 <span className="font-bold text-charcoal-warm">Passive / Resting State.</span> If your metrics show contractions starting far apart, rest, drink fresh fluids, and let your body conserve energy.
          </div>
        )}

        {/* The 5-1-1 Checklist Row */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          
          {/* Item 1: 5 Mins */}
          <div className={`p-3 rounded-2xl border transition-all ${
            rule511.frequencyMet 
              ? 'bg-powder-blue/35 border-powder-blue text-charcoal-warm font-semibold' 
              : 'bg-dutch-white/70 border-dutch-cream text-text-muted/50'
          }`}>
            <span className="text-sm font-bold block font-mono">5 Min</span>
            <span className="text-xs uppercase tracking-wider block mt-1 font-semibold">Apart or less</span>
            <CheckCircle2 className={`w-4 h-4 mx-auto mt-2 ${
              rule511.frequencyMet ? 'text-delft-blue fill-white' : 'text-text-muted/30'
            }`} />
          </div>

          {/* Item 2: 1 Min */}
          <div className={`p-3 rounded-2xl border transition-all ${
            rule511.durationMet 
              ? 'bg-powder-blue/35 border-powder-blue text-charcoal-warm font-semibold' 
              : 'bg-dutch-white/70 border-dutch-cream text-text-muted/50'
          }`}>
            <span className="text-sm font-bold block font-mono">1 Min</span>
            <span className="text-xs uppercase tracking-wider block mt-1 font-semibold">Duration length</span>
            <CheckCircle2 className={`w-4 h-4 mx-auto mt-2 ${
              rule511.durationMet ? 'text-delft-blue fill-white' : 'text-text-muted/30'
            }`} />
          </div>

          {/* Item 3: 1 Hour */}
          <div className={`p-3 rounded-2xl border transition-all ${
            rule511.sustainedMet 
              ? 'bg-powder-blue/35 border-powder-blue text-charcoal-warm font-semibold' 
              : 'bg-dutch-white/70 border-dutch-cream text-text-muted/50'
          }`}>
            <span className="text-sm font-bold block font-mono">1 Hour</span>
            <span className="text-xs uppercase tracking-wider block mt-1 font-semibold">Sustained pattern</span>
            <CheckCircle2 className={`w-4 h-4 mx-auto mt-2 ${
              rule511.sustainedMet ? 'text-delft-blue fill-white' : 'text-text-muted/30'
            }`} />
          </div>

        </div>
      </div>

      {/* Statistics window widget */}
      <div id="statistics-window-card" className="bg-white border border-dutch-cream rounded-3xl p-6 shadow-sm">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <div>
            <h3 className="text-sm font-display font-bold text-charcoal-warm">Summary Statistics</h3>
            <p className="text-sm text-text-muted">Averages for designated interval</p>
          </div>

          {/* Window Filter */}
          <div className="flex bg-dutch-cream/50 p-1 rounded-xl border border-dutch-cream">
            {(['1h', '3h', '24h', 'all'] as const).map((win) => {
              const labels = { '1h': '1 Hr', '3h': '3 Hr', '24h': '24 Hr', all: 'All' };
              return (
                <button
                  key={win}
                  type="button"
                  onClick={() => setTimeWindow(win)}
                  className={`px-2.5 py-0.5 text-xs rounded-md transition-all font-semibold cursor-pointer ${
                    timeWindow === win
                      ? 'bg-soft-rose text-charcoal-warm border border-soft-rose/30 shadow-xs'
                      : 'text-text-muted hover:text-charcoal-warm'
                  }`}
                >
                  {labels[win]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Cards Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Card 1: Count */}
          <div className="p-4 rounded-2xl bg-dutch-white border border-dutch-cream/80">
            <span className="text-xs uppercase tracking-wider text-text-muted font-bold block mb-1">
              Count
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-mono font-bold text-charcoal-warm">
                {currentStats.count}
              </span>
              <span className="text-xs text-text-muted font-semibold">waves</span>
            </div>
          </div>

          {/* Card 2: Duration */}
          <div className="p-4 rounded-2xl bg-dutch-white border border-dutch-cream/80">
            <span className="text-xs uppercase tracking-wider text-warm-clay font-bold block mb-1">
              Avg Duration
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-charcoal-warm">
                {formatDuration(currentStats.averageDuration)}
              </span>
            </div>
          </div>

          {/* Card 3: Interval */}
          <div className="p-4 rounded-2xl bg-dutch-white border border-dutch-cream/80">
            <span className="text-xs uppercase tracking-wider text-delft-blue font-bold block mb-1">
              Avg Interval
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-charcoal-warm">
                {formatMinutes(currentStats.averageFrequency)}
              </span>
            </div>
          </div>

          {/* Card 4: Rest */}
          <div className="p-4 rounded-2xl bg-dutch-white border border-dutch-cream/80">
            <span className="text-xs uppercase tracking-wider text-soft-rose font-bold block mb-1">
              Avg Rest
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-mono font-bold text-charcoal-warm">
                {formatMinutes(currentStats.averageRest)}
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
