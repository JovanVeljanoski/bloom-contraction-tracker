/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Edit2, Calendar, Check, X, Plus, Clock, Smile } from 'lucide-react';
import { Contraction, Intensity } from '../types';

interface ContractionHistoryProps {
  contractions: Contraction[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, intensity: Intensity, notes: string) => void;
  onAddManual: (startTime: number, endTime: number, intensity: Intensity, notes: string) => void;
  onClearAll: () => void;
}

export default function ContractionHistory({
  contractions,
  onDelete,
  onUpdate,
  onAddManual,
  onClearAll,
}: ContractionHistoryProps) {
  // Editing state for table rows
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editIntensity, setEditIntensity] = useState<Intensity>('Unspecified');
  const [editNotes, setEditNotes] = useState('');

  // Manual logging state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
  const [manualDuration, setManualDuration] = useState('60'); // in seconds
  const [manualIntensity, setManualIntensity] = useState<Intensity>('Unspecified');
  const [manualNotes, setManualNotes] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Clear all confirmation
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const formatDuration = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleStartEdit = (contraction: Contraction) => {
    setEditingId(contraction.id);
    setEditIntensity(contraction.intensity || 'Unspecified');
    setEditNotes(contraction.notes || '');
  };

  const handleSaveEdit = (id: string) => {
    onUpdate(id, editIntensity, editNotes);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [year, month, day] = manualDate.split('-').map(Number);
    const [hours, minutes] = manualTime.split(':').map(Number);
    const startObj = new Date(year, month - 1, day, hours, minutes, 0);
    const startTime = startObj.getTime();

    if (Number.isNaN(startTime)) {
      setManualError('Please enter a valid date and start time.');
      return;
    }

    const durationSec = parseInt(manualDuration, 10);
    if (!Number.isFinite(durationSec) || durationSec <= 0) {
      setManualError('Duration must be a whole number greater than 0 seconds.');
      return;
    }
    const endTime = startTime + durationSec * 1000;

    // Reject entries that overlap an existing contraction's occupied time.
    // Treat an in-progress contraction (endTime null) as open-ended.
    const overlap = contractions.find((c) => {
      const existingStart = c.startTime;
      const existingEnd = c.endTime ?? Number.POSITIVE_INFINITY;
      return startTime < existingEnd && endTime > existingStart;
    });
    if (overlap) {
      setManualError(
        'This time overlaps an existing contraction. Adjust the start time or duration.'
      );
      return;
    }

    setManualError(null);
    onAddManual(startTime, endTime, manualIntensity, manualNotes);

    // Reset Form
    setShowManualForm(false);
    setManualNotes('');
    setManualDuration('60');
  };

  // Intensity Badge Styles
  const getIntensityBadgeClass = (intensity?: Intensity) => {
    switch (intensity) {
      case 'Mild':
        return 'bg-powder-blue/30 text-charcoal-warm border-powder-blue/60 font-semibold';
      case 'Moderate':
        return 'bg-warm-clay/25 text-charcoal-warm border-warm-clay/45 font-semibold';
      case 'Strong':
        return 'bg-soft-rose/30 text-charcoal-warm border-soft-rose/50 font-bold';
      default:
        return 'bg-dutch-cream text-text-muted border-dutch-cream/40';
    }
  };

  return (
    <div id="contraction-history-container" className="bg-white border border-dutch-cream rounded-3xl p-6 shadow-sm space-y-6">
      
      {/* Header and Action controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-display font-bold text-charcoal-warm flex items-center gap-2">
            <Calendar className="w-5 h-5 text-delft-blue" />
            History Table
          </h3>
          <p className="text-sm text-text-muted">
            Review, edit notes/intensity, and delete spurious records below.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Manual Entry Button */}
          <button
            type="button"
            id="open-manual-form-btn"
            onClick={() => setShowManualForm(!showManualForm)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-dutch-cream text-charcoal-warm text-sm font-semibold hover:bg-opacity-80 transition-colors cursor-pointer border border-dutch-cream/65"
          >
            <Plus className="w-4 h-4 text-delft-blue" />
            Log Missed
          </button>

          {/* Reset All Button */}
          {contractions.length > 0 && (
            <button
              type="button"
              id="trigger-clear-all-btn"
              onClick={() => setShowConfirmClear(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-soft-rose/15 border border-soft-rose text-sm text-charcoal-warm font-semibold hover:bg-soft-rose/30 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-warm-clay" />
              Reset Data
            </button>
          )}
        </div>
      </div>

      {/* Manual Entry Form */}
      <AnimatePresence>
        {showManualForm && (
          <motion.form
            id="manual-log-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleManualSubmit}
            className="bg-dutch-cream/35 border border-dutch-cream rounded-2xl p-5 space-y-4"
          >
            <h4 className="text-sm font-bold text-charcoal-warm uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-delft-blue" /> Log a Past Contraction
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="manual-date" className="text-xs text-text-muted uppercase tracking-wider block mb-1">
                  Date
                </label>
                <input
                  id="manual-date"
                  type="date"
                  required
                  value={manualDate}
                  onChange={(e) => { setManualDate(e.target.value); setManualError(null); }}
                  className="w-full px-3 py-2 bg-white border border-powder-blue rounded-xl text-sm text-charcoal-warm focus:outline-none focus:border-delft-blue"
                />
              </div>
              <div>
                <label htmlFor="manual-time" className="text-xs text-text-muted uppercase tracking-wider block mb-1">
                  Start Time
                </label>
                <input
                  id="manual-time"
                  type="time"
                  required
                  value={manualTime}
                  onChange={(e) => { setManualTime(e.target.value); setManualError(null); }}
                  className="w-full px-3 py-2 bg-white border border-powder-blue rounded-xl text-sm text-charcoal-warm focus:outline-none focus:border-delft-blue"
                />
              </div>
              <div>
                <label htmlFor="manual-duration" className="text-xs text-text-muted uppercase tracking-wider block mb-1">
                  Duration (seconds)
                </label>
                <input
                  id="manual-duration"
                  type="number"
                  min="1"
                  max="600"
                  required
                  value={manualDuration}
                  onChange={(e) => { setManualDuration(e.target.value); setManualError(null); }}
                  className="w-full px-3 py-2 bg-white border border-powder-blue rounded-xl text-sm text-charcoal-warm focus:outline-none focus:border-delft-blue"
                />
              </div>
              <div>
                <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">
                  Intensity (Optional)
                </span>
                <select
                  aria-label="Contraction Intensity Selector"
                  value={manualIntensity}
                  onChange={(e) => setManualIntensity(e.target.value as Intensity)}
                  className="w-full px-3 py-2 bg-white border border-powder-blue rounded-xl text-sm text-charcoal-warm focus:outline-none focus:border-delft-blue cursor-pointer"
                >
                  <option value="Unspecified">None</option>
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Strong">Strong</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="manual-notes" className="text-xs text-text-muted uppercase tracking-wider block mb-1">
                Optional Notes
              </label>
              <input
                id="manual-notes"
                type="text"
                placeholder="Describe back pressure, water leakage, positions, comfort techniques..."
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 bg-white border border-powder-blue rounded-xl text-sm text-charcoal-warm focus:outline-none focus:border-delft-blue"
              />
            </div>

            {manualError && (
              <p className="text-sm text-warm-clay font-medium bg-soft-rose/15 border border-soft-rose/40 rounded-xl px-3 py-2">
                {manualError}
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="px-4 py-2 rounded-xl text-sm bg-white text-text-muted border border-powder-blue hover:bg-opacity-80 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-sm font-bold bg-soft-rose text-charcoal-warm border border-soft-rose/40 hover:bg-opacity-90 cursor-pointer shadow-xs"
              >
                Save Past Log
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Clear All Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmClear && (
          <motion.div
            id="clear-all-confirmation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-5 bg-dutch-cream border-2 border-soft-rose rounded-2xl text-center shadow-sm max-w-md mx-auto"
          >
            <h4 className="text-sm font-bold text-warm-clay mb-2 flex items-center justify-center gap-1.5">
              ⚠️ Permanent Reset?
            </h4>
            <p className="text-sm text-charcoal-warm/90 mb-4 leading-relaxed">
              This will remove all contractions from your local browser database. Your statistics, rules assessment, and trends will be empty.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 rounded-xl text-sm bg-white text-charcoal-warm border border-powder-blue hover:bg-gray-50 cursor-pointer"
              >
                Keep Records
              </button>
              <button
                type="button"
                id="confirm-clear-all-btn"
                onClick={() => {
                  onClearAll();
                  setShowConfirmClear(false);
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-warm-clay text-white hover:bg-opacity-95 cursor-pointer"
              >
                Yes, Clear Everything
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Interface */}
      <div className="overflow-x-auto border border-dutch-cream rounded-2xl">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-dutch-cream/45 border-b border-dutch-cream text-xs uppercase tracking-wider text-text-muted font-bold">
              <th className="py-3.5 px-4 font-semibold">Sequence</th>
              <th className="py-3.5 px-4 font-semibold">Date & Start Time</th>
              <th className="py-3.5 px-4 font-semibold">Duration</th>
              <th className="py-3.5 px-4 font-semibold">Frequency (Interval)</th>
              <th className="py-3.5 px-4 font-semibold">Intensity</th>
              <th className="py-3.5 px-4 font-semibold">Notes / Symptoms</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dutch-cream text-sm text-charcoal-warm">
            {contractions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-text-muted bg-dutch-cream/10">
                  <Smile className="w-8 h-8 text-delft-blue/40 mx-auto mb-2" />
                  <p className="font-medium text-charcoal-warm/85">Your contraction log is empty.</p>
                  <p className="text-sm mt-1 text-text-muted/75">Press the green Start button above when you feel a wave begin.</p>
                </td>
              </tr>
            ) : (
              contractions.map((c, index) => {
                const isEditing = editingId === c.id;
                const seqNumber = contractions.length - index;

                // Frequency = start-to-start interval to the previous contraction.
                let frequencyText = '--';
                if (index < contractions.length - 1) {
                  const prev = contractions[index + 1];
                  const diffSec = Math.max(0, Math.round((c.startTime - prev.startTime) / 1000));
                  frequencyText =
                    diffSec < 60 ? `${diffSec}s apart` : `${(diffSec / 60).toFixed(1)}m apart`;
                }

                return (
                  <tr
                    key={c.id}
                    id={`contraction-row-${c.id}`}
                    className="hover:bg-dutch-white/60 transition-colors"
                  >
                    {/* 1. Sequence */}
                    <td className="py-3.5 px-4 font-mono text-sm font-semibold text-text-muted">
                      #{seqNumber}
                    </td>

                    {/* 2. Date and Time */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold">{formatTime(c.startTime)}</div>
                      <div className="text-xs text-text-muted">{formatDate(c.startTime)}</div>
                    </td>

                    {/* 3. Duration */}
                    <td className="py-3.5 px-4 font-mono font-medium">
                      <span className="text-charcoal-warm text-sm">{formatDuration(c.duration)}</span>
                    </td>

                    {/* 4. Interval */}
                    <td className="py-3.5 px-4 font-mono text-text-muted">
                      {frequencyText}
                    </td>

                    {/* 5. Intensity */}
                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <select
                          aria-label="Edit Intensity Level"
                          value={editIntensity}
                          onChange={(e) => setEditIntensity(e.target.value as Intensity)}
                          className="px-2 py-1 bg-white border border-powder-blue rounded-lg text-sm text-charcoal-warm focus:outline-none focus:border-delft-blue cursor-pointer"
                        >
                          <option value="Unspecified">None</option>
                          <option value="Mild">Mild</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Strong">Strong</option>
                        </select>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-full border text-xs font-bold tracking-wider uppercase ${getIntensityBadgeClass(c.intensity)}`}>
                          {c.intensity === 'Unspecified' ? 'None' : (c.intensity || 'None')}
                        </span>
                      )}
                    </td>

                    {/* 6. Notes */}
                    <td className="py-3.5 px-4 max-w-[180px] truncate">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full px-2.5 py-1 bg-white border border-powder-blue rounded-lg text-sm text-charcoal-warm focus:outline-none focus:border-delft-blue"
                          placeholder="e.g. Back pressure..."
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {c.notes ? (
                            <span className="text-charcoal-warm text-sm font-medium" title={c.notes}>
                              {c.notes}
                            </span>
                          ) : (
                            <span className="text-text-muted/40 italic text-sm">No notes</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 7. Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            aria-label="Cancel editing row"
                            onClick={handleCancelEdit}
                            className="p-1 rounded bg-dutch-cream hover:bg-opacity-80 text-text-muted cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Save row modifications"
                            onClick={() => handleSaveEdit(c.id)}
                            className="p-1 rounded bg-soft-rose text-charcoal-warm border border-soft-rose/30 cursor-pointer hover:bg-opacity-90"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            aria-label="Edit contraction row"
                            onClick={() => handleStartEdit(c)}
                            className="p-1.5 rounded-lg hover:bg-dutch-cream text-text-muted hover:text-charcoal-warm cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete spurious contraction"
                            onClick={() => onDelete(c.id)}
                            className="p-1.5 rounded-lg hover:bg-soft-rose/30 text-text-muted hover:text-warm-clay cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
