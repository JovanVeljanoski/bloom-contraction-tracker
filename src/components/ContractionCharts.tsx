/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { useState } from 'react';
import { Activity, Info } from 'lucide-react';
import { Contraction } from '../types';

interface ContractionChartsProps {
  contractions: Contraction[];
}

export default function ContractionCharts({ contractions }: ContractionChartsProps) {
  const [activeTab, setActiveTab] = useState<'duration' | 'interval'>('duration');

  // Filter completed contractions in chronological order (oldest first) for correct timeline plotting
  const completed = [...contractions].filter((c) => c.endTime !== null).reverse();

  if (completed.length < 2) {
    return (
      <div id="no-charts-card" className="w-full bg-white border border-dutch-cream rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[260px] shadow-sm">
        <div className="w-12 h-12 rounded-full bg-dutch-cream flex items-center justify-center mb-4 text-delft-blue">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-base font-display font-bold text-charcoal-warm mb-1">Progression Analytics</h3>
        <p className="text-sm text-text-muted max-w-xs leading-relaxed">
          Log at least 2 contractions to generate trend lines. This will help you identify if your contractions are gradually getting longer and closer together.
        </p>
      </div>
    );
  }

  // Calculate start-to-start intervals (in minutes)
  const chartData = completed.map((c, idx) => {
    let startToStartInterval: number | null = null;
    if (idx > 0) {
      // difference between start of previous and start of current
      const prev = completed[idx - 1];
      startToStartInterval = Math.round((c.startTime - prev.startTime) / 1000 / 60); // minutes
    }

    const timeLabel = new Date(c.startTime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      index: idx + 1,
      label: `C${idx + 1}`,
      timeLabel,
      duration: c.duration, // in seconds
      interval: startToStartInterval, // in minutes (first entry will be null)
      intensity: c.intensity,
    };
  });

  // For interval chart, filter out the first point (since interval is null)
  const intervalData = chartData.filter((d) => d.interval !== null) as Array<{
    index: number;
    label: string;
    timeLabel: string;
    duration: number;
    interval: number;
    intensity: string;
  }>;

  // SVG Dimension Constants
  const width = 500;
  const height = 180;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 30;

  // Render Duration Graph (in seconds)
  const renderDurationGraph = () => {
    const values = chartData.map((d) => d.duration);
    const minVal = 0;
    const maxVal = Math.max(...values, 60) * 1.15; // padding, at least 60s

    const getX = (index: number, total: number) => {
      if (total <= 1) return paddingLeft + (width - paddingLeft - paddingRight) / 2;
      return paddingLeft + ((index - 1) / (total - 1)) * (width - paddingLeft - paddingRight);
    };

    const getY = (val: number) => {
      return height - paddingBottom - ((val - minVal) / (maxVal - minVal)) * (height - paddingTop - paddingBottom);
    };

    // Build SVG path
    let linePath = '';
    let areaPath = '';

    chartData.forEach((d, i) => {
      const x = getX(i + 1, chartData.length);
      const y = getY(d.duration);

      if (i === 0) {
        linePath = `M ${x} ${y}`;
        areaPath = `M ${x} ${height - paddingBottom} L ${x} ${y}`;
      } else {
        linePath += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
      }

      if (i === chartData.length - 1) {
        areaPath += ` L ${x} ${height - paddingBottom} Z`;
      }
    });

    const ticks = [0, 30, 60, 90, 120, 180].filter((t) => t < maxVal);
    if (ticks.length <= 1) ticks.push(60);

    return (
      <div id="duration-chart-svg-wrapper" className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="durationGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f2c6c2" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f2c6c2" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {ticks.map((tick) => (
            <g key={tick} className="opacity-70">
              <line
                x1={paddingLeft}
                y1={getY(tick)}
                x2={width - paddingRight}
                y2={getY(tick)}
                stroke="#f4eee3"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={paddingLeft - 8}
                y={getY(tick) + 3}
                fill="#736d6a"
                fontSize="11"
                fontFamily="var(--font-mono)"
                textAnchor="end"
              >
                {tick}s
              </text>
            </g>
          ))}

          {/* X Axis Labels */}
          {chartData.map((d, i) => {
            const x = getX(i + 1, chartData.length);
            const step = Math.ceil(chartData.length / 6);
            if (i % step !== 0 && i !== chartData.length - 1) return null;

            return (
              <text
                key={d.index}
                x={x}
                y={height - 10}
                fill="#736d6a"
                fontSize="11"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
                className="opacity-80"
              >
                {d.timeLabel}
              </text>
            );
          })}

          {/* Area under line */}
          <path d={areaPath} fill="url(#durationGrad)" />

          {/* Main Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#e5b39e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Nodes */}
          {chartData.map((d, i) => {
            const x = getX(i + 1, chartData.length);
            const y = getY(d.duration);
            return (
              <g key={d.index} className="group cursor-pointer">
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#ffffff"
                  stroke="#e5b39e"
                  strokeWidth="2.5"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="#e5b39e"
                  className="opacity-0 group-hover:opacity-20 transition-all"
                />
                <title>{`Contraction ${d.index}: ${d.duration}s at ${d.timeLabel}`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Render Interval Graph (Start-to-Start in minutes)
  const renderIntervalGraph = () => {
    if (intervalData.length === 0) {
      return (
        <div className="h-40 flex items-center justify-center text-center text-sm text-text-muted">
          Awaiting more contractions to chart interval progression.
        </div>
      );
    }

    const values = intervalData.map((d) => d.interval);
    const minVal = 0;
    const maxVal = Math.max(...values, 15) * 1.15; // at least 15 min padding

    const getX = (index: number, total: number) => {
      if (total <= 1) return paddingLeft + (width - paddingLeft - paddingRight) / 2;
      return paddingLeft + ((index - 1) / (total - 1)) * (width - paddingLeft - paddingRight);
    };

    const getY = (val: number) => {
      return height - paddingBottom - ((val - minVal) / (maxVal - minVal)) * (height - paddingTop - paddingBottom);
    };

    let linePath = '';
    let areaPath = '';

    intervalData.forEach((d, i) => {
      const x = getX(i + 1, intervalData.length);
      const y = getY(d.interval);

      if (i === 0) {
        linePath = `M ${x} ${y}`;
        areaPath = `M ${x} ${height - paddingBottom} L ${x} ${y}`;
      } else {
        linePath += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
      }

      if (i === intervalData.length - 1) {
        areaPath += ` L ${x} ${height - paddingBottom} Z`;
      }
    });

    const ticks = [0, 5, 10, 15, 20, 30].filter((t) => t < maxVal);
    if (ticks.length <= 1) ticks.push(10);

    return (
      <div id="interval-chart-svg-wrapper" className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="intervalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cbdadb" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#cbdadb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {ticks.map((tick) => (
            <g key={tick} className="opacity-70">
              <line
                x1={paddingLeft}
                y1={getY(tick)}
                x2={width - paddingRight}
                y2={getY(tick)}
                stroke="#f4eee3"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={paddingLeft - 8}
                y={getY(tick) + 3}
                fill="#736d6a"
                fontSize="11"
                fontFamily="var(--font-mono)"
                textAnchor="end"
              >
                {tick}m
              </text>
            </g>
          ))}

          {/* X Axis Labels */}
          {intervalData.map((d, i) => {
            const x = getX(i + 1, intervalData.length);
            const step = Math.ceil(intervalData.length / 6);
            if (i % step !== 0 && i !== intervalData.length - 1) return null;

            return (
              <text
                key={d.index}
                x={x}
                y={height - 10}
                fill="#736d6a"
                fontSize="11"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
                className="opacity-80"
              >
                {d.timeLabel}
              </text>
            );
          })}

          {/* Area under line */}
          <path d={areaPath} fill="url(#intervalGrad)" />

          {/* Main Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#4a6fa5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Nodes */}
          {intervalData.map((d, i) => {
            const x = getX(i + 1, intervalData.length);
            const y = getY(d.interval);
            return (
              <g key={d.index} className="group cursor-pointer">
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#ffffff"
                  stroke="#4a6fa5"
                  strokeWidth="2.5"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill="#4a6fa5"
                  className="opacity-0 group-hover:opacity-20 transition-all"
                />
                <title>{`Contraction ${d.index}: ${d.interval}m interval at ${d.timeLabel}`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Analyze simple labor trends
  const getTrendAnalysis = () => {
    if (completed.length < 3) return null;

    // `completed` is oldest-first, so the last 3 are the most recent.
    const last3 = completed.slice(-3);
    const durations = last3.map((c) => c.duration);
    const avgDur = durations.reduce((a, b) => a + b, 0) / durations.length;

    // Intervals BETWEEN the last 3 contractions (2 intervals for 3 waves).
    const last3Intervals: number[] = [];
    for (let i = 1; i < last3.length; i++) {
      last3Intervals.push((last3[i].startTime - last3[i - 1].startTime) / 1000 / 60);
    }

    const avgInt = last3Intervals.length > 0 ? last3Intervals.reduce((a, b) => a + b, 0) / last3Intervals.length : null;

    const isGettingCloser = last3Intervals.length >= 2 && last3Intervals[last3Intervals.length - 1] < last3Intervals[0];
    const isGettingLonger = durations[durations.length - 1] > durations[0];

    return {
      avgDur: Math.round(avgDur),
      avgInt: avgInt ? Math.round(avgInt) : null,
      isGettingCloser,
      isGettingLonger,
    };
  };

  const trend = getTrendAnalysis();

  return (
    <div id="contraction-charts-container" className="w-full bg-white border border-dutch-cream rounded-3xl p-6 shadow-sm">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h3 className="text-base font-display font-bold text-charcoal-warm flex items-center gap-2">
            <Activity className="w-4 h-4 text-delft-blue" />
            Progression Trends
          </h3>
          <p className="text-sm text-text-muted">
            Track if contractions are getting longer and closer together
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-dutch-cream/50 p-1 rounded-xl border border-dutch-cream">
          <button
            type="button"
            onClick={() => setActiveTab('duration')}
            className={`px-3 py-1 text-sm rounded-lg transition-all font-semibold cursor-pointer ${
              activeTab === 'duration'
                ? 'bg-soft-rose text-charcoal-warm border border-soft-rose/30 shadow-xs'
                : 'text-text-muted hover:text-charcoal-warm'
            }`}
          >
            Duration
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('interval')}
            className={`px-3 py-1 text-sm rounded-lg transition-all font-semibold cursor-pointer ${
              activeTab === 'interval'
                ? 'bg-soft-rose text-charcoal-warm border border-soft-rose/30 shadow-xs'
                : 'text-text-muted hover:text-charcoal-warm'
            }`}
          >
            Frequency
          </button>
        </div>
      </div>

      {/* Main Graph Area */}
      <div className="mb-4 bg-dutch-white/70 p-4 rounded-2xl border border-dutch-cream">
        {activeTab === 'duration' ? renderDurationGraph() : renderIntervalGraph()}
      </div>

      {/* Insights Footer */}
      {trend && (
        <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-soft-rose/15 border border-soft-rose text-sm text-charcoal-warm">
          <Info className="w-4.5 h-4.5 text-delft-blue shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-charcoal-warm">Labor Progression Insights</p>
            <p className="text-sm leading-relaxed text-text-muted font-medium">
              Your last 3 contractions averaged <strong className="text-warm-clay">{trend.avgDur}s</strong> duration
              {trend.avgInt !== null && <> at intervals of <strong className="text-delft-blue">{trend.avgInt}m</strong> apart</>}.
              {trend.isGettingCloser && trend.isGettingLonger && (
                <span className="text-charcoal-warm block mt-1 font-bold bg-white/70 p-2 rounded-lg border border-soft-rose/50">
                  📈 Note: Contractions are gradually lengthening and spacing is tightening. This is a classic indicator of active labor progression!
                </span>
              )}
              {trend.isGettingCloser && !trend.isGettingLonger && (
                <span className="text-charcoal-warm block mt-1 font-semibold">
                  ⏱️ Note: Contractions are occurring more frequently. Use the rest periods to relax fully.
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
