import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Search, Loader2, Tag, ShoppingCart, CheckCircle2, ArrowDown, Sparkles } from "lucide-react";

const DEMO_URL = "alza.cz/samsung-galaxy-s24";

const SCAN_STEPS = [
  { label: "Načítání stránky produktu...", duration: 1200 },
  { label: "Skenování cenových úrovní...", duration: 1000 },
  { label: "Hledání skrytých promo kódů...", duration: 1400 },
  { label: "Analýza košíkových slev...", duration: 800 },
];

const FOUND_DISCOUNTS = [
  { type: "Promo kód", code: "LETO25", discount: "-25%", color: "text-primary" },
  { type: "Rozbalené zboží", code: null, discount: "-31%", color: "text-accent" },
  { type: "Košíková sleva", code: null, discount: "-5% nad 2000 Kč", color: "text-primary" },
];

export const LiveDemoSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [phase, setPhase] = useState<"idle" | "typing" | "scanning" | "results">("idle");
  const [typedChars, setTypedChars] = useState(0);
  const [scanStep, setScanStep] = useState(0);
  const [visibleResults, setVisibleResults] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const timer = setTimeout(() => setPhase("typing"), 600);
    return () => clearTimeout(timer);
  }, [isInView]);

  // Typing animation
  useEffect(() => {
    if (phase !== "typing") return;
    if (typedChars >= DEMO_URL.length) {
      const timer = setTimeout(() => setPhase("scanning"), 500);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setTypedChars((c) => c + 1), 45);
    return () => clearTimeout(timer);
  }, [phase, typedChars]);

  // Scanning animation
  useEffect(() => {
    if (phase !== "scanning") return;
    if (scanStep >= SCAN_STEPS.length) {
      const timer = setTimeout(() => setPhase("results"), 400);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setScanStep((s) => s + 1), SCAN_STEPS[scanStep].duration);
    return () => clearTimeout(timer);
  }, [phase, scanStep]);

  // Results stagger
  useEffect(() => {
    if (phase !== "results") return;
    if (visibleResults >= FOUND_DISCOUNTS.length) return;
    const timer = setTimeout(() => setVisibleResults((v) => v + 1), 350);
    return () => clearTimeout(timer);
  }, [phase, visibleResults]);

  const scanProgress = phase === "scanning" ? (scanStep / SCAN_STEPS.length) * 100 : phase === "results" ? 100 : 0;

  return (
    <section className="relative py-28 overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-surface" />
      <div className="absolute inset-0 dot-grid opacity-15" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-accent/20 bg-accent/[0.06] px-5 py-2 shadow-inner-glow">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-medium tracking-widest uppercase text-accent/90">Živá ukázka</span>
          </div>
          <h2 className="mb-5 font-heading text-3xl font-bold sm:text-4xl md:text-5xl">
            Jak najdeme <span className="text-gradient-accent">skrytou slevu</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
            Sledujte v reálném čase, jak naše AI analyzuje stránku produktu a odhalí slevy, které běžně neuvidíte.
          </p>
        </motion.div>

        {/* Demo Window */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto max-w-2xl"
        >
          <div className="rounded-2xl glass-card overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border/50">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
              </div>
              <span className="text-xs text-muted-foreground font-medium ml-2">Price Hunter — Analýza</span>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Search bar */}
              <div className="relative">
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/40 px-4 py-3">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-mono text-foreground">
                    {DEMO_URL.slice(0, typedChars)}
                    {phase === "typing" && (
                      <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
                    )}
                  </span>
                  {(phase === "scanning" || phase === "results") && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="ml-auto"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {(phase === "scanning" || phase === "results") && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: `${scanProgress}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex items-center gap-2 min-h-[1.25rem]">
                    {phase === "scanning" && scanStep < SCAN_STEPS.length && (
                      <>
                        <Loader2 className="h-3 w-3 text-primary animate-spin" />
                        <motion.span
                          key={scanStep}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-xs text-muted-foreground"
                        >
                          {SCAN_STEPS[scanStep].label}
                        </motion.span>
                      </>
                    )}
                    {phase === "results" && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-primary font-medium"
                      >
                        ✓ Analýza dokončena — nalezeny 3 skryté slevy!
                      </motion.span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Results */}
              {phase === "results" && (
                <div className="space-y-3">
                  {FOUND_DISCOUNTS.map((item, i) => (
                    visibleResults > i && (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, type: "spring", damping: 20 }}
                        className="flex items-center justify-between rounded-xl border border-border/40 bg-secondary/30 p-4 hover:border-primary/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/10">
                            {item.code ? (
                              <Tag className="h-4 w-4 text-primary" />
                            ) : (
                              <ShoppingCart className="h-4 w-4 text-accent" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.type}</p>
                            {item.code && (
                              <p className="text-xs text-muted-foreground font-mono">{item.code}</p>
                            )}
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${item.color}`}>{item.discount}</span>
                      </motion.div>
                    )
                  ))}

                  {visibleResults >= FOUND_DISCOUNTS.length && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.06] p-4 text-center"
                    >
                      <p className="text-sm font-medium text-primary">
                        Celková potenciální úspora: <span className="text-lg font-bold">až 4 247 Kč</span>
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
