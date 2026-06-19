export const MOCK_CATEGORIES = [
  {
    id: 1, name: "Heißgetränke",
    items: [
      { id: 1, name: "Espresso", description: "Klassischer italienischer Espresso", price: 2.50, available: true, isExtra: false },
      { id: 2, name: "Cappuccino", description: "Espresso mit aufgeschäumter Milch", price: 3.20, available: true, isExtra: false },
      { id: 3, name: "Latte Macchiato", description: "Milch mit einem Schuss Espresso", price: 3.80, available: true, isExtra: false },
      { id: 4, name: "Mocaccino", description: "Espresso mit Schokolade & Milch", price: 4.00, available: true, isExtra: false },
      { id: 5, name: "Café Lungo", description: "Verlängerter Espresso", price: 2.80, available: true, isExtra: false },
      { id: 6, name: "Espresso Doppio", description: "Doppelter Espresso", price: 3.50, available: true, isExtra: false },
    ]
  },
  {
    id: 2, name: "Tee",
    items: [
      { id: 7, name: "Minz-Tee", description: "Frischer Pfefferminztee", price: 2.50, available: true, isExtra: false },
      { id: 8, name: "Schwarztee", description: "Klassischer Schwarztee", price: 2.00, available: true, isExtra: false },
      { id: 9, name: "Kamillentee", description: "Beruhigender Kamillentee", price: 2.00, available: true, isExtra: false },
    ]
  },
  {
    id: 3, name: "Erfrischungsgetränke",
    items: [
      { id: 10, name: "Blue Wave", description: "Blaue Limonade mit Minze", price: 3.99, available: true, isExtra: false },
      { id: 11, name: "Golden Rush", description: "Goldene Ingwer-Limonade", price: 3.99, available: true, isExtra: false },
      { id: 12, name: "Red Pulse", description: "Rote Beeren-Limonade", price: 3.99, available: true, isExtra: false },
    ]
  },
  {
    id: 4, name: "Snacks",
    items: [
      { id: 13, name: "Nachos & Dip", description: "Knusprige Nachos mit Salsa", price: 4.50, available: true, isExtra: false },
      { id: 14, name: "Warme Waffeln", description: "Frische Waffeln mit Belag", price: 3.50, available: true, isExtra: false },
      { id: 15, name: "Kakao (Hot/Cold)", description: "Heiße oder kalte Schokolade", price: 3.00, available: true, isExtra: false },
      { id: 16, name: "Extra Sirup", description: "Vanille, Karamell oder Haselnuss", price: 0.50, available: true, isExtra: true },
      { id: 17, name: "Extra Shot", description: "Zusätzlicher Espresso Shot", price: 0.80, available: true, isExtra: true },
    ]
  }
];

export const MOCK_EVENTS = [
  { id: 1, title: "Freitagsgebet & Kaffee", type: "open", startDate: "2025-07-11T13:00:00", endDate: "2025-07-11T15:00:00", location: "Hauptsaal", description: "Nach dem Freitagsgebet laden wir zum gemeinsamen Kaffee ein.", maxParticipants: null, currentParticipants: null, registrationRequired: false },
  { id: 2, title: "Arabisch-Kurs Anfänger", type: "seminar", startDate: "2025-07-12T10:00:00", endDate: "2025-07-12T12:00:00", location: "Seminarraum 1", description: "Einführungskurs in die arabische Sprache für Anfänger.", maxParticipants: 20, currentParticipants: 14, registrationRequired: true },
  { id: 3, title: "Jugendtreff", type: "other", startDate: "2025-07-13T17:00:00", endDate: "2025-07-13T20:00:00", location: "Café Bereich", description: "Monatlicher Jugendtreff mit Spielen, Essen und Gesprächen.", maxParticipants: 30, currentParticipants: 22, registrationRequired: false },
  { id: 4, title: "Ramadan Vorbereitung", type: "seminar", startDate: "2025-07-18T19:00:00", endDate: "2025-07-18T21:00:00", location: "Hauptsaal", description: "Vortrag zur Vorbereitung auf den heiligen Monat.", maxParticipants: 50, currentParticipants: 31, registrationRequired: true },
];

export const SOFT_DRINK_COLORS = {
  "Blue Wave": "linear-gradient(135deg,#1a3c6e,#2d7dd2,#56b4d3)",
  "Golden Rush": "linear-gradient(135deg,#7b4f00,#c8860a,#f0c040)",
  "Red Pulse": "linear-gradient(135deg,#6e1a1a,#c22a2a,#f06060)",
};

export const EVENT_TYPE_STYLES = {
  open: { label: "Geöffnet", bg: "#d1fae5", color: "#065f46" },
  closed: { label: "Geschlossen", bg: "#fee2e2", color: "#991b1b" },
  seminar: { label: "Seminar", bg: "#dbeafe", color: "#1e40af" },
  public_viewing: { label: "Public Viewing", bg: "#ede9fe", color: "#5b21b6" },
  other: { label: "Veranstaltung", bg: "#fef3c7", color: "#92400e" },
};
