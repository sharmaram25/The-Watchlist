import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { m } from 'framer-motion';
import { useDocumentTitle } from '../hooks/useUi';
import { useCalmMotion, EASE_CINEMA } from '../lib/perf';

const FACTS = [
  { label: 'Current focus', value: 'Immersive UI engineering' },
  { label: 'Tech stack', value: 'React 19, Framer Motion, TypeScript' },
  { label: 'Location', value: 'Digital nomad' },
];

const About: React.FC = () => {
  useDocumentTitle('Creator');
  const calm = useCalmMotion();
  const enter = (delay = 0) =>
    calm
      ? { initial: false as const, animate: { opacity: 1 } }
      : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay, ease: EASE_CINEMA } };

  return (
    <div className="min-h-screen pt-safe-nav md:pt-32 pb-16 px-gutter">
      <section className="grid gap-10 md:gap-16 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-end mb-20 md:mb-32">
        <m.div {...enter(0)}>
          <p className="kicker mb-5">The creator</p>
          <h1 className="font-display text-[clamp(4.5rem,2rem+10vw,10rem)] leading-[0.85] text-fg">
            Ram
            <br />
            <span className="italic text-fg-muted">Sharma</span>
          </h1>
          <p className="mt-8 text-xl md:text-2xl text-fg-muted max-w-2xl leading-relaxed text-pretty">
            Digital architect and creative technologist crafting fluid, cinematic web experiences — merging performance with
            high-end aesthetics.
          </p>
        </m.div>

        <m.figure {...enter(0.1)} className="justify-self-start md:justify-self-end w-56 sm:w-64 md:w-full md:max-w-[340px]">
          <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-ink-700 ring-1 ring-white/10">
            <img src="/2.jpg" alt="Ram Sharma" width={340} height={425} decoding="async" fetchPriority="high" className="w-full h-full object-cover" />
          </div>
          <figcaption className="kicker mt-3">Behind the camera</figcaption>
        </m.figure>
      </section>

      <section className="grid gap-14 md:gap-20 md:grid-cols-2 mb-20 md:mb-32">
        <div>
          <h2 className="font-display text-fluid-section text-fg mb-6">Philosophy</h2>
          <div className="space-y-5 text-fg-muted text-[17px] leading-relaxed max-w-xl">
            <p>
              I believe the web should be more than static containers of information — an immersive medium that respects people’s
              time while delighting their senses.
            </p>
            <p>
              The Watchlist is that idea applied to a nightly ritual: choosing what to watch. Fast to load on any phone, calm to
              browse, and a little bit theatrical.
            </p>
          </div>
        </div>
        <dl className="border-t border-white/[0.08] self-start">
          {FACTS.map((f) => (
            <div key={f.label} className="border-b border-white/[0.08] py-5 grid sm:grid-cols-[10rem_1fr] gap-1 sm:gap-6">
              <dt className="kicker sm:pt-1.5">{f.label}</dt>
              <dd className="font-display text-2xl md:text-3xl text-fg">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-white/[0.08] pt-14 md:pt-20 grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <h2 className="font-display text-[clamp(3rem,1.5rem+6vw,6.5rem)] leading-[0.9] text-fg mb-8">
            Let’s make
            <br />
            <span className="italic text-accent">something.</span>
          </h2>
          <a
            href="mailto:sharmaram2504@gmail.com"
            className="inline-flex items-center gap-3 max-w-full text-[clamp(1.05rem,0.7rem+1.8vw,1.75rem)] text-fg link-underline"
          >
            <span className="truncate">sharmaram2504@gmail.com</span>
            <ArrowUpRight size={22} className="shrink-0 text-fg-muted" aria-hidden="true" />
          </a>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="https://portfolio-ram-sharma.netlify.app/" target="_blank" rel="noreferrer" className="btn btn-lg btn-light">
            View portfolio <ArrowUpRight size={17} aria-hidden="true" />
          </a>
          <a href="https://www.linkedin.com/in/ram-sharma-20rs02/" target="_blank" rel="noreferrer" className="btn btn-lg btn-secondary">
            LinkedIn
          </a>
        </div>
      </section>
    </div>
  );
};

export default About;
