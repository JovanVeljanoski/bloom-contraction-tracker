/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Activity, Compass, Award } from 'lucide-react';
import { Contraction } from '../types';
import { assessLabor, LaborPhase } from '../labor';
import { useNow } from '../useNow';

interface HelpCenterProps {
  contractions: Contraction[];
}

export default function HelpCenter({ contractions }: HelpCenterProps) {
  const [activeTab, setActiveTab] = useState<'detector' | '511' | 'path'>('detector');
  const [selectedTimelineStep, setSelectedTimelineStep] = useState<number>(0);

  // Tick once per second so the phase stays in sync as contractions age out
  // of the last-hour window and the 5-1-1 sustained span crosses 60 minutes.
  const now = useNow(1000);

  // Phase detection uses the SAME shared last-hour sliding-window logic as the
  // 5-1-1 checker (assessLabor), so this panel and StatsGrid always agree.
  const assessment = assessLabor(contractions, now);

  const phaseDisplay: Record<
    LaborPhase,
    {
      phase: string;
      description: string;
      guidance: string;
      color: string;
      badge: string;
    }
  > = {
    awaiting: {
      phase: 'Awaiting Records',
      description: 'Log at least 2 contractions in the last hour to automatically analyze your labor phase.',
      guidance: 'Early labor waves can start far apart and irregular. Use this time to rest, drink water, and keep tracking.',
      color: 'bg-dutch-cream border-powder-blue text-charcoal-warm',
      badge: 'bg-white border-powder-blue/60 text-text-muted',
    },
    early: {
      phase: 'Early Labor (Latent Phase)',
      description: 'Contractions are currently mild, short, or more than 5 minutes apart.',
      guidance: 'You are doing great! The textbook guidance is to stay home, preserve your energy, snack on light carbohydrates, and rest as much as possible.',
      color: 'bg-powder-blue/20 border-powder-blue text-charcoal-warm',
      badge: 'bg-powder-blue text-charcoal-warm font-semibold text-xs',
    },
    transitioning: {
      phase: 'Transitioning to Active Labor',
      description: 'In the last hour, contractions are lasting 1 minute or more and are under 5 minutes apart — but the pattern has not yet been sustained for a full hour.',
      guidance: 'Keep breathing slowly. Transitioning from early to active labor can feel intense. Prepare your transport bags and alert your medical provider.',
      color: 'bg-powder-blue/20 border-powder-blue text-charcoal-warm',
      badge: 'bg-powder-blue text-charcoal-warm font-semibold text-xs',
    },
    active: {
      phase: 'Active Labor (5-1-1 Met)',
      description: 'For the last hour, contractions have been lasting 1 minute or more and arriving under 5 minutes apart, sustained continuously.',
      guidance: 'This indicates strong active labor progression. It is highly recommended to contact your doctor, midwife, or birthing center now.',
      color: 'bg-soft-rose/25 border-soft-rose text-charcoal-warm ring-1 ring-soft-rose',
      badge: 'bg-soft-rose text-charcoal-warm font-bold uppercase text-xs',
    },
  };

  const detectedPhase = phaseDisplay[assessment.phase];

  // Textbook Timeline Path Data
  const textbookTimeline = [
    {
      title: '1. Latent / Pre-Labor Signs',
      subtitle: 'Preparation Mode',
      duration: 'Hours to Days',
      description: 'You may notice mild backaches, nesting instincts, or losing your mucus plug. Contractions are irregular, spaced 15–30 minutes apart, and feel like minor menstrual cramps.',
      advice: 'Keep sleeping if it is night. Eat nourishing carbs (like toast or oatmeal) and stay well-hydrated. Keep your mind calm.',
      hospitalIndicator: 'Stay home, let your body rest.',
    },
    {
      title: '2. Early Labor Establishes',
      subtitle: 'Finding Your Rhythm',
      duration: '2 to 12 Hours',
      description: 'Contractions become regular: lasting 30–45 seconds, occurring every 8–12 minutes. You can easily walk and talk through them, but you must focus.',
      advice: 'Take a soothing warm shower. Practice gentle swaying on a birth ball. Breathe out slowly as each wave rises and falls.',
      hospitalIndicator: 'Perfect time to rest in your familiar home comfort.',
    },
    {
      title: '3. Progressing Close to 5-1-1',
      subtitle: 'Steady Concentration',
      duration: '1 to 4 Hours',
      description: 'The contractions are getting longer (45–60 seconds) and closer together (5–7 minutes apart). Talking during a contraction becomes difficult.',
      advice: 'Inform your birthing partner, midwife, or doctor that contractions are strengthening. Focus entirely on relaxing your jaw and shoulders.',
      hospitalIndicator: 'Prepare your bags. Call your medical contact for initial advice.',
    },
    {
      title: '4. The 5-1-1 Textbook Threshold',
      subtitle: 'Active Labor Launch',
      duration: 'Sustained for 1 hour',
      description: 'Your contractions last 1 full minute (60 seconds) and arrive every 5 minutes (or less), sustained consistently for a full 60 minutes.',
      advice: 'Focus on slow, reassuring exhales. Let your partner support your lower back. Your cervix is typically dilating towards 5–6 cm.',
      hospitalIndicator: 'Time to head to the hospital, birth center, or prepare home birth setup!',
    },
    {
      title: '5. Hospital & Active Pushing Phase',
      subtitle: 'Your Baby is Coming',
      duration: 'Varies',
      description: 'You have entered fully active labor and transition. Contractions are 60–90 seconds long, occurring every 2–3 minutes with intense pressure.',
      advice: 'Trust your body and your birthing team. Use breathing rhythms to ride the peak pressure waves. You are extremely close to meeting your baby!',
      hospitalIndicator: 'You are safe under active professional medical supervision.',
    }
  ];

  return (
    <div id="help-center-container" className="bg-white border border-dutch-cream rounded-3xl p-6 shadow-sm space-y-6">
      
      {/* Tab controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-dutch-cream pb-4">
        <div>
          <h3 className="text-base font-display font-bold text-charcoal-warm flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-delft-blue" />
            Support Center & Labor Guide
          </h3>
          <p className="text-sm text-text-muted">Empowering clinical advice & expectation roadmaps</p>
        </div>

        {/* Custom Tab buttons */}
        <div className="flex bg-dutch-cream/50 p-1 rounded-xl border border-dutch-cream w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('detector')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-sm rounded-lg transition-all cursor-pointer font-bold ${
              activeTab === 'detector'
                ? 'bg-soft-rose text-charcoal-warm border border-soft-rose/30 shadow-xs'
                : 'text-text-muted hover:text-charcoal-warm'
            }`}
          >
            Phase Detector
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('511')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-sm rounded-lg transition-all cursor-pointer font-bold ${
              activeTab === '511'
                ? 'bg-soft-rose text-charcoal-warm border border-soft-rose/30 shadow-xs'
                : 'text-text-muted hover:text-charcoal-warm'
            }`}
          >
            5-1-1 Rule Explained
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('path')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-sm rounded-lg transition-all cursor-pointer font-bold ${
              activeTab === 'path'
                ? 'bg-soft-rose text-charcoal-warm border border-soft-rose/30 shadow-xs'
                : 'text-text-muted hover:text-charcoal-warm'
            }`}
          >
            Typical Textbook Path
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[220px]">
        <AnimatePresence mode="wait">
          
          {/* Tab 1: Phase Detector */}
          {activeTab === 'detector' && (
            <motion.div
              key="detector-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-powder-blue/20 flex items-center justify-center text-powder-blue">
                  <Activity className="w-4.5 h-4.5 text-delft-blue" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-charcoal-warm">Live Progression Analyzer</h4>
                  <p className="text-sm text-text-muted">Calculated using latest records in your browser</p>
                </div>
              </div>

              {/* Detector Result Card */}
              <div className={`p-5 rounded-2xl border ${detectedPhase.color} transition-all space-y-3`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm uppercase tracking-wider font-bold text-text-muted">Detected Phase:</span>
                  <span className={`px-2 py-0.5 rounded-full border text-xs uppercase tracking-wider ${detectedPhase.badge}`}>
                    {detectedPhase.phase}
                  </span>
                </div>
                <h5 className="text-base font-display font-bold text-charcoal-warm">
                  {detectedPhase.phase}
                </h5>
                <p className="text-sm leading-relaxed text-charcoal-warm/95">
                  {detectedPhase.description}
                </p>
                <div className="p-3 bg-white/70 rounded-xl border border-dutch-cream/80 text-sm leading-relaxed text-charcoal-warm/90">
                  💡 <strong>Comfort Action:</strong> {detectedPhase.guidance}
                </div>
              </div>

              <div className="text-sm text-text-muted italic bg-dutch-white p-3 rounded-xl border border-dutch-cream">
                * Note: This analyzer is an educational guide. Always consult your certified obstetrician, licensed midwife, or birth team regarding actual labor progression and hospital entry.
              </div>
            </motion.div>
          )}

          {/* Tab 2: 5-1-1 Rule */}
          {activeTab === '511' && (
            <motion.div
              key="511-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <div className="bg-dutch-cream/30 p-4 rounded-2xl border border-dutch-cream space-y-3">
                <h4 className="text-sm font-bold text-charcoal-warm flex items-center gap-1.5">
                  <Award className="w-4.5 h-4.5 text-warm-clay" />
                  What is the 5-1-1 Rule?
                </h4>
                <p className="text-sm text-charcoal-warm leading-relaxed">
                  The **5-1-1 Rule** is a widely trusted clinical guideline used by doctors and midwives to help first-time mothers identify when early, passive labor is transitioning into **active labor**, meaning it is time to prepare to transition to your hospital or birth center.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-white border border-dutch-cream rounded-xl text-center space-y-1">
                  <span className="text-2xl font-mono font-bold text-delft-blue block">5 Mins</span>
                  <span className="text-sm font-semibold text-charcoal-warm block">Frequency Apart</span>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Contractions start every 5 minutes or less (measured from the start of one to the start of the next).
                  </p>
                </div>
                <div className="p-4 bg-white border border-dutch-cream rounded-xl text-center space-y-1">
                  <span className="text-2xl font-mono font-bold text-warm-clay block">1 Minute</span>
                  <span className="text-sm font-semibold text-charcoal-warm block">Duration Length</span>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Each individual contraction wave lasts for at least 60 seconds of continuous pressure.
                  </p>
                </div>
                <div className="p-4 bg-white border border-dutch-cream rounded-xl text-center space-y-1">
                  <span className="text-2xl font-mono font-bold text-soft-rose block">1 Hour</span>
                  <span className="text-sm font-semibold text-charcoal-warm block">Sustained Trend</span>
                  <p className="text-xs text-text-muted leading-relaxed">
                    This rhythmic cycle remains consistent and does not fade for at least 60 consecutive minutes.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 3: Textbook Roadmap */}
          {activeTab === 'path' && (
            <motion.div
              key="path-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-charcoal-warm uppercase tracking-wider flex items-center gap-1">
                  <Compass className="w-4 h-4 text-warm-clay" />
                  Textbook Labor Roadmap
                </span>
                <span className="text-xs text-text-muted">Tap points to explore typical progression</span>
              </div>

              {/* Timeline step markers */}
              <div className="flex justify-between items-center bg-dutch-cream/45 p-1.5 rounded-xl border border-dutch-cream mb-4">
                {textbookTimeline.map((_step, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedTimelineStep(idx)}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedTimelineStep === idx
                        ? 'bg-soft-rose text-charcoal-warm border border-soft-rose/30 shadow-xs'
                        : 'text-text-muted hover:text-charcoal-warm'
                    }`}
                  >
                    Phase {idx + 1}
                  </button>
                ))}
              </div>

              {/* Active Step Details */}
              <div className="bg-dutch-cream/15 border border-dutch-cream rounded-2xl p-5 space-y-3.5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h5 className="text-sm font-bold text-charcoal-warm">
                      {textbookTimeline[selectedTimelineStep].title}
                    </h5>
                    <p className="text-xs uppercase text-text-muted tracking-wider font-semibold">
                      {textbookTimeline[selectedTimelineStep].subtitle}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-white border border-powder-blue text-xs font-mono text-charcoal-warm font-medium">
                    ⏱️ Approx: {textbookTimeline[selectedTimelineStep].duration}
                  </span>
                </div>

                <p className="text-sm text-charcoal-warm/95 leading-relaxed bg-white/70 p-3 rounded-xl border border-dutch-cream">
                  {textbookTimeline[selectedTimelineStep].description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-wider font-bold text-text-muted block">
                      🧘‍♀️ Textbook Comfort Advice:
                    </span>
                    <p className="text-sm leading-relaxed text-charcoal-warm/90">
                      {textbookTimeline[selectedTimelineStep].advice}
                    </p>
                  </div>
                  <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-dutch-cream pt-2.5 sm:pt-0 sm:pl-3.5">
                    <span className="text-xs uppercase tracking-wider font-bold text-warm-clay block">
                      🚗 Hospital / Travel Decision:
                    </span>
                    <p className="text-sm leading-relaxed text-charcoal-warm/90 font-medium">
                      {textbookTimeline[selectedTimelineStep].hospitalIndicator}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reassuring footer */}
              <div className="text-xs text-text-muted leading-relaxed text-center">
                ❤️ Each labor path is entirely unique. This typical textbook progression is designed as a mental roadmap to bring calm confidence. Trust your instincts and your medical providers.
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
