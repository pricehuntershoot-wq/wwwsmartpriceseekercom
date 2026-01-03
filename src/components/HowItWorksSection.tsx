import { Bot, Brain, Eye, MousePointer, ShoppingCart, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Eye,
    title: "AI Agent Visits Shop",
    description: "Our intelligent agent opens the e-shop in a real browser, just like a human customer would.",
    color: "primary",
  },
  {
    icon: Brain,
    title: "AI Brain Analyzes",
    description: "Gemini AI understands the page structure, identifies products, prices, and hidden promotions.",
    color: "accent",
  },
  {
    icon: MousePointer,
    title: "Simulates Actions",
    description: "The agent clicks buttons, adds items to cart, and reveals discounts that only appear after interaction.",
    color: "primary",
  },
  {
    icon: ShoppingCart,
    title: "Discovers Hidden Deals",
    description: "Uncovers cart-only discounts, returned item prices, and special offers invisible to traditional comparators.",
    color: "accent",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="relative py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="container relative z-10">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Intelligent Automation</span>
          </div>
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            How Our <span className="text-gradient-primary">AI Agents</span> Work
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Unlike passive price comparators, our system actively explores e-shops 
            to find deals that are hidden from traditional data feeds.
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-primary/50 via-accent/50 to-primary/50 md:block" />

          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`relative ${index % 2 === 1 ? "md:mt-24" : ""}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="group relative rounded-2xl border border-border bg-gradient-card p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-glow">
                  {/* Step number */}
                  <div className="absolute -top-4 left-8 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl ${
                    step.color === "primary" ? "bg-primary/20" : "bg-accent/20"
                  }`}>
                    <step.icon className={`h-7 w-7 ${
                      step.color === "primary" ? "text-primary" : "text-accent"
                    }`} />
                  </div>

                  <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>

                  {/* Decorative sparkle */}
                  <Sparkles className="absolute bottom-4 right-4 h-5 w-5 text-muted-foreground/20 transition-colors group-hover:text-primary/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
