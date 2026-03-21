import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export const CtaSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.04] to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/[0.06] blur-[150px]" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium tracking-wide text-primary/90">3 vyhledávání zdarma každý den</span>
          </div>

          <h2 className="mb-5 font-heading text-3xl font-bold sm:text-4xl md:text-5xl">
            Přestaňte přeplácet.{" "}
            <span className="text-gradient-primary">Začněte teď.</span>
          </h2>

          <p className="mx-auto mb-10 max-w-lg text-base text-muted-foreground sm:text-lg leading-relaxed">
            Zadejte produkt, porovnejte ceny ze 6 e-shopů a ušetřete — bez registrace, za pár sekund.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="rounded-xl px-8 text-base"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Vyzkoušet zdarma
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl px-8 text-base"
              onClick={() => navigate("/premium")}
            >
              Zobrazit Premium
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
