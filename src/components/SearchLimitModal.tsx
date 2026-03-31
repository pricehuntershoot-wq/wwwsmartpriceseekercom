import { Lock, Crown, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface SearchLimitModalProps {
  searchesUsed: number;
  limit: number;
  onClose: () => void;
}

export const SearchLimitModal = ({ searchesUsed, limit, onClose }: SearchLimitModalProps) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, type: "spring", damping: 20 }}
        className="relative w-full max-w-md glass-card rounded-2xl p-8 text-center"
      >
        <div className="mb-6 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
          <Lock className="h-7 w-7 text-accent" />
        </div>

        <h2 className="mb-2 font-heading text-2xl font-bold">
          Denní limit vyčerpán
        </h2>
        <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
          Využili jste {searchesUsed} z {limit} bezplatných vyhledávání dnes.
          Přejděte na Premium pro neomezené vyhledávání a hloubkovou analýzu.
        </p>

        <div className="mb-6 space-y-3 text-left">
          {[
            "Neomezené vyhledávání napříč e-shopy",
            "Hloubková AI analýza skrytých slev",
            "Porovnání cen ze všech e-shopů najednou",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-3 text-sm">
              <Crown className="h-4 w-4 text-accent shrink-0" />
              <span className="text-foreground/80">{feature}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="accent"
            size="lg"
            className="w-full"
            onClick={() => navigate("/premium")}
          >
            <Zap className="h-4 w-4" />
            Přejít na Premium — 99 Kč/měsíc
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Zavřít
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
