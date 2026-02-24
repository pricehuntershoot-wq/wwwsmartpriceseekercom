import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ShopComparisonCard } from "@/components/ShopComparisonCard";
import { Headphones, Smartphone, Tv, Tablet, Watch, Speaker, Gamepad2, CircleDot, Monitor, Cable } from "lucide-react";

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

const WATCHES_DATA = [
  { name: "Apple Watch Series 9 45mm", image: "https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400&h=400&fit=crop", shops: s(11990, 11490, 12490) },
  { name: "Samsung Galaxy Watch6 Classic 47mm", image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop", shops: s(9990, 9490, 10490) },
  { name: "Apple Watch Ultra 2", image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&h=400&fit=crop", shops: s(22990, 21990, 23490) },
  { name: "Garmin Venu 3", image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&h=400&fit=crop", shops: s(12490, 11990, 12990) },
  { name: "Google Pixel Watch 2", image: "https://images.unsplash.com/photo-1617625802912-cde586faf331?w=400&h=400&fit=crop", shops: s(9490, 8990, 9990) },
  { name: "Garmin Fenix 7X Pro", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop", shops: s(19990, 18990, 20490) },
  { name: "Samsung Galaxy Watch FE", image: "https://images.unsplash.com/photo-1553545204-4f7d339aa06a?w=400&h=400&fit=crop", shops: s(5490, 4990, 5990) },
  { name: "Apple Watch SE 2. gen 44mm", image: "https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&h=400&fit=crop", shops: s(7990, 7490, 8490) },
  { name: "Xiaomi Watch 2 Pro", image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=400&h=400&fit=crop", shops: s(6990, 6490, 7490) },
  { name: "Withings ScanWatch 2", image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400&h=400&fit=crop", shops: s(8990, 8490, 9490) },
];

const SPEAKERS_DATA = [
  { name: "Sonos Era 300", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop", shops: s(11990, 11490, 12490) },
  { name: "JBL Charge 5", image: "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=400&h=400&fit=crop", shops: s(3990, 3690, 4290) },
  { name: "Marshall Stanmore III", image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&h=400&fit=crop", shops: s(9990, 9490, 10490) },
  { name: "Bose SoundLink Max", image: "https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=400&h=400&fit=crop", shops: s(8990, 8490, 9490) },
  { name: "Sonos Move 2", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop", shops: s(12490, 11990, 12990) },
  { name: "JBL Flip 6", image: "https://images.unsplash.com/photo-1558537348-c0f8e733989d?w=400&h=400&fit=crop", shops: s(2990, 2790, 3190) },
  { name: "Bang & Olufsen Beosound A1", image: "https://images.unsplash.com/photo-1548921441-89c8bd0e6f54?w=400&h=400&fit=crop", shops: s(6990, 6490, 7490) },
  { name: "Ultimate Ears Megaboom 4", image: "https://images.unsplash.com/photo-1564424224827-cd24b8915874?w=400&h=400&fit=crop", shops: s(5490, 4990, 5990) },
  { name: "Sony SRS-XB100", image: "https://images.unsplash.com/photo-1518893063132-36e46dbe2428?w=400&h=400&fit=crop", shops: s(1490, 1290, 1590) },
  { name: "Harman Kardon Aura Studio 4", image: "https://images.unsplash.com/photo-1462638379155-7a72b06e6b76?w=400&h=400&fit=crop", shops: s(7990, 7490, 8490) },
];

const GAMING_DATA = [
  { name: "PlayStation 5 Slim", image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop", shops: s(13990, 13490, 14490) },
  { name: "Xbox Series X", image: "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400&h=400&fit=crop", shops: s(12990, 11990, 13490) },
  { name: "Nintendo Switch OLED", image: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=400&fit=crop", shops: s(8990, 8490, 9490) },
  { name: "PlayStation 5 Digital Edition", image: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400&h=400&fit=crop", shops: s(10990, 10490, 11490) },
  { name: "Xbox Series S 1TB", image: "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=400&fit=crop", shops: s(7990, 7490, 8490) },
  { name: "Steam Deck OLED 512GB", image: "https://images.unsplash.com/photo-1640955014216-75201056c829?w=400&h=400&fit=crop", shops: s(14990, 13990, 15490) },
  { name: "Nintendo Switch Lite", image: "https://images.unsplash.com/photo-1585620385456-4759f9b5c7d9?w=400&h=400&fit=crop", shops: s(5490, 4990, 5990) },
  { name: "ASUS ROG Ally", image: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=400&fit=crop", shops: s(17990, 16990, 18490) },
  { name: "Meta Quest 3 128GB", image: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=400&h=400&fit=crop", shops: s(13490, 12990, 13990) },
  { name: "Lenovo Legion Go", image: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&h=400&fit=crop", shops: s(19990, 18490, 20490) },
];

const SMART_RINGS_DATA = [
  { name: "Oura Ring Gen 3 Heritage", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop", shops: s(8990, 8490, 9490) },
  { name: "Samsung Galaxy Ring", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=400&fit=crop", shops: s(9990, 9490, 10490) },
  { name: "Oura Ring Gen 3 Horizon", image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop", shops: s(9490, 8990, 9990) },
  { name: "Ultrahuman Ring Air", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop", shops: s(9990, 9290, 10490) },
  { name: "RingConn Smart Ring", image: "https://images.unsplash.com/photo-1602752250015-52934bc45613?w=400&h=400&fit=crop", shops: s(4990, 4490, 5490) },
  { name: "Circular Ring Slim", image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop", shops: s(6990, 6490, 7490) },
  { name: "Amazfit Helio Ring", image: "https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=400&h=400&fit=crop", shops: s(5990, 5490, 6490) },
  { name: "Oura Ring Gen 3 Gucci Edition", image: "https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=400&h=400&fit=crop", shops: s(12990, 12490, 13490) },
  { name: "Movano Evie Ring", image: "https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=400&h=400&fit=crop", shops: s(7990, 7490, 8490) },
  { name: "Happy Ring", image: "https://images.unsplash.com/photo-1586104237886-89307f67d868?w=400&h=400&fit=crop", shops: s(3990, 3490, 4490) },
];

const PC_DATA = [
  { name: "Apple MacBook Air 15\" M3", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop", shops: s(37990, 36990, 38990) },
  { name: "Lenovo ThinkPad X1 Carbon Gen 11", image: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=400&h=400&fit=crop", shops: s(42990, 40990, 43990) },
  { name: "ASUS ROG Strix G16 (2024)", image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=400&fit=crop", shops: s(34990, 33490, 35990) },
  { name: "Apple MacBook Pro 14\" M3 Pro", image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop", shops: s(54990, 52990, 55990) },
  { name: "Dell XPS 15 (2024)", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop", shops: s(38990, 37490, 39990) },
  { name: "HP Pavilion Desktop TP01", image: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&h=400&fit=crop", shops: s(18990, 17990, 19490) },
  { name: "Acer Nitro 5 AN515", image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop", shops: s(24990, 23990, 25990) },
  { name: "Lenovo IdeaCentre 5i", image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&h=400&fit=crop", shops: s(16990, 15990, 17490) },
  { name: "Apple Mac mini M2", image: "https://images.unsplash.com/photo-1619953942547-233eab5a70d6?w=400&h=400&fit=crop", shops: s(15990, 14990, 16490) },
  { name: "MSI Katana GF66", image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=400&fit=crop", shops: s(21990, 20490, 22990) },
];

const ACCESSORIES_DATA = [
  { name: "Apple MagSafe Charger", image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop", shops: s(1090, 990, 1190) },
  { name: "Anker PowerBank 26800mAh", image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop", shops: s(1490, 1290, 1590) },
  { name: "Samsung 45W USB-C nabíječka", image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop", shops: s(990, 890, 1090) },
  { name: "Logitech MX Master 3S", image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop", shops: s(2490, 2290, 2690) },
  { name: "Apple Magic Keyboard s Touch ID", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop", shops: s(3990, 3790, 4190) },
  { name: "SanDisk Extreme Pro 1TB SSD", image: "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400&h=400&fit=crop", shops: s(3490, 3190, 3690) },
  { name: "Spigen Ultra Hybrid (iPhone 15 Pro)", image: "https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=400&fit=crop", shops: s(690, 590, 790) },
  { name: "Belkin BoostCharge Pro 3v1", image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop", shops: s(3490, 3290, 3690) },
  { name: "Apple Pencil (USB-C)", image: "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=400&h=400&fit=crop", shops: s(2190, 1990, 2390) },
  { name: "Samsung SmartTag2 (4 pack)", image: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop", shops: s(2490, 2190, 2690) },
];

type CategoryProduct = { name: string; image: string; shops: { shop: string; price: number; url: string }[] };

const CATEGORY_CONFIG: Record<string, { title: string; icon: typeof Headphones; data: CategoryProduct[] }> = {
  Headphones: { title: "Sluchátka", icon: Headphones, data: HEADPHONES_DATA },
  mobile_phones: { title: "Mobilní telefony", icon: Smartphone, data: MOBILE_DATA },
  tv: { title: "Televize", icon: Tv, data: TV_DATA },
  tablets: { title: "Tablety", icon: Tablet, data: TABLET_DATA },
  smart_watches: { title: "Chytré hodinky", icon: Watch, data: WATCHES_DATA },
  speakers: { title: "Reproduktory", icon: Speaker, data: SPEAKERS_DATA },
  gaming_consoles: { title: "Herní konzole", icon: Gamepad2, data: GAMING_DATA },
  smart_rings: { title: "Chytré prsteny", icon: CircleDot, data: SMART_RINGS_DATA },
  pc: { title: "Počítače", icon: Monitor, data: PC_DATA },
  accessories: { title: "Příslušenství", icon: Cable, data: ACCESSORIES_DATA },
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
