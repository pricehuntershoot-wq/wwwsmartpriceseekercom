import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ShopComparisonCard } from "@/components/ShopComparisonCard";
import { Headphones, Smartphone, Tv, Tablet } from "lucide-react";

const s = (alza: number, smarty: number, datart: number) => [
  { shop: "Alza.cz", price: alza, url: "https://www.alza.cz" },
  { shop: "Smarty.cz", price: smarty, url: "https://www.smarty.cz" },
  { shop: "Datart.cz", price: datart, url: "https://www.datart.cz" },
];

const HEADPHONES_DATA = [
  { name: "Sony WH-1000XM5", image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop", shops: s(7490, 7290, 7690) },
  { name: "Apple AirPods Pro 2 (USB-C)", image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop", shops: s(6490, 6690, 6290) },
  { name: "Bose QuietComfort Ultra", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop", shops: s(9990, 9490, 9790) },
  { name: "Samsung Galaxy Buds3 Pro", image: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop", shops: s(5290, 5490, 5190) },
  { name: "Sennheiser Momentum 4", image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=400&fit=crop", shops: s(8490, 8290, 8690) },
  { name: "JBL Tune 770NC", image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop", shops: s(1990, 2190, 1890) },
  { name: "Apple AirPods Max (USB-C)", image: "https://images.unsplash.com/photo-1625245488600-f03fef636a3c?w=400&h=400&fit=crop", shops: s(14990, 14790, 15290) },
  { name: "Sony WF-1000XM5", image: "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=400&h=400&fit=crop", shops: s(5990, 5790, 6190) },
  { name: "Beyerdynamic DT 900 Pro X", image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop", shops: s(6790, 6990, 6790) },
  { name: "Marshall Major V", image: "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=400&h=400&fit=crop", shops: s(2990, 2790, 3190) },
];

const MOBILE_DATA = [
  { name: "Apple iPhone 15 Pro Max 256GB", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop", shops: s(34990, 33990, 35490) },
  { name: "Samsung Galaxy S24 Ultra 256GB", image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop", shops: s(31990, 30990, 32490) },
  { name: "Google Pixel 8 Pro", image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop", shops: s(22990, 21990, 23490) },
  { name: "OnePlus 12 256GB", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop", shops: s(21990, 20990, 22490) },
  { name: "Xiaomi 14 Ultra", image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop", shops: s(27990, 26490, 27490) },
  { name: "Samsung Galaxy Z Flip5", image: "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&h=400&fit=crop", shops: s(24990, 23990, 25490) },
  { name: "Apple iPhone 15 128GB", image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&h=400&fit=crop", shops: s(22990, 22490, 23490) },
  { name: "Nothing Phone (2)", image: "https://images.unsplash.com/photo-1533228100845-08145b01de14?w=400&h=400&fit=crop", shops: s(15990, 14990, 16490) },
  { name: "Samsung Galaxy A55 5G", image: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop", shops: s(10990, 10490, 11290) },
  { name: "Motorola Edge 50 Pro", image: "https://images.unsplash.com/photo-1512054502232-10a0a035d672?w=400&h=400&fit=crop", shops: s(13990, 12990, 14490) },
];

const TV_DATA = [
  { name: "Samsung QE65S95D OLED 65\"", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop", shops: s(49990, 47990, 51990) },
  { name: "LG OLED65C4 65\"", image: "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=400&h=400&fit=crop", shops: s(39990, 38490, 41990) },
  { name: "Sony XR-55A95L OLED 55\"", image: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400&h=400&fit=crop", shops: s(44990, 42990, 45990) },
  { name: "TCL 65C845 MiniLED 65\"", image: "https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=400&h=400&fit=crop", shops: s(22990, 21490, 23990) },
  { name: "Hisense 65U8KQ MiniLED 65\"", image: "https://images.unsplash.com/photo-1558888401-3cc1de77652d?w=400&h=400&fit=crop", shops: s(24990, 23990, 25990) },
  { name: "Samsung QE55Q80D QLED 55\"", image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&h=400&fit=crop", shops: s(22990, 21990, 23490) },
  { name: "LG 55QNED86 55\"", image: "https://images.unsplash.com/photo-1571415060716-baff5f717c37?w=400&h=400&fit=crop", shops: s(17990, 16990, 18490) },
  { name: "Sony KD-55X85L 55\"", image: "https://images.unsplash.com/photo-1601944179066-29786cb9d32a?w=400&h=400&fit=crop", shops: s(18990, 17990, 19490) },
  { name: "Philips 65PUS8808 65\"", image: "https://images.unsplash.com/photo-1574375927938-d5a98e8d7e28?w=400&h=400&fit=crop", shops: s(19990, 18490, 20990) },
  { name: "Samsung QE75Q60D QLED 75\"", image: "https://images.unsplash.com/photo-1539786774582-0707555f1f72?w=400&h=400&fit=crop", shops: s(29990, 28990, 31490) },
];

const TABLET_DATA = [
  { name: "Apple iPad Pro 13\" M4 256GB", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop", shops: s(33990, 32990, 34990) },
  { name: "Samsung Galaxy Tab S9 Ultra", image: "https://images.unsplash.com/photo-1561154464-82e9aab32f65?w=400&h=400&fit=crop", shops: s(29990, 28490, 30990) },
  { name: "Apple iPad Air 11\" M2 128GB", image: "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=400&h=400&fit=crop", shops: s(17990, 17490, 18490) },
  { name: "Samsung Galaxy Tab S9 FE", image: "https://images.unsplash.com/photo-1632882765546-1ee75f53becb?w=400&h=400&fit=crop", shops: s(11990, 11490, 12490) },
  { name: "Lenovo Tab P12 Pro", image: "https://images.unsplash.com/photo-1589739900243-4b52cd9dd846?w=400&h=400&fit=crop", shops: s(12990, 11990, 13490) },
  { name: "Apple iPad 10. generace 64GB", image: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=400&h=400&fit=crop", shops: s(10990, 10490, 11490) },
  { name: "Xiaomi Pad 6 256GB", image: "https://images.unsplash.com/photo-1527698266440-12104e498b76?w=400&h=400&fit=crop", shops: s(8990, 8490, 9490) },
  { name: "Samsung Galaxy Tab A9+", image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=400&fit=crop", shops: s(6990, 6490, 7490) },
  { name: "OnePlus Pad 2", image: "https://images.unsplash.com/photo-1623126908029-58cb08a2b272?w=400&h=400&fit=crop", shops: s(11990, 10990, 12490) },
  { name: "Apple iPad mini 6. gen 64GB", image: "https://images.unsplash.com/photo-1471897488648-5eae4ac6686b?w=400&h=400&fit=crop", shops: s(14990, 14490, 15490) },
];

type CategoryProduct = { name: string; image: string; shops: { shop: string; price: number; url: string }[] };

const CATEGORY_CONFIG: Record<string, { title: string; icon: typeof Headphones; data: CategoryProduct[] }> = {
  Headphones: { title: "Sluchátka", icon: Headphones, data: HEADPHONES_DATA },
  mobile_phones: { title: "Mobilní telefony", icon: Smartphone, data: MOBILE_DATA },
  tv: { title: "Televize", icon: Tv, data: TV_DATA },
  tablets: { title: "Tablety", icon: Tablet, data: TABLET_DATA },
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
