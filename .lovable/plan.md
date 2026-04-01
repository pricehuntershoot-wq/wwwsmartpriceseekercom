

## Problem

Edge funkce `search-eshops` vrací `{ products: [] }` i když AI request proběhne úspěšně (status 200). Log ukazuje:
- "AI succeeded with model: google/gemini-2.5-flash-lite"
- "AI extracted 0 products"

Regex fallback se spouští jen když `aiResponse` je `null` (AI úplně nedostupná). Když AI odpoví ale vrátí prázdné pole, fallback se přeskočí.

## Root cause

1. **`gemini-2.5-flash-lite` je příliš slabý model** na parsování ~30k znaků markdownu z 6 e-shopů — vrací prázdný `products: []`
2. **Chybí fallback na regex při 0 výsledcích z AI** — kód kontroluje jen `if (!aiResponse)`, ne `if (products.length === 0)`

## Plan

### 1. Přidat fallback na regex když AI vrátí 0 produktů

V `supabase/functions/search-eshops/index.ts` (řádky ~627-654):

```ts
if (!aiResponse) {
  products = regexFallbackParse(scrapeResults, trimmedQuery);
} else {
  // ... parse AI response ...
  if (products.length === 0) {
    console.log('AI returned 0 products, falling back to regex...');
    products = regexFallbackParse(scrapeResults, trimmedQuery);
  }
}
```

### 2. Změnit pořadí modelů — lite jako poslední

Přesunout `gemini-2.5-flash-lite` na konec seznamu a začít se silnějším modelem:

```ts
const models = [
  { name: 'google/gemini-2.5-flash', temperature: 0.1 },
  { name: 'google/gemini-3-flash-preview', temperature: 0.1 },
  { name: 'google/gemini-2.5-flash-lite', temperature: 0.1 },
];
```

### 3. Deploy edge funkce

Nasadit upravenou funkci.

## Technical details

- Soubor: `supabase/functions/search-eshops/index.ts`
- Řádky 577-581: změna pořadí modelů
- Řádky 627-654: přidání fallbacku při `products.length === 0`
- Deploy přes `supabase--deploy_edge_functions`

