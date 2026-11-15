import React, { useEffect, useRef, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Minus, Plus, Play, Pause, RotateCcw, Shuffle, ChevronDown } from 'lucide-react';
import { drawCharadesTitle, friendlyError } from '../services/tmdbService';
import { Movie } from '../types';
import { LANGUAGES, GENRES_LIST, genreNames } from '../constants';
import TmdbImage from '../components/TmdbImage';
import { LogoMark } from '../components/Logo';
import { useDocumentTitle } from '../hooks/useUi';
import { useCalmMotion } from '../lib/perf';

const ROUNDS = [30, 60, 90, 120, 180];
const HISTORY_SIZE = 40;
const MIN_SHUFFLE_MS = 500;

const formatTime = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
const roundLabel = (s: number) => (s < 60 ? `${s}s` : s % 60 ? `${Math.floor(s / 60)}m${s % 60}` : `${s / 60}m`);
const titleWords = (t: string) => t.replace(/[:\-–—]/g, '').split(/\s+/).filter(Boolean);

/** Drift-free countdown based on an end timestamp. */
const useCountdown = (duration: number) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [running, setRunning] = useState(false);
  const endAt = useRef(0);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const left = Math.ceil((endAt.current - Date.now()) / 1000);
      if (left <= 0) {
        setTimeLeft(0);
        setRunning(false);
        try {
          navigator.vibrate?.([180, 80, 180]);
        } catch {
          /* unsupported */
        }
      } else setTimeLeft(left);
    };
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [running]);

  const start = () => {
    const from = timeLeft > 0 ? timeLeft : duration;
    endAt.current = Date.now() + from * 1000;
    setTimeLeft(from);
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = (to = duration) => {
    setRunning(false);
    setTimeLeft(to);
  };
  return { timeLeft, running, start, pause, reset };
};

type Draw =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; movie: Movie; revealed: boolean }
  | { status: 'none' }
  | { status: 'error'; error: unknown };

const Charades: React.FC = () => {
  useDocumentTitle('Charades');
  const calm = useCalmMotion();

  const [words, setWords] = useState(2);
  const [language, setLanguage] = useState('en');
  const [genreId, setGenreId] = useState<number | null>(null);
  const [round, setRound] = useState(60);
  const [draw, setDraw] = useState<Draw>({ status: 'idle' });
  const history = useRef<number[]>([]);
  const drawId = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const timer = useCountdown(round);

  useEffect(() => {
    if (!timer.running) timer.reset(round);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const drawCard = async () => {
    const id = ++drawId.current;
    setDraw({ status: 'loading' });
    timer.reset(round);

    const stage = stageRef.current;
    if (stage && window.matchMedia('(max-width: 1023px)').matches) {
      const r = stage.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) stage.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' });
    }

    const started = Date.now();
    let next: Draw;
    try {
      const movie = await drawCharadesTitle(language, words, genreId, new Set(history.current));
      if (movie) {
        history.current = [movie.id, ...history.current].slice(0, HISTORY_SIZE);
        next = { status: 'ready', movie, revealed: false };
      } else next = { status: 'none' };
    } catch (error) {
      next = { status: 'error', error };
    }
    setTimeout(() => id === drawId.current && setDraw(next), Math.max(0, MIN_SHUFFLE_MS - (Date.now() - started)));
  };

  const setRevealed = (revealed: boolean) => {
    if (draw.status !== 'ready') return;
    setDraw({ ...draw, revealed });
    // The round starts the moment the actor sees the title.
    if (revealed && !timer.running && timer.timeLeft === round) timer.start();
  };

  const movie = draw.status === 'ready' ? draw.movie : null;
  const revealed = draw.status === 'ready' && draw.revealed;
  const timeUp = timer.timeLeft === 0;
  const progress = timer.timeLeft / round;

  return (
    <div className="min-h-screen pt-safe-nav md:pt-32 px-gutter pb-16">
      <header className="max-w-3xl mb-10 md:mb-12">
        <p className="kicker mb-3">Party game</p>
        <h1 className="font-display text-fluid-title text-fg">Charades</h1>
        <p className="mt-4 text-fg-muted text-[17px] leading-relaxed max-w-xl text-pretty">
          Draw a film, keep the screen to yourself, act it out. No talking. The clock starts when you reveal the card.
        </p>
      </header>

      <div className="grid gap-8 lg:gap-12 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
        {/* Settings */}
        <section aria-label="Game settings" className="surface p-5 sm:p-6 grid sm:grid-cols-2 lg:grid-cols-1 gap-x-8 gap-y-6">
          <div>
            <p className="kicker mb-3" id="words-label">
              Words in title
            </p>
            <div className="flex items-center gap-3" role="group" aria-labelledby="words-label">
              <button type="button" className="btn-icon" aria-label="Fewer words" onClick={() => setWords((w) => Math.max(1, w - 1))} disabled={words <= 1}>
                <Minus size={18} aria-hidden="true" />
              </button>
              <span className="font-display text-5xl leading-none w-14 text-center tabular" aria-live="polite">
                {words}
              </span>
              <button type="button" className="btn-icon" aria-label="More words" onClick={() => setWords((w) => Math.min(8, w + 1))} disabled={words >= 8}>
                <Plus size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div>
            <p className="kicker mb-3" id="round-label">
              Round length
            </p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="round-label">
              {ROUNDS.map((r) => (
                <button key={r} type="button" role="radio" aria-checked={round === r} className="chip font-mono !text-[13px] !px-3" onClick={() => setRound(r)}>
                  {roundLabel(r)}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="kicker mb-3 block">Genre</span>
            <span className="relative block">
              <select value={genreId ?? ''} onChange={(e) => setGenreId(e.target.value ? Number(e.target.value) : null)} className="field appearance-none pr-10">
                <option value="">Any genre</option>
                {GENRES_LIST.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-fg-faint" aria-hidden="true" />
            </span>
          </label>

          <label className="block">
            <span className="kicker mb-3 block">Original language</span>
            <span className="relative block">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="field appearance-none pr-10">
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.code === 'all' ? 'Any language' : l.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-fg-faint" aria-hidden="true" />
            </span>
          </label>
        </section>

        {/* Stage */}
        <section aria-label="Card" className="min-w-0">
          <div ref={stageRef} className="relative aspect-[4/5] xs:aspect-[5/4] md:aspect-[16/10] perspective-1000" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {draw.status === 'idle' && (
                <m.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 surface flex flex-col items-center justify-center text-center p-8">
                  <p className="kicker mb-4">Deck ready</p>
                  <p className="font-display text-4xl sm:text-5xl text-fg mb-8 text-balance">Who’s up first?</p>
                  <button type="button" onClick={drawCard} className="btn btn-lg btn-primary">
                    <Shuffle size={18} aria-hidden="true" /> Draw a card
                  </button>
                </m.div>
              )}

              {draw.status === 'loading' && (
                <m.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 rounded-2xl overflow-hidden skeleton flex items-center justify-center">
                  <p className="kicker relative">Shuffling the deck</p>
                </m.div>
              )}

              {(draw.status === 'none' || draw.status === 'error') && (
                <m.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 surface flex flex-col items-center justify-center text-center p-8">
                  <p className="font-display text-3xl sm:text-4xl text-fg mb-3 text-balance">
                    {draw.status === 'none' ? `No ${words}-word titles here` : 'Couldn’t draw a card'}
                  </p>
                  <p className="text-fg-muted max-w-sm mb-7">
                    {draw.status === 'none' ? 'Try fewer words, another genre or any language.' : friendlyError(draw.error)}
                  </p>
                  <button type="button" onClick={drawCard} className="btn btn-secondary">
                    <Shuffle size={16} aria-hidden="true" /> Try again
                  </button>
                </m.div>
              )}

              {movie && (
                <m.div
                  key={`card-${movie.id}-${revealed ? 'front' : 'back'}`}
                  initial={calm ? { opacity: 0 } : { opacity: 0, rotateY: revealed ? -90 : 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={calm ? { opacity: 0 } : { opacity: 0, rotateY: revealed ? 90 : -90 }}
                  transition={{ duration: calm ? 0.2 : 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 backface-hidden"
                >
                  {!revealed ? (
                    <button
                      type="button"
                      onClick={() => setRevealed(true)}
                      className="absolute inset-0 w-full rounded-2xl overflow-hidden border border-accent/30 bg-ink-800 flex flex-col items-center justify-center text-center p-8 group"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(135deg, rgba(242,181,76,0.06) 0 2px, transparent 2px 14px)',
                      }}
                    >
                      <span className="absolute inset-4 rounded-xl border border-accent/15 pointer-events-none" />
                      <LogoMark size={44} className="text-accent mb-6" />
                      <span className="font-display text-4xl sm:text-5xl text-fg">Tap to reveal</span>
                      <span className="mt-3 text-fg-muted text-sm flex items-center gap-2">
                        <Eye size={15} aria-hidden="true" /> Only the actor should look
                      </span>
                    </button>
                  ) : (
                    <div className="absolute inset-0 rounded-2xl overflow-hidden bg-ink-800 border border-white/[0.08]">
                      <div className="absolute inset-0 opacity-30">
                        <TmdbImage path={movie.backdrop_path || movie.poster_path} kind={movie.backdrop_path ? 'backdrop' : 'poster'} sizes="(max-width: 1024px) 100vw, 900px" maxWidth={1280} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40" />
                      <div className="relative h-full flex flex-col justify-end p-6 sm:p-8 md:p-10">
                        <p className="kicker mb-3 flex flex-wrap gap-x-2">
                          <span>{movie.release_date?.slice(0, 4)}</span>
                          {genreNames(movie.genre_ids, 2).map((g) => (
                            <React.Fragment key={g}>
                              <span aria-hidden="true">·</span>
                              <span>{g}</span>
                            </React.Fragment>
                          ))}
                        </p>
                        <h2 className="font-display text-[clamp(2.25rem,1.2rem+4.5vw,4.75rem)] leading-[0.95] text-fg text-balance break-words">{movie.title}</h2>
                        <div className="mt-6 flex flex-wrap gap-2" aria-label="Letters per word">
                          {titleWords(movie.title || '').map((w, i) => (
                            <span key={i} className="flex flex-col items-center min-w-[2.5rem] px-2 pt-1.5 pb-1 rounded-md border border-white/10 bg-ink/60">
                              <span className="font-mono text-sm text-fg tabular">{w.length}</span>
                              <span className="font-mono text-[9px] uppercase tracking-wider text-fg-faint">word {i + 1}</span>
                            </span>
                          ))}
                        </div>
                        <button type="button" onClick={() => setRevealed(false)} className="absolute top-4 right-4 btn btn-secondary !h-9 !px-3.5 !text-sm">
                          <EyeOff size={15} aria-hidden="true" /> Hide
                        </button>
                      </div>
                    </div>
                  )}
                </m.div>
              )}
            </AnimatePresence>

            {/* Time's up */}
            <AnimatePresence>
              {timeUp && movie && (
                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 rounded-2xl bg-ink/90 flex flex-col items-center justify-center text-center p-8"
                >
                  <p className="font-display text-7xl sm:text-8xl text-accent">Time.</p>
                  <p className="mt-3 text-fg-muted">
                    It was <span className="text-fg">{movie.title}</span>
                  </p>
                  <button type="button" onClick={drawCard} className="btn btn-lg btn-primary mt-8">
                    <Shuffle size={18} aria-hidden="true" /> Next card
                  </button>
                </m.div>
              )}
            </AnimatePresence>
          </div>

          {/* Timer */}
          <div className="mt-5 surface p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <p
                role="timer"
                aria-label="Time left"
                className={`font-mono text-4xl sm:text-5xl tabular leading-none transition-colors ${
                  timer.timeLeft <= 10 && timer.running ? 'text-accent' : 'text-fg'
                }`}
              >
                {formatTime(timer.timeLeft)}
              </p>
              <div className="ml-auto flex items-center gap-2">
                <button type="button" onClick={() => timer.reset(round)} className="btn-icon" aria-label="Reset timer">
                  <RotateCcw size={17} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={timer.running ? timer.pause : timer.start}
                  className="btn-icon !bg-fg !text-ink !border-fg"
                  aria-label={timer.running ? 'Pause timer' : 'Start timer'}
                >
                  {timer.running ? <Pause size={18} fill="currentColor" aria-hidden="true" /> : <Play size={18} fill="currentColor" className="ml-0.5" aria-hidden="true" />}
                </button>
                {draw.status !== 'idle' && (
                  <button type="button" onClick={drawCard} disabled={draw.status === 'loading'} className="btn btn-primary ml-1">
                    <Shuffle size={16} aria-hidden="true" /> <span className="hidden xs:inline">Next card</span>
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full origin-left rounded-full transition-transform duration-200 ease-linear ${timer.timeLeft <= 10 ? 'bg-accent' : 'bg-fg/80'}`}
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Charades;
