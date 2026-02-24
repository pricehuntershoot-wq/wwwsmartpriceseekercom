import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ShopComparisonCard } from "@/components/ShopComparisonCard";
import { Headphones } from "lucide-react";

const HEADPHONES_DATA = [
  {
    name: "Sony WH-1000XM5",
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop",
    shops: [
      { shop: "Alza.cz", price: 7490, url: "https://www.alza.cz" },
      { shop: "Smarty.cz", price: 7290, url: "https://www.smarty.cz" },
      { shop: "Datart.cz", price: 7690, url: "https://www.datart.cz" },
    ],
  },
  {
    name: "Apple AirPods Pro 2 (USB-C)",
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop",
    shops: [
      { shop: "Alza.cz", price: 6490, url: "https://www.alza.cz" },
      { shop: "Smarty.cz", price: 6690, url: "https://www.smarty.cz" },
      { shop: "Datart.cz", price: 6290, url: "https://www.datart.cz" },
    ],
  },
  {
    name: "Bose QuietComfort Ultra Headphones",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    shops: [
      { shop: "Alza.cz", price: 9990, url: "https://www.alza.cz" },
      { shop: "Smarty.cz", price: 9490, url: "https://www.smarty.cz" },
      { shop: "Datart.cz", price: 9790, url: "https://www.datart.cz" },
    ],
  },
  {
    name: "Samsung Galaxy Buds3 Pro",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop",
    shops: [
      { shop: "Alza.cz", price: 5290, url: "https://www.alza.cz" },
      { shop: "Smarty.cz", price: 5490, url: "https://www.smarty.cz" },
      { shop: "Datart.cz", price: 5190, url: "https://www.datart.cz" },
    ],
  },
  {
    name: "Sennheiser Momentum 4 Wireless",
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=400&fit=crop",
    shops: [
      { shop: "Alza.cz", price: 8490, url: "https://www.alza.cz" },
      { shop: "Smarty.cz", price: 8290, url: "https://www.smarty.cz" },
      { shop: "Datart.cz", price: 8690, url: "https://www.datart.cz" },
    ],
  },
  {
    name: "JBL Tune 770NC",
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop",
    shops: [
      { shop: "Alza.cz", price: 1990, url: "https://www.alza.cz" },
      { shop: "Smarty.cz", price: 2190, url: "https://www.smarty.cz" },
      { shop: "Datart.cz", price: 1890, url: "https://www.datart.cz" },
    ],
  },
  {
    name: "Apple AirPods Max (USB-C)",
    image: "https://images.unsplash.com/photo-1625245488600-f03fef636a3c?w=400&h=400&fit=crop",
    shops: [
      { shop: "Alza.cz", price: 14990, url: "https://www.alza.cz" },
      { shop: "Smarty.cz", price: 14790, url: "https://www.smarty.cz" },
      { shop: "Datart.cz", price: 15290, url: "https://www.datart.cz" },
    ],
  },
  {
    name: "Sony WF-1000XM5",
    image: "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400&h=400&fit=crop",
    shops: [
      { shop: "Alza.cz", price: 5990, url: "https://www.alza.cz" },
      { shop: "Smarty.cz", price: 5790, url: "https://www.smarty.cz" },
      { shop: "Datart.cz", price: 6190, url: "https://www.datart.cz" },
    ],
  },
  {
    name: "Beyerdynamic DT 900 Pro X",
    image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop",
    shops: [
      { shop: "Alza.cz", price: 6790, url: "https://www.alza.cz" },
      { shop: "Smarty.cz", price: 6990, url: "https://www.smarty.cz" },
      { shop: "Datart.cz", price: 6790, url: "https://www.datart.cz" },
    ],
  },
  {
    name: "Marshall Major V",
    image: "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=400&h=400&fit=crop",
    shops: [
      { shop: "Alza.cz", price: 2990, url: "https://www.alza.cz" },
      { shop: "Smarty.cz", price: 2790, url: "https://www.smarty.cz" },
      { shop: "Datart.cz", price: 3190, url: "https://www.datart.cz" },
    ],
  },
];

const CATEGORY_CONFIG: Record<string, { title: string; icon: typeof Headphones; data: typeof HEADPHONES_DATA }> = {
  Headphones: { title: "Sluchátka", icon: Headphones, data: HEADPHONES_DATA },
};

const CategoryProducts = () => {
  const { slug } = useParams<{ slug: string }>();
  const config = CATEGORY_CONFIG[slug || ""] || CATEGORY_CONFIG["Headphones"];
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pt-24 pb-12">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-heading text-3xl font-bold sm:text-4xl">
              {config.title}
            </h1>
          </div>
          <p className="text-muted-foreground">
            Porovnání cen ze 3 obchodů — nejnižší cena je označena jako{" "}
            <span className="font-bold text-[hsl(54,100%,50%)]">Hunterův úlovek</span>
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {config.data.map((product, i) => (
            <div
              key={product.name}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <ShopComparisonCard product={product} />
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CategoryProducts;
