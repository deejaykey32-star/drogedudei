// Pojazdy egzaminacyjne dla kategorii. Wymiary w metrach, prędkości w km/h, przyspieszenie w m/s².
// L – rozstaw osi, steer – max skręt kół (°), trailer – przyczepa/naczepa (Lt – od zaczepu do osi).

// Flota egzaminacyjna WORD Katowice (wg strony word.katowice.pl → „Pojazdy egzaminacyjne WORD”).
// Kategorie, dla których WORD Katowice nie podaje pojazdu, mają pojazd poglądowy (word: false).
// cockpit: styl wnętrza w widoku z miejsca kierowcy; eye: wysokość oczu [m]; seat: przesunięcie fotela w lewo [m].
const M = (o) => ({ reverse: true, word: true, ...o });
export const FLEET = {
  AM: [M({ name: 'Junak 906 (2024)', icon: '🛵', kind: 'moto', cockpit: 'moto', len: 1.8, wid: 0.68, L: 1.25, vmax: 45, acc: 2.2, brake: 6, steer: 38, color: '#2b6cb0', reverse: false, eye: 1.35, note: 'motorower 49 cm³' })],
  A1: [M({ name: 'Yamaha MT-125 (2024)', icon: '🏍️', kind: 'moto', cockpit: 'moto', len: 2.0, wid: 0.8, L: 1.36, vmax: 110, acc: 3.5, brake: 7.5, steer: 36, color: '#1f2a44', reverse: false, eye: 1.45, note: '124 cm³, 11 kW' })],
  A2: [M({ name: 'Yamaha MT-03 (2024)', icon: '🏍️', kind: 'moto', cockpit: 'moto', len: 2.09, wid: 0.75, L: 1.38, vmax: 150, acc: 4.5, brake: 8, steer: 35, color: '#2d7dd2', reverse: false, eye: 1.45, note: '321 cm³, 30,9 kW' })],
  A: [M({ name: 'Suzuki Gladius SFV 650 (2015)', icon: '🏍️', kind: 'moto', cockpit: 'moto', len: 2.13, wid: 0.76, L: 1.45, vmax: 180, acc: 5.5, brake: 8.5, steer: 34, color: '#e8e8e8', reverse: false, eye: 1.5, note: '645 cm³, 53 kW' })],
  B: [
    M({ name: 'Škoda Fabia IV (2025)', icon: '🚗', kind: 'car', cockpit: 'car', len: 4.11, wid: 1.78, L: 2.56, vmax: 160, acc: 3.0, brake: 8, steer: 36, color: '#f2f2f2', eye: 1.15, seat: 0.37, dash: '#2a2d33', note: 'manualna, 5 biegów · Katowice' }),
    M({ name: 'Toyota Yaris (2022)', icon: '🚗', kind: 'car', cockpit: 'car', len: 3.94, wid: 1.75, L: 2.56, vmax: 160, acc: 3.0, brake: 8, steer: 36, color: '#d9d9d9', eye: 1.13, seat: 0.36, dash: '#1f2125', note: 'manualna, 5 biegów · OT Dąbrowa Górnicza' }),
  ],
  'B+E': [
    M({ name: 'VW Transporter T5 + Niewiadów B1400', icon: '🚐', kind: 'car', cockpit: 'van', len: 4.89, wid: 1.9, L: 3.0, vmax: 130, acc: 2.2, brake: 7, steer: 35, color: '#e6e6e6', eye: 1.75, seat: 0.45, dash: '#2a2c30', note: 'przyczepa DMC 1400 kg', trailer: { len: 4.0, wid: 2.0, Lt: 3.4, color: '#bdc3c7', kind: 'box' } }),
    M({ name: 'VW Caravelle + Niewiadów B3500', icon: '🚐', kind: 'car', cockpit: 'van', len: 4.89, wid: 1.9, L: 3.0, vmax: 130, acc: 2.4, brake: 7, steer: 35, color: '#9aa5b1', eye: 1.75, seat: 0.45, dash: '#2a2c30', note: 'przyczepa DMC 1200 kg', trailer: { len: 4.6, wid: 2.1, Lt: 3.9, color: '#c7ccd1', kind: 'box' } }),
  ],
  C: [
    M({ name: 'MAN TGL 12.250 (2018)', icon: '🚚', kind: 'truck', cockpit: 'truck', len: 8.6, wid: 2.5, L: 4.5, vmax: 90, acc: 1.3, brake: 5.5, steer: 40, color: '#e8e8e8', eye: 2.45, seat: 0.6, dash: '#33373d', note: 'manualna z reduktorem (1–4 / 5–8)' }),
    M({ name: 'MAN TGL 12.250 (2013)', icon: '🚚', kind: 'truck', cockpit: 'truck', len: 8.6, wid: 2.5, L: 4.5, vmax: 90, acc: 1.25, brake: 5.5, steer: 40, color: '#dfe6ee', eye: 2.45, seat: 0.6, dash: '#33373d', note: 'manualna z reduktorem (1–4 / 5–8)' }),
  ],
  'C+E': [M({ name: 'MAN TGS 18.360 + naczepa (2021)', icon: '🚛', kind: 'truck', cockpit: 'truck', len: 6.0, wid: 2.5, L: 3.6, vmax: 80, acc: 1.0, brake: 5, steer: 40, color: '#f0f0f0', eye: 2.7, seat: 0.6, dash: '#33373d', note: 'automatyczna · zestaw 16,25 m', trailer: { len: 13.6, wid: 2.55, Lt: 8.2, color: '#d8dde3', kind: 'semi' } })],
  D: [M({ name: 'Solaris Urbino 12 (2014)', icon: '🚌', kind: 'bus', cockpit: 'bus', len: 12, wid: 2.55, L: 5.9, vmax: 90, acc: 1.1, brake: 5.5, steer: 44, color: '#f1c40f', eye: 2.2, seat: 0.55, dash: '#2c2f34', fwdSeat: 0.9, note: 'automatyczna · 12 m' })],
  T: [M({ name: 'Zetor Proxima 8441 + Warfama T-041', icon: '🚜', kind: 'tractor', cockpit: 'tractor', len: 4.2, wid: 2.1, L: 2.3, vmax: 30, acc: 1.4, brake: 5, steer: 40, color: '#c0392b', eye: 2.4, seat: 0, dash: '#3a3a3a', note: 'przyczepa 7 t ładowności', trailer: { len: 5.0, wid: 2.3, Lt: 4.4, color: '#2e86c1', kind: 'farm' } })],
  B1: [M({ name: 'Czterokołowiec (pojazd poglądowy)', icon: '🚙', kind: 'car', cockpit: 'car', len: 3.0, wid: 1.5, L: 2.0, vmax: 90, acc: 2.5, brake: 7, steer: 36, color: '#8e44ad', eye: 1.2, seat: 0.3, dash: '#2a2d33', word: false })],
  C1: [M({ name: 'Ciężarowy 7,5 t (pojazd poglądowy)', icon: '🚚', kind: 'truck', cockpit: 'truck', len: 7.2, wid: 2.4, L: 4.2, vmax: 90, acc: 1.6, brake: 6, steer: 38, color: '#2980b9', eye: 2.3, seat: 0.55, dash: '#33373d', word: false })],
  'C1+E': [M({ name: 'Ciężarowy 7,5 t + przyczepa (poglądowy)', icon: '🚚', kind: 'truck', cockpit: 'truck', len: 7.2, wid: 2.4, L: 4.2, vmax: 80, acc: 1.3, brake: 5.5, steer: 38, color: '#2980b9', eye: 2.3, seat: 0.55, dash: '#33373d', word: false, trailer: { len: 6.0, wid: 2.4, Lt: 5.0, color: '#95a5a6', kind: 'box' } })],
  D1: [M({ name: 'Autobus do 16 miejsc (poglądowy)', icon: '🚐', kind: 'bus', cockpit: 'van', len: 7.5, wid: 2.3, L: 4.3, vmax: 100, acc: 1.6, brake: 6, steer: 40, color: '#f1c40f', eye: 2.0, seat: 0.5, dash: '#2c2f34', word: false })],
  'D+E': [M({ name: 'Autobus + przyczepa (poglądowy)', icon: '🚌', kind: 'bus', cockpit: 'bus', len: 12, wid: 2.55, L: 5.9, vmax: 80, acc: 1.0, brake: 5, steer: 44, color: '#f1c40f', eye: 2.2, seat: 0.55, dash: '#2c2f34', fwdSeat: 0.9, word: false, trailer: { len: 4.5, wid: 2.3, Lt: 4.0, color: '#bdc3c7', kind: 'box' } })],
};
// Zgodność: pierwszy model danej kategorii.
export const VEHICLES = Object.fromEntries(Object.entries(FLEET).map(([k, v]) => [k, v[0]]));

export const SIM_CATS = ['AM', 'A1', 'A2', 'A', 'B', 'B+E', 'C', 'C+E', 'D', 'T', 'B1', 'C1', 'C1+E', 'D1', 'D+E'];

// Rysowanie pojazdu w układzie lokalnym: środek w (0,0), przód w kierunku +x. ctx przeskalowany do metrów.
export function drawVehicle(g, v, st) {
  const { len: L, wid: W, kind, color } = v;
  g.save();
  // cień
  g.fillStyle = 'rgba(0,0,0,.28)';
  g.fillRect(-L / 2 + 0.15, -W / 2 + 0.2, L, W);
  if (kind === 'moto') {
    g.fillStyle = '#111'; g.fillRect(-L / 2, -0.12, 0.55, 0.24); g.fillRect(L / 2 - 0.55, -0.12, 0.55, 0.24);
    g.fillStyle = color; roundRect(g, -L / 2 + 0.3, -W / 2 + 0.12, L - 0.6, W - 0.24, 0.25); g.fill();
    g.fillStyle = '#222'; g.beginPath(); g.arc(-0.1, 0, 0.32, 0, 7); g.fill(); // kierowca (kask)
    g.fillStyle = '#ddd'; g.fillRect(L / 2 - 0.45, -W / 2 - 0.05, 0.08, W + 0.1); // kierownica
  } else {
    // koła
    g.fillStyle = '#111';
    const wx = [L / 2 - (kind === 'bus' ? 2.2 : kind === 'truck' ? 1.3 : 0.8), -L / 2 + (kind === 'bus' ? 2.6 : kind === 'truck' ? 1.6 : 0.8)];
    const tw = kind === 'tractor' ? 0.5 : 0.28, tl = kind === 'tractor' ? 1.3 : 0.7;
    for (const x of wx) { g.fillRect(x - tl / 2, -W / 2 - 0.08, tl, tw); g.fillRect(x - tl / 2, W / 2 + 0.08 - tw, tl, tw); }
    // nadwozie
    g.fillStyle = color;
    roundRect(g, -L / 2, -W / 2, L, W, kind === 'car' ? 0.45 : 0.25); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 0.06; g.stroke();
    if (kind === 'car') {
      g.fillStyle = '#26323f'; roundRect(g, L / 2 - 1.45, -W / 2 + 0.18, 0.6, W - 0.36, 0.15); g.fill(); // przednia szyba
      g.fillStyle = '#34495e'; roundRect(g, -L / 2 + 0.35, -W / 2 + 0.22, 0.45, W - 0.44, 0.12); g.fill();
      g.fillStyle = '#ffe680'; g.fillRect(L / 2 - 0.12, -W / 2 + 0.12, 0.1, 0.35); g.fillRect(L / 2 - 0.12, W / 2 - 0.47, 0.1, 0.35);
      // „L” – nauka jazdy / egzamin
      g.fillStyle = '#1d5bbf'; g.fillRect(-0.4, -0.35, 0.8, 0.7); g.fillStyle = '#fff'; g.font = 'bold 0.55px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('L', 0, 0.03);
    } else if (kind === 'bus') {
      g.fillStyle = '#1f2d3a';
      for (let x = -L / 2 + 1; x < L / 2 - 1; x += 1.6) g.fillRect(x, -W / 2 + 0.06, 1.2, 0.18), g.fillRect(x, W / 2 - 0.24, 1.2, 0.18);
      g.fillRect(L / 2 - 0.35, -W / 2 + 0.15, 0.25, W - 0.3);
      if (st?.doors) { g.fillStyle = '#2ecc71'; g.fillRect(L / 2 - 2.2, W / 2 - 0.1, 1.2, 0.25); g.fillRect(-0.6, W / 2 - 0.1, 1.2, 0.25); }
    } else if (kind === 'truck') {
      g.fillStyle = '#ecf0f1'; if (!v.trailer) g.fillRect(-L / 2, -W / 2, L - 2.2, W); // skrzynia
      g.fillStyle = '#1f2d3a'; g.fillRect(L / 2 - 0.35, -W / 2 + 0.15, 0.25, W - 0.3);
    } else if (kind === 'tractor') {
      g.fillStyle = '#1e7a42'; g.fillRect(-0.8, -0.8, 1.4, 1.6);
      g.fillStyle = '#1f2d3a'; g.fillRect(-0.5, -0.55, 0.8, 1.1);
    }
  }
  // kierunkowskazy
  if (st && st.blink && (Math.floor(performance.now() / 380) % 2 === 0)) {
    g.fillStyle = '#ffb300';
    const sy = st.blink === 'L' ? -W / 2 : st.blink === 'R' ? W / 2 : null;
    const ys = st.blink === 'H' ? [-W / 2, W / 2] : [sy];
    for (const y of ys) { g.beginPath(); g.arc(L / 2 - 0.15, y, 0.22, 0, 7); g.arc(-L / 2 + 0.15, y, 0.22, 0, 7); g.fill(); }
  }
  // światła stop / cofania
  if (st?.braking) { g.fillStyle = '#ff2020'; g.fillRect(-L / 2 - 0.05, -W / 2 + 0.1, 0.12, 0.35); g.fillRect(-L / 2 - 0.05, W / 2 - 0.45, 0.12, 0.35); }
  if (st?.gear === 'R') { g.fillStyle = '#ffffff'; g.fillRect(-L / 2 - 0.05, -0.2, 0.12, 0.4); }
  g.restore();
}

export function drawTrailer(g, t) {
  g.save();
  g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(-t.len / 2 + 0.15, -t.wid / 2 + 0.2, t.len, t.wid);
  g.fillStyle = '#111';
  const axles = t.kind === 'semi' ? [-t.len / 2 + 1.3, -t.len / 2 + 2.6, -t.len / 2 + 3.9] : [0];
  for (const x of axles) { g.fillRect(x - 0.4, -t.wid / 2 - 0.08, 0.8, 0.28); g.fillRect(x - 0.4, t.wid / 2 - 0.2, 0.8, 0.28); }
  g.fillStyle = t.color; roundRect(g, -t.len / 2, -t.wid / 2, t.len, t.wid, 0.15); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 0.06; g.stroke();
  if (t.kind === 'farm') { g.strokeStyle = '#7b1e15'; g.lineWidth = 0.12; g.strokeRect(-t.len / 2 + 0.2, -t.wid / 2 + 0.2, t.len - 0.4, t.wid - 0.4); }
  g.restore();
}

export function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}

// Na co być gotowym – opis dla każdej kategorii.
export function briefing(cat) {
  const moto = ['AM', 'A1', 'A2', 'A'].includes(cat);
  const withE = cat.includes('+E') || cat === 'T';
  const heavy = ['C1', 'C', 'C+E', 'C1+E', 'D1', 'D', 'D+E'].includes(cat);
  const bus = cat.startsWith('D');
  const plac = moto
    ? ['Przygotowanie: kask zapięty, lusterka, światła, sygnał dźwiękowy, stan opon i łańcucha.', 'Jazda wolnym slalomem między pachołkami (bez potrącenia i podpierania nogą).', 'Ósemka – dwa okręgi bez najechania na linie/pachołki.', 'Hamowanie do zatrzymania w wyznaczonym miejscu (w kat. A1/A2/A – po rozpędzeniu do ok. 30 km/h).']
    : [
      'Przygotowanie do jazdy: fotel, lusterka, pasy; egzaminator wskaże element do sprawdzenia (światła, płyny, sygnał dźwiękowy' + (heavy ? ', ciśnienie w układzie hamulcowym' : '') + ').',
      ...(withE ? ['Sprzęganie: cofnij precyzyjnie do zaczepu przyczepy/naczepy, połącz (klawisz C).'] : []),
      `Łuk: jazda pasem ruchu do przodu do strefy zatrzymania, potem do tyłu – bez najechania na linie${heavy ? ' (pojazd długi – obserwuj tył w lusterkach)' : ''}.`,
      'Ruszanie na wzniesieniu: zatrzymaj się przy linii, hamulec postojowy (H), ruszaj bez stoczenia się (> 20 cm = błąd).',
    ];
  const road = [
    'Wyjazd z WORD na ul. Francuską – włączanie się do ruchu: ustępujesz wszystkim.',
    'Skrzyżowania z sygnalizacją (m.in. przy WORD) – czerwone = bezwzględny stop przed linią.',
    'Ronda: Rondo gen. Fieldorfa „Nila” i Rondo Policji Województwa Śląskiego – ustępujesz jadącym po rondzie, kierunkowskaz przy zjeździe.',
    'Przejścia dla pieszych – pieszy wchodzący ma pierwszeństwo; zwolnij wcześniej.',
    'Znaki STOP i ustąp pierwszeństwa, ograniczenia prędkości (30 km/h na osiedlowych ulicach).',
    ...(cat === 'B' || cat === 'B1' ? ['Parkowanie równoległe („koperta”) między zaparkowanymi autami.', 'Parkowanie prostopadłe na wolnym miejscu.'] : []),
    ...(heavy && !bus ? ['Parkowanie prostopadłe (tyłem) – większy promień skrętu, obserwacja martwego pola po prawej.'] : []),
    ...(bus ? ['Zatrzymanie na przystanku przy krawędzi w wyznaczonym miejscu, otwarcie drzwi (O) po zatrzymaniu.'] : []),
    'Hamowanie do zatrzymania w wyznaczonym miejscu (przód na wysokości pachołka).',
    'Zawracanie – na rondzie.',
  ];
  const errors = ['Wjazd na czerwonym / brak zatrzymania przed STOP', 'Nieustąpienie pieszemu lub pojazdowi', 'Przekroczenie prędkości o > 20 km/h', 'Zjazd z jezdni, kolizja z pachołkiem, pojazdem lub krawężnikiem', 'Jazda pod prąd'];
  return { plac, road, errors };
}
