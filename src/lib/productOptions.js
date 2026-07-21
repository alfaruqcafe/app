// Produkt-Options-System (Code-Konfiguration)
// -------------------------------------------------
// Options-Items (Toppings, Getränke, Extras) kommen LIVE aus der Speisekarte,
// damit "Ausverkauft" und Preise immer aktuell sind. Diese Datei definiert nur,
// WELCHES Produkt WELCHE Options-Gruppen besitzt (Name-basiert).

// Kategorien, die reine Options-Pools sind und NICHT als eigene Produktkarten
// im Kunden-Menü erscheinen sollen.
export const HIDDEN_OPTION_CATEGORIES = ['Toppings', 'Getränke-Extras'];

// Kategorien, deren Artikel als "Getränk" gelten (für Getränkeauswahl im Menü).
export const DRINK_CATEGORIES = ['Heißgetränke', 'Tee', 'Erfrischungsgetränke'];

// Getränke aus diesen Kategorien bekommen keine (Zucker-)Extras.
export const NO_EXTRA_CATEGORIES = ['Erfrischungsgetränke'];

// Kategorie, aus der die Getränke-Extras (Zucker etc.) stammen.
const EXTRAS_CATEGORY = 'Getränke-Extras';
const TOPPINGS_CATEGORY = 'Toppings';

// Welche Extras gelten für welches Getränk. Fallback: default (Zucker).
export const DRINK_EXTRAS = {
  default: ['Weißer Zucker', 'Brauner Zucker', 'Süßstoff'],
  // Beispiel für Überschreibung pro Getränk:
  // 'Minz-Tee': ['Weißer Zucker', 'Brauner Zucker', 'Süßstoff', 'Honig'],
};

// Produkt-spezifische Konfiguration (keyed nach exaktem Produktnamen).
// groups: { kind, title, drink? }
//   toppings    – Mehrfachauswahl aus Kategorie "Toppings"
//   drinkChoice – Einfachauswahl aus den Getränke-Kategorien; danach Extras des gewählten Getränks
//   fixedDrink  – festes Getränk (drink = Name); nur dessen Extras
//   selfExtras  – Extras des Produkts selbst (z. B. Zucker beim Einzel-Getränk)
export const PRODUCT_CONFIG = {
  // Echte Menü-Namen aus der Datenbank (Kategorie "Menüs").
  '2x Waffel + 1 Getränk': {
    isMenu: true,
    groups: [
      { kind: 'toppings', title: 'Waffel-Toppings' },
      { kind: 'drinkChoice', title: 'Getränk auswählen' },
    ],
  },
  '2x Waffel': {
    isMenu: true,
    groups: [
      { kind: 'toppings', title: 'Waffel-Toppings' },
    ],
  },
};

// ---------- Helfer ----------

function findCategoryByName(categories, name) {
  return categories.find(c => c.name === name) || null;
}

function itemsOfCategory(categories, name) {
  const cat = findCategoryByName(categories, name);
  return cat ? cat.items : [];
}

// Kategorie-Name eines Getränks (per Item-Name) finden.
function categoryNameOfItem(categories, itemName) {
  for (const cat of categories) {
    if (cat.items.some(i => i.name === itemName)) return cat.name;
  }
  return null;
}

// Extras (als Item-Objekte) für ein Getränk auflösen.
export function getExtrasForDrink(drinkName, categories) {
  const catName = categoryNameOfItem(categories, drinkName);
  if (catName && NO_EXTRA_CATEGORIES.includes(catName)) return [];
  const names = DRINK_EXTRAS[drinkName] || DRINK_EXTRAS.default;
  const pool = itemsOfCategory(categories, EXTRAS_CATEGORY);
  // Reihenfolge aus DRINK_EXTRAS beibehalten; nur vorhandene Items zurückgeben.
  return names
    .map(n => pool.find(i => i.name === n))
    .filter(Boolean);
}

// Ist das Produkt ein Getränk (für default selfExtras)?
function isDrinkProduct(product, categories) {
  const catName = categoryNameOfItem(categories, product.name);
  return catName ? DRINK_CATEGORIES.includes(catName) : false;
}

// Löst die Options-Gruppen eines Produkts zu LIVE-Items auf.
// Rückgabe: { isMenu, groups: [...] } — groups je nach kind unterschiedlich befüllt.
export function resolveProductOptions(product, categories) {
  if (!product || !categories) return { isMenu: false, groups: [] };

  let config = PRODUCT_CONFIG[product.name];

  // Default: Einzel-Getränk bekommt eine selfExtras-Gruppe (Zucker etc.)
  if (!config) {
    if (isDrinkProduct(product, categories) && getExtrasForDrink(product.name, categories).length > 0) {
      config = { isMenu: false, groups: [{ kind: 'selfExtras', title: 'Extras' }] };
    } else {
      return { isMenu: false, groups: [] };
    }
  }

  const groups = config.groups.map(g => {
    switch (g.kind) {
      case 'toppings':
        return { kind: 'toppings', title: g.title, items: itemsOfCategory(categories, TOPPINGS_CATEGORY) };
      case 'drinkChoice': {
        const drinks = DRINK_CATEGORIES.flatMap(cn => itemsOfCategory(categories, cn));
        return { kind: 'drinkChoice', title: g.title, drinks };
      }
      case 'fixedDrink': {
        const drink = categories.flatMap(c => c.items).find(i => i.name === g.drink) || null;
        return { kind: 'fixedDrink', title: g.title, drink, extras: getExtrasForDrink(g.drink, categories) };
      }
      case 'selfExtras':
        return { kind: 'selfExtras', title: g.title, extras: getExtrasForDrink(product.name, categories) };
      default:
        return null;
    }
  }).filter(Boolean);

  return { isMenu: !!config.isMenu, groups };
}

// Ob das Produkt überhaupt konfigurierbare Optionen hat.
export function hasOptions(product, categories) {
  return resolveProductOptions(product, categories).groups.length > 0;
}

// Kosten eines Options-Items: erste Portion im Menü gratis.
export function optionCost(price, qty, isMenu) {
  const charged = isMenu ? Math.max(0, qty - 1) : qty;
  return charged * price;
}

// Einzelpreis eines konfigurierten Produkts (Basis + Extras für EIN Produkt).
// options: [{ price, qty }] — enthält NUR bepreiste Extras/Toppings (nicht das Getränk selbst).
export function computeUnitPrice(basePrice, options, isMenu) {
  return options.reduce((sum, o) => sum + optionCost(o.price, o.qty, isMenu), 0) + basePrice;
}

// Lesbare Aufschlüsselung der gewählten Optionen (für Warenkorb & Bestell-Notiz).
// options: [{ groupTitle, name, qty, lineTotal, free, isDrink }]
export function buildOptionsSummary(options) {
  return options.map(o => {
    if (o.isDrink) return `Getränk: ${o.name}`;
    const qtyPart = o.qty > 1 ? `${o.qty}× ` : '';
    const pricePart = o.lineTotal > 0 ? ` (${o.lineTotal.toFixed(2)} €)` : (o.free ? ' (inkl.)' : '');
    return `${qtyPart}${o.name}${pricePart}`;
  });
}
