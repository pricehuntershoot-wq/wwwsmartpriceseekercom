import { motion } from "framer-motion";

const shops = [
  { name: "Alza.cz", color: "text-green-400" },
  { name: "CZC.cz", color: "text-yellow-400" },
  { name: "Datart.cz", color: "text-red-400" },
  { name: "Smarty.cz", color: "text-blue-400" },
  { name: "Mironet.cz", color: "text-orange-400" },
];

export const ShopLogosSection = () => {
  return (
    <section className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-surface" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      <div className="container relative z-10">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center text-sm text-muted-foreground tracking-wide uppercase"
        >
          Porovnáváme ceny z ověřených českých e-shopů
        </motion.p>

        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
          {shops.map((shop, i) => (
            <motion.div
              key={shop.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group"
            >
              <div className="flex items-center gap-2 rounded-xl border border-border/30 bg-secondary/20 px-5 py-3 transition-all duration-300 hover:border-border/60 hover:bg-secondary/40">
                <span className={`text-lg sm:text-xl font-heading font-bold ${shop.color} opacity-70 group-hover:opacity-100 transition-opacity`}>
                  {shop.name}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
