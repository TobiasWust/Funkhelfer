// Kanal- und Frequenzdaten. Quellen: Bundesnetzagentur Vfg. 91/2025 (PMR446, LPD),
// Vfg. 45/2025 (Freenet), ECC/DEC/(15)05; Luft-Luft-Kanäle laut DHV-Infoblatt Flugfunk 04/2025.

const range = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));

export const SERVICES = [
  {
    id: 'pmr',
    label: 'PMR446',
    short: 'PMR',
    unit: 'MHz',
    note: '16 Kanäle, 0,5 W, ohne Lizenz. Kanäle 9–16 sind meist freier, aber ältere Geräte kennen nur 1–8.',
    channels: range(16, (i) => ({
      ch: i + 1,
      mhz: 446.00625 + i * 0.0125,
      digits: 5,
      tag: i >= 8 ? 'neu' : null,
    })),
  },
  {
    id: 'lpd',
    label: 'LPD 433',
    short: 'LPD',
    unit: 'MHz',
    note: '69 Kanäle, nur 10 mW. Reicht am Landeplatz, für die Gruppe in der Luft ist PMR besser.',
    channels: range(69, (i) => ({ ch: i + 1, mhz: 433.075 + i * 0.025, digits: 3 })),
  },
  {
    id: 'freenet',
    label: 'Freenet',
    short: 'Freenet',
    unit: 'MHz',
    note: '6 Kanäle, 1 W, ohne Lizenz. Nur in Deutschland erlaubt, in der Schweiz verboten.',
    channels: [149.025, 149.0375, 149.05, 149.0875, 149.1, 149.1125].map((mhz, i) => ({
      ch: i + 1,
      mhz,
      digits: 4,
    })),
  },
];

export const CTCSS = [
  67.0, 71.9, 74.4, 77.0, 79.7, 82.5, 85.4, 88.5, 91.5, 94.8, 97.4, 100.0, 103.5, 107.2, 110.9,
  114.8, 118.8, 123.0, 127.3, 131.8, 136.5, 141.3, 146.2, 151.4, 156.7, 162.2, 167.9, 173.8,
  179.9, 186.2, 192.8, 203.5, 210.7, 218.1, 225.7, 233.6, 241.8, 250.3,
].map((hz, i) => ({ ch: i + 1, hz }));

export const AIR_TO_AIR = [
  { mhz: '123,065', where: 'bundesweit' },
  { mhz: '123,135', where: 'bundesweit' },
  { mhz: '121,290', where: 'Alpen und Allgäu' },
];

const nf = new Map();
export function fmt(value, digits) {
  if (!nf.has(digits)) {
    nf.set(digits, new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits }));
  }
  return nf.get(digits).format(value);
}

export const service = (id) => SERVICES.find((s) => s.id === id);
export const tone = (n) => CTCSS.find((t) => t.ch === n);
