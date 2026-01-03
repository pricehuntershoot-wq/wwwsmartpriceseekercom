import { Bot, Clock, Eye, LineChart, Lock, Zap } from "lucide-react";

const features = [
  {
    icon: Eye,
    title: "See What Others Can't",
    description: "Our AI agents discover cart-only discounts and returned item deals invisible to traditional comparators.",
  },
  {
    icon: Bot,
    title: "500+ Shop Agents",
    description: "Dedicated AI agents for each e-shop, each trained to understand that shop's unique discount patterns.",
  },
  {
    icon: Clock,
    title: "Real-Time Discovery",
    description: "Prices are checked continuously, so you never miss a flash sale or limited-time offer.",
  },
  {
    icon: LineChart,
    title: "Price History",
    description: "Track price trends over time to know if you're really getting the best deal.",
  },
  {
    icon: Zap,
    title: "Instant Alerts",
    description: "Get notified immediately when our agents find a hidden discount on products you're watching.",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "We never store your browsing data. Our agents do the hunting, not tracking.",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      
      <div className="container relative z-10">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            Why Choose <span className="text-gradient-primary">PriceHunter</span>?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            We don't just compare prices—we actively hunt for the best deals using cutting-edge AI technology.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-border bg-gradient-card p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-glow"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>

              <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>

              {/* Hover gradient */}
              <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
