// Atlas znaków drogowych rysowanych w SVG (stylizowane ilustracje edukacyjne).
// Każdy znak: kod, nazwa, grupa, opis znaczenia, kształt + piktogram.

const Y = '#ffcc00', R = '#d0021b', BL = '#1d5bbf', W = '#ffffff', K = '#111111', G = '#1f8a3b';

// Filtry zamieniające emoji w czarną/białą sylwetkę – piktogramy wyglądają jak na znakach.
const DEFS = `<defs>
<filter id="sgBlk"><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/></filter>
<filter id="sgWht"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter>
</defs>`;

const arrowPath = {
  up: 'M50 22 L66 42 L56 42 L56 78 L44 78 L44 42 L34 42 Z',
  down: 'M50 78 L66 58 L56 58 L56 22 L44 22 L44 58 L34 58 Z',
  right: 'M78 50 L58 34 L58 44 L22 44 L22 56 L58 56 L58 66 Z',
  left: 'M22 50 L42 34 L42 44 L78 44 L78 56 L42 56 L42 66 Z',
  upRight: 'M44 80 L44 52 Q44 40 56 40 L62 40 L62 30 L80 46 L62 62 L62 52 L56 52 L56 80 Z',
  upLeft: 'M56 80 L56 52 Q56 40 44 40 L38 40 L38 30 L20 46 L38 62 L38 52 L44 52 L44 80 Z',
  downRight: 'M30 22 L38 30 L64 56 L70 48 L74 76 L46 72 L54 66 L22 30 Z',
  downLeft: 'M70 22 L62 30 L36 56 L30 48 L26 76 L54 72 L46 66 L78 30 Z',
  bendRight: 'M38 82 L38 48 Q38 30 56 30 L58 30 L58 20 L74 36 L58 52 L58 42 L56 42 Q50 42 50 50 L50 82 Z',
  bendLeft: 'M62 82 L62 48 Q62 30 44 30 L42 30 L42 20 L26 36 L42 52 L42 42 L44 42 Q50 42 50 50 L50 82 Z',
  uturn: 'M60 82 L60 44 Q60 26 46 26 Q32 26 32 44 L32 56 L24 56 L36 72 L48 56 L40 56 L40 44 Q40 36 46 36 Q52 36 52 44 L52 82 Z',
};

function arrows(names, color) {
  return names.map((n) => `<path d="${arrowPath[n]}" fill="${color}"/>`).join('');
}

function emoji(e, color, size = 34, x = 50, y = 52) {
  const f = color === W ? 'sgWht' : 'sgBlk';
  return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" dominant-baseline="central" filter="url(#${f})">${e}</text>`;
}

function text(t, color, size = 30, y = 52, weight = 800) {
  return `<text x="50" y="${y}" font-size="${size}" font-family="Arial, Helvetica, sans-serif" font-weight="${weight}" text-anchor="middle" dominant-baseline="central" fill="${color}">${t}</text>`;
}

const SHAPES = {
  warn: (p) => `<path d="M50 7 L95 87 Q96 90 92 90 L8 90 Q4 90 5 87 Z" fill="${Y}" stroke="${R}" stroke-width="7" stroke-linejoin="round"/><g transform="translate(17.5 25) scale(.65)">${p}</g>`,
  yield: () => `<path d="M6 12 L94 12 L50 92 Z" fill="${Y}" stroke="${R}" stroke-width="8" stroke-linejoin="round"/>`,
  stop: () => `<polygon points="30,4 70,4 96,30 96,70 70,96 30,96 4,70 4,30" fill="${R}" stroke="${W}" stroke-width="4"/>${text('STOP', W, 25)}`,
  ban: (p) => `<circle cx="50" cy="50" r="43" fill="${W}" stroke="${R}" stroke-width="10"/>${p}`,
  banBlue: (p) => `<circle cx="50" cy="50" r="43" fill="${BL}" stroke="${R}" stroke-width="10"/>${p}`,
  order: (p) => `<circle cx="50" cy="50" r="46" fill="${BL}" stroke="${W}" stroke-width="3"/>${p}`,
  info: (p) => `<rect x="4" y="4" width="92" height="92" rx="8" fill="${BL}" stroke="${W}" stroke-width="3"/>${p}`,
  infoWhite: (p) => `<rect x="4" y="12" width="92" height="76" rx="6" fill="${W}" stroke="${K}" stroke-width="3"/>${p}`,
  end: (p) => `<circle cx="50" cy="50" r="44" fill="${W}" stroke="#777" stroke-width="3"/>${p}`,
  prio: (p) => `<polygon points="50,4 96,50 50,96 4,50" fill="${W}" stroke="${K}" stroke-width="2"/><polygon points="50,16 84,50 50,84 16,50" fill="${Y}"/>${p}`,
  red: (p) => `<rect x="8" y="24" width="84" height="52" rx="6" fill="${R}" stroke="${W}" stroke-width="3"/>${p}`,
  yellowRect: (p) => `<rect x="8" y="24" width="84" height="52" rx="6" fill="${Y}" stroke="${K}" stroke-width="3"/>${p}`,
  greenRect: (p) => `<rect x="8" y="24" width="84" height="52" rx="6" fill="${G}" stroke="${W}" stroke-width="3"/>${p}`,
  light: (p) => p,
};

const slash = `<line x1="20" y1="20" x2="80" y2="80" stroke="${R}" stroke-width="9"/>`;
const endStripes = `<g stroke="${K}" stroke-width="3">${[-24, -16, -8, 0, 8, 16, 24].map((d) => `<line x1="${22 + d}" y1="${78 + d}" x2="${78 + d}" y2="${22 + d}"/>`).join('')}</g>`;
const clip = (id, inner, clipShape) => `<clipPath id="${id}">${clipShape}</clipPath><g clip-path="url(#${id})">${inner}</g>`;

function trafficLight(active = 'all') {
  const on = (c) => active === 'all' || active === c;
  return `<rect x="34" y="6" width="32" height="88" rx="10" fill="#222"/>
    <circle cx="50" cy="24" r="10" fill="${on('r') ? '#ff3030' : '#4a1515'}"/>
    <circle cx="50" cy="50" r="10" fill="${on('y') ? '#ffc400' : '#4a3d10'}"/>
    <circle cx="50" cy="76" r="10" fill="${on('g') ? '#22d36a' : '#103d22'}"/>`;
}

// ---- Katalog ----
// g: grupa (A,B,C,D,E,F,P,S), s: kształt, p: piktogram (SVG), m: znaczenie, n: nazwa
export const SIGNS = [
  // A – ostrzegawcze
  { c: 'A-1', g: 'A', s: 'warn', n: 'Niebezpieczny zakręt w prawo', p: arrows(['bendRight'], K), m: 'Ostrzega przed zakrętem w prawo o ograniczonej widoczności lub małym promieniu. Zwolnij przed łukiem.' },
  { c: 'A-2', g: 'A', s: 'warn', n: 'Niebezpieczny zakręt w lewo', p: arrows(['bendLeft'], K), m: 'Ostrzega przed niebezpiecznym zakrętem w lewo.' },
  { c: 'A-3', g: 'A', s: 'warn', n: 'Niebezpieczne zakręty – pierwszy w prawo', p: `<path d="M44 84 L44 64 Q44 56 54 52 Q64 48 60 40 Q56 34 48 34 L48 26 L34 38 L48 50 L48 42 Q52 42 52 44 Q52 46 46 48 Q34 54 34 64 L34 84 Z" fill="${K}" transform="translate(6 0) scale(1 1)"/>`, m: 'Seria zakrętów, pierwszy w prawo. Zakaz wyprzedzania nie wynika z samego znaku, ale ograniczona widoczność często go uniemożliwia.' },
  { c: 'A-5', g: 'A', s: 'warn', n: 'Skrzyżowanie dróg', p: `<rect x="45" y="28" width="10" height="56" fill="${K}"/><rect x="24" y="52" width="52" height="10" fill="${K}"/>`, m: 'Skrzyżowanie dróg równorzędnych – obowiązuje reguła prawej ręki.' },
  { c: 'A-6a', g: 'A', s: 'warn', n: 'Skrzyżowanie z drogą podporządkowaną (obie strony)', p: `<rect x="43" y="26" width="14" height="60" fill="${K}"/><rect x="24" y="54" width="52" height="6" fill="${K}"/>`, m: 'Jedziesz drogą z pierwszeństwem; z obu stron dochodzi droga podporządkowana.' },
  { c: 'A-6b', g: 'A', s: 'warn', n: 'Wlot drogi podporządkowanej z prawej', p: `<rect x="40" y="26" width="14" height="60" fill="${K}"/><rect x="54" y="54" width="24" height="6" fill="${K}"/>`, m: 'Masz pierwszeństwo; z prawej strony dochodzi droga podporządkowana.' },
  { c: 'A-6c', g: 'A', s: 'warn', n: 'Wlot drogi podporządkowanej z lewej', p: `<rect x="46" y="26" width="14" height="60" fill="${K}"/><rect x="22" y="54" width="24" height="6" fill="${K}"/>`, m: 'Masz pierwszeństwo; z lewej strony dochodzi droga podporządkowana.' },
  { c: 'A-7', g: 'A', s: 'yield', n: 'Ustąp pierwszeństwa', p: '', m: 'Ustąp pierwszeństwa pojazdom na drodze, na którą wjeżdżasz. Nie musisz się zatrzymywać, jeśli nie ma potrzeby.' },
  { c: 'A-8', g: 'A', s: 'warn', n: 'Skrzyżowanie o ruchu okrężnym', p: `<g fill="none" stroke="${K}" stroke-width="6"><path d="M38 70 A16 16 0 0 1 36 48"/><path d="M42 42 A16 16 0 0 1 64 46"/><path d="M66 54 A16 16 0 0 1 48 72"/></g><g fill="${K}"><path d="M30 46 L42 44 L36 54 Z"/><path d="M60 38 L68 48 L57 50 Z"/><path d="M54 76 L44 72 L52 66 Z"/></g>`, m: 'Uprzedza o rondzie. Na rondzie jedziesz w kierunku przeciwnym do ruchu wskazówek zegara.' },
  { c: 'A-9', g: 'A', s: 'warn', n: 'Przejazd kolejowy z zaporami', p: `<g fill="${K}"><rect x="28" y="40" width="44" height="8"/><rect x="28" y="54" width="44" height="8"/><rect x="28" y="68" width="44" height="8"/><rect x="28" y="40" width="6" height="40"/><rect x="66" y="40" width="6" height="40"/></g>`, m: 'Przejazd kolejowy wyposażony w zapory lub półzapory.' },
  { c: 'A-10', g: 'A', s: 'warn', n: 'Przejazd kolejowy bez zapór', p: emoji('🚂', K, 32, 50, 60), m: 'Przejazd bez zapór – szczególna ostrożność, upewnij się, że nie nadjeżdża pociąg.' },
  { c: 'A-11a', g: 'A', s: 'warn', n: 'Próg zwalniający', p: `<path d="M24 76 L36 76 Q50 54 64 76 L76 76 L76 82 L24 82 Z" fill="${K}"/>`, m: 'Próg zwalniający na jezdni – zmniejsz prędkość.' },
  { c: 'A-12a', g: 'A', s: 'warn', n: 'Zwężenie jezdni – dwustronne', p: `<g stroke="${K}" stroke-width="6" fill="none"><path d="M36 84 L36 66 L42 54 L42 34"/><path d="M64 84 L64 66 L58 54 L58 34"/></g>`, m: 'Jezdnia zwęża się z obu stron.' },
  { c: 'A-14', g: 'A', s: 'warn', n: 'Roboty na drodze', p: emoji('👷', K, 30, 50, 62), m: 'Roboty drogowe – możliwe zwężenia, pracownicy i maszyny na drodze.' },
  { c: 'A-15', g: 'A', s: 'warn', n: 'Śliska jezdnia', p: emoji('🚗', K, 26, 50, 56) + `<path d="M34 80 q6 -6 12 0 t12 0 t12 0" stroke="${K}" stroke-width="4" fill="none"/>`, m: 'Jezdnia może być śliska (np. po deszczu). Łagodnie hamuj i skręcaj.' },
  { c: 'A-16', g: 'A', s: 'warn', n: 'Przejście dla pieszych', p: emoji('🚶', K, 32, 50, 60), m: 'Uprzedza o przejściu dla pieszych. Zachowaj szczególną ostrożność.' },
  { c: 'A-17', g: 'A', s: 'warn', n: 'Dzieci', p: emoji('👫', K, 32, 50, 60), m: 'Miejsce częstego przechodzenia dzieci (szkoła, plac zabaw).' },
  { c: 'A-18b', g: 'A', s: 'warn', n: 'Zwierzęta dzikie', p: emoji('🦌', K, 32, 50, 60), m: 'Możliwe wtargnięcie dzikich zwierząt, szczególnie o zmierzchu.' },
  { c: 'A-20', g: 'A', s: 'warn', n: 'Odcinek jezdni o ruchu dwukierunkowym', p: `<g transform="translate(-12 6) scale(.85)">${arrows(['up'], K)}</g><g transform="translate(22 6) scale(.85)">${arrows(['down'], K)}</g>`, m: 'Za znakiem ruch odbywa się w obu kierunkach (np. koniec drogi jednokierunkowej).' },
  { c: 'A-21', g: 'A', s: 'warn', n: 'Tramwaj', p: emoji('🚋', K, 30, 50, 60), m: 'Uprzedza o miejscu przecinania się drogi z torowiskiem tramwajowym.' },
  { c: 'A-24', g: 'A', s: 'warn', n: 'Rowerzyści', p: emoji('🚲', K, 32, 50, 62), m: 'Miejsce, w którym rowerzyści wjeżdżają na jezdnię lub ją przecinają.' },
  { c: 'A-29', g: 'A', s: 'warn', n: 'Sygnały świetlne', p: `<rect x="42" y="40" width="16" height="44" rx="5" fill="${K}"/><circle cx="50" cy="49" r="5" fill="#ff3030"/><circle cx="50" cy="62" r="5" fill="#ffc400"/><circle cx="50" cy="75" r="5" fill="#22d36a"/>`, m: 'Uprzedza o sygnalizacji świetlnej, której nie widać z daleka.' },
  { c: 'A-30', g: 'A', s: 'warn', n: 'Inne niebezpieczeństwo', p: text('!', K, 42, 62), m: 'Niebezpieczeństwo inne niż te, które określają pozostałe znaki – zwykle z tabliczką objaśniającą.' },
  { c: 'A-32', g: 'A', s: 'warn', n: 'Oszronienie jezdni', p: emoji('❄️', K, 30, 50, 62), m: 'Możliwość oszronienia lub oblodzenia jezdni (np. mosty, wiadukty).' },
  { c: 'A-33', g: 'A', s: 'warn', n: 'Zator drogowy', p: emoji('🚗', K, 18, 40, 54) + emoji('🚗', K, 18, 60, 54) + emoji('🚗', K, 18, 50, 72), m: 'Uprzedza o zatorze – przygotuj się do zatrzymania.' },

  // B – zakazu
  { c: 'B-1', g: 'B', s: 'ban', n: 'Zakaz ruchu w obu kierunkach', p: '', m: 'Zakaz ruchu wszelkich pojazdów (w obu kierunkach). Nie dotyczy pieszych prowadzących rower.' },
  { c: 'B-2', g: 'B', s: 'light', n: 'Zakaz wjazdu', p: `<circle cx="50" cy="50" r="46" fill="${R}"/><rect x="18" y="42" width="64" height="16" fill="${W}"/>`, m: 'Zakaz wjazdu wszelkich pojazdów od strony znaku (np. wjazd pod prąd na jednokierunkową).' },
  { c: 'B-3', g: 'B', s: 'ban', n: 'Zakaz wjazdu pojazdów silnikowych (z wyjątkiem motocykli jednośladowych)', p: emoji('🚗', K, 34), m: 'Zakaz wjazdu pojazdów silnikowych z wyjątkiem motocykli jednośladowych.' },
  { c: 'B-5', g: 'B', s: 'ban', n: 'Zakaz wjazdu samochodów ciężarowych', p: emoji('🚚', K, 36), m: 'Zakaz wjazdu samochodów ciężarowych o DMC powyżej 3,5 t oraz ciągników samochodowych (jeśli tabliczka nie stanowi inaczej).' },
  { c: 'B-9', g: 'B', s: 'ban', n: 'Zakaz wjazdu rowerów', p: emoji('🚲', K, 36), m: 'Zakaz wjazdu rowerów (dotyczy też hulajnóg elektrycznych i UTO).' },
  { c: 'B-16', g: 'B', s: 'ban', n: 'Zakaz wjazdu pojazdów o wysokości większej niż…', p: text('3,5m', K, 22) + `<path d="M50 18 l-6 8 h12z M50 82 l-6 -8 h12z" fill="${K}"/>`, m: 'Zakaz wjazdu pojazdów wyższych niż wskazana wartość (z ładunkiem).' },
  { c: 'B-18', g: 'B', s: 'ban', n: 'Zakaz wjazdu pojazdów o rzeczywistej masie całkowitej większej niż…', p: text('8t', K, 32), m: 'Zakaz wjazdu pojazdów, których rzeczywista masa całkowita przekracza podaną wartość (np. most).' },
  { c: 'B-20', g: 'B', s: 'stop', n: 'Stop', p: '', m: 'Bezwzględny obowiązek zatrzymania się przed linią lub krawędzią jezdni i ustąpienia pierwszeństwa.' },
  { c: 'B-21', g: 'B', s: 'ban', n: 'Zakaz skręcania w lewo', p: arrows(['upLeft'], K) + slash, m: 'Zakaz skrętu w lewo na najbliższym skrzyżowaniu. Nie zakazuje zawracania.' },
  { c: 'B-22', g: 'B', s: 'ban', n: 'Zakaz skręcania w prawo', p: arrows(['upRight'], K) + slash, m: 'Zakaz skrętu w prawo na najbliższym skrzyżowaniu.' },
  { c: 'B-23', g: 'B', s: 'ban', n: 'Zakaz zawracania', p: arrows(['uturn'], K) + slash, m: 'Zakaz zawracania na najbliższym skrzyżowaniu lub od znaku do najbliższego skrzyżowania. Nie zakazuje skrętu w lewo.' },
  { c: 'B-25', g: 'B', s: 'ban', n: 'Zakaz wyprzedzania', p: `<text x="36" y="52" font-size="28" text-anchor="middle" dominant-baseline="central">🚗</text>` + emoji('🚗', K, 28, 64), m: 'Zakaz wyprzedzania pojazdów silnikowych wielośladowych (poza ciągnikami rolniczymi i wolnobieżnymi). Obowiązuje do najbliższego skrzyżowania lub znaku B-26/B-42.' },
  { c: 'B-26', g: 'B', s: 'ban', n: 'Zakaz wyprzedzania przez samochody ciężarowe', p: `<text x="36" y="52" font-size="26" text-anchor="middle" dominant-baseline="central">🚚</text>` + emoji('🚗', K, 26, 64), m: 'Samochodom ciężarowym o DMC > 3,5 t zakazuje wyprzedzania pojazdów silnikowych (oprócz jednośladów).' },
  { c: 'B-31', g: 'B', s: 'ban', n: 'Pierwszeństwo dla nadjeżdżających z przeciwka', p: `<g transform="translate(-12 0) scale(.8) translate(12 12)">${arrows(['up'], R)}</g><g transform="translate(14 0) scale(.8) translate(12 12)">${arrows(['down'], K)}</g>`, m: 'Na zwężonym odcinku ustępujesz pojazdom jadącym z przeciwka.' },
  { c: 'B-33-50', g: 'B', s: 'ban', n: 'Ograniczenie prędkości (50 km/h)', p: text('50', K, 38), m: 'Zakaz przekraczania 50 km/h. Obowiązuje do znaku B-34, B-42 lub najbliższego skrzyżowania (chyba że tabliczka mówi inaczej).' },
  { c: 'B-33-70', g: 'B', s: 'ban', n: 'Ograniczenie prędkości (70 km/h)', p: text('70', K, 38), m: 'Zakaz przekraczania 70 km/h na odcinku za znakiem.' },
  { c: 'B-34', g: 'B', s: 'end', n: 'Koniec ograniczenia prędkości', p: text('50', '#555', 34) + `<line x1="24" y1="76" x2="76" y2="24" stroke="${K}" stroke-width="5"/>`, m: 'Odwołuje ograniczenie prędkości wprowadzone znakiem B-33. Obowiązują limity ogólne.' },
  { c: 'B-35', g: 'B', s: 'banBlue', n: 'Zakaz postoju', p: `<line x1="22" y1="22" x2="78" y2="78" stroke="${R}" stroke-width="9"/>`, m: 'Zakaz postoju (zatrzymanie do 1 minuty dozwolone). Obowiązuje po stronie drogi, po której stoi.' },
  { c: 'B-36', g: 'B', s: 'banBlue', n: 'Zakaz zatrzymywania się', p: `<line x1="22" y1="22" x2="78" y2="78" stroke="${R}" stroke-width="9"/><line x1="78" y1="22" x2="22" y2="78" stroke="${R}" stroke-width="9"/>`, m: 'Zakaz zatrzymania i postoju – nawet na chwilę (poza wynikającym z warunków ruchu).' },
  { c: 'B-41', g: 'B', s: 'ban', n: 'Zakaz ruchu pieszych', p: emoji('🚶', K, 36), m: 'Zakaz ruchu pieszych po stronie drogi, przy której stoi znak.' },
  { c: 'B-42', g: 'B', s: 'end', n: 'Koniec zakazów', p: endStripes, m: 'Koniec odcinka, na którym obowiązywały zakazy wprowadzone wcześniej m.in. znakami B-25, B-26, B-33 i B-35.' },
  { c: 'B-43', g: 'B', s: 'light', n: 'Strefa ograniczonej prędkości', p: `<rect x="6" y="10" width="88" height="80" rx="6" fill="${W}" stroke="${K}" stroke-width="3"/><circle cx="50" cy="40" r="22" fill="${W}" stroke="${R}" stroke-width="6"/>${text('30', K, 20, 41)}${text('STREFA', K, 14, 76)}`, m: 'Ograniczenie prędkości obowiązuje w całej strefie – aż do znaku B-44 (koniec strefy).' },

  // C – nakazu
  { c: 'C-1', g: 'C', s: 'order', n: 'Nakaz jazdy w prawo przed znakiem', p: arrows(['right'], W), m: 'Skręć w prawo przed znakiem.' },
  { c: 'C-2', g: 'C', s: 'order', n: 'Nakaz jazdy w prawo za znakiem', p: arrows(['upRight'], W), m: 'Skręć w prawo za znakiem (na skrzyżowaniu).' },
  { c: 'C-3', g: 'C', s: 'order', n: 'Nakaz jazdy w lewo przed znakiem', p: arrows(['left'], W), m: 'Skręć w lewo przed znakiem.' },
  { c: 'C-4', g: 'C', s: 'order', n: 'Nakaz jazdy w lewo za znakiem', p: arrows(['upLeft'], W), m: 'Skręć w lewo za znakiem.' },
  { c: 'C-5', g: 'C', s: 'order', n: 'Nakaz jazdy prosto', p: arrows(['up'], W), m: 'Jazda wyłącznie na wprost.' },
  { c: 'C-6', g: 'C', s: 'order', n: 'Nakaz jazdy prosto lub w prawo', p: `<g transform="translate(-8 0)">${arrows(['up'], W)}</g><path d="M50 62 Q50 50 62 50 L66 50 L66 42 L78 54 L66 66 L66 58 L62 58 Q58 58 58 62 Z" fill="${W}"/>`, m: 'Dozwolona jazda prosto lub skręt w prawo.' },
  { c: 'C-8', g: 'C', s: 'order', n: 'Nakaz jazdy w prawo lub w lewo', p: `<path d="M44 82 L44 52 Q44 40 34 40 L30 40 L30 30 L16 44 L30 58 L30 50 L34 50 Q36 50 36 54 L36 82 Z M56 82 L56 52 Q56 40 66 40 L70 40 L70 30 L84 44 L70 58 L70 50 L66 50 Q64 50 64 54 L64 82 Z" fill="${W}"/>`, m: 'Dozwolony tylko skręt w prawo lub w lewo.' },
  { c: 'C-9', g: 'C', s: 'order', n: 'Nakaz jazdy z prawej strony znaku', p: arrows(['downRight'], W), m: 'Omiń znak (np. wysepkę) z prawej strony.' },
  { c: 'C-12', g: 'C', s: 'order', n: 'Ruch okrężny', p: `<g fill="none" stroke="${W}" stroke-width="7"><path d="M34 62 A18 18 0 0 1 40 34"/><path d="M50 30 A18 18 0 0 1 70 52"/><path d="M66 64 A18 18 0 0 1 42 68"/></g><g fill="${W}"><path d="M30 34 L46 30 L40 44 Z"/><path d="M76 46 L68 60 L62 48 Z"/><path d="M36 76 L34 60 L48 66 Z"/></g>`, m: 'Ruch okrężny wokół wyspy – w kierunku przeciwnym do ruchu wskazówek zegara.' },
  { c: 'C-13', g: 'C', s: 'order', n: 'Droga dla rowerów', p: emoji('🚲', W, 40), m: 'Droga przeznaczona dla rowerów; obowiązek korzystania przez rowerzystów (i UTO).' },
  { c: 'C-14', g: 'C', s: 'order', n: 'Prędkość minimalna', p: text('30', W, 38), m: 'Nakaz jazdy z prędkością nie mniejszą niż wskazana (jeśli warunki na to pozwalają).' },
  { c: 'C-16', g: 'C', s: 'order', n: 'Droga dla pieszych', p: emoji('🚶', W, 40), m: 'Droga przeznaczona tylko dla pieszych.' },
  { c: 'C-18', g: 'C', s: 'order', n: 'Nakaz używania łańcuchów przeciwpoślizgowych', p: emoji('⛓️', W, 40), m: 'Obowiązek założenia łańcuchów na co najmniej dwa koła napędowe.' },

  // D – informacyjne
  { c: 'D-1', g: 'D', s: 'prio', n: 'Droga z pierwszeństwem', p: '', m: 'Jedziesz drogą z pierwszeństwem na najbliższych skrzyżowaniach – aż do znaku D-2.' },
  { c: 'D-2', g: 'D', s: 'prio', n: 'Koniec drogi z pierwszeństwem', p: clip('d2c', `<g stroke="${K}" stroke-width="3">${[-20, -12, -4, 4, 12, 20].map((d) => `<line x1="${20 + d}" y1="${80 + d}" x2="${80 + d}" y2="${20 + d}"/>`).join('')}</g>`, '<polygon points="50,16 84,50 50,84 16,50"/>'), m: 'Koniec drogi z pierwszeństwem – na następnym skrzyżowaniu sprawdź oznakowanie.' },
  { c: 'D-3', g: 'D', s: 'info', n: 'Droga jednokierunkowa', p: arrows(['up'], W), m: 'Ruch odbywa się tylko w jednym kierunku. Można zatrzymywać się po lewej stronie.' },
  { c: 'D-4a', g: 'D', s: 'info', n: 'Droga bez przejazdu', p: `<rect x="44" y="34" width="12" height="52" fill="${W}"/><rect x="28" y="22" width="44" height="14" fill="${R}"/>`, m: 'Ślepa droga – nie ma przejazdu.' },
  { c: 'D-5', g: 'D', s: 'info', n: 'Pierwszeństwo na zwężonym odcinku jezdni', p: `<g transform="translate(-12 0) scale(.8) translate(12 12)">${arrows(['up'], W)}</g><g transform="translate(14 0) scale(.8) translate(12 12)">${arrows(['down'], R)}</g>`, m: 'Na zwężonym odcinku masz pierwszeństwo przed pojazdami z przeciwka.' },
  { c: 'D-6', g: 'D', s: 'info', n: 'Przejście dla pieszych', p: `<path d="M50 14 L88 84 L12 84 Z" fill="${W}"/>${emoji('🚶', K, 30, 50, 62)}`, m: 'Oznacza przejście dla pieszych. Pieszy na przejściu ma pierwszeństwo.' },
  { c: 'D-6a', g: 'D', s: 'info', n: 'Przejazd dla rowerzystów', p: emoji('🚲', W, 40), m: 'Oznacza przejazd dla rowerzystów przez jezdnię.' },
  { c: 'D-7', g: 'D', s: 'info', n: 'Droga ekspresowa', p: emoji('🚗', W, 36, 50, 44) + `<rect x="20" y="70" width="60" height="6" fill="${W}"/>`, m: 'Początek drogi ekspresowej. Dopuszczalna prędkość: 120 km/h (dwujezdniowa) lub 100 km/h (jednojezdniowa).' },
  { c: 'D-9', g: 'D', s: 'info', n: 'Autostrada', p: `<path d="M22 84 L40 44 L46 44 L36 84 Z M78 84 L60 44 L54 44 L64 84 Z" fill="${W}"/><path d="M18 38 Q50 18 82 38 L82 44 Q50 26 18 44 Z" fill="${W}"/>`, m: 'Początek autostrady. Limit dla osobowych 140 km/h; wjazd tylko pojazdów mogących jechać min. 40 km/h.' },
  { c: 'D-15', g: 'D', s: 'info', n: 'Przystanek autobusowy', p: emoji('🚌', W, 40), m: 'Miejsce przystanku autobusowego. Zakaz zatrzymania bliżej niż 15 m od znaku.' },
  { c: 'D-18', g: 'D', s: 'info', n: 'Parking', p: text('P', W, 60), m: 'Miejsce wyznaczone do postoju pojazdów.' },
  { c: 'D-40', g: 'D', s: 'info', n: 'Strefa zamieszkania', p: emoji('🏠', W, 30, 34, 40) + emoji('🚶', W, 26, 66, 44) + emoji('🚗', W, 22, 50, 74), m: 'Pieszy ma pierwszeństwo przed pojazdem, limit 20 km/h, postój tylko w wyznaczonych miejscach.' },
  { c: 'D-42', g: 'D', s: 'infoWhite', n: 'Obszar zabudowany', p: `<path d="M16 76 L16 50 L26 50 L26 40 L34 40 L34 56 L42 56 L42 34 L50 26 L58 34 L58 56 L66 56 L66 44 L76 44 L76 54 L84 54 L84 76 Z" fill="${K}"/>`, m: 'Początek obszaru zabudowanego: 50 km/h (5–23), 60 km/h (23–5), zakaz używania sygnałów dźwiękowych (poza niebezpieczeństwem).' },
  { c: 'D-43', g: 'D', s: 'infoWhite', n: 'Koniec obszaru zabudowanego', p: `<path d="M16 76 L16 50 L26 50 L26 40 L34 40 L34 56 L42 56 L42 34 L50 26 L58 34 L58 56 L66 56 L66 44 L76 44 L76 54 L84 54 L84 76 Z" fill="${K}"/><line x1="14" y1="80" x2="86" y2="22" stroke="${R}" stroke-width="7"/>`, m: 'Koniec obszaru zabudowanego – obowiązują limity poza obszarem zabudowanym.' },
  { c: 'D-46', g: 'D', s: 'info', n: 'Droga wewnętrzna', p: text('DROGA', W, 15, 42) + text('WEWNĘTRZNA', W, 11, 60), m: 'Wjazd na drogę wewnętrzną – zasady ustala zarządca; wyjeżdżając z niej, włączasz się do ruchu.' },
  { c: 'D-51', g: 'D', s: 'info', n: 'Automatyczna kontrola prędkości', p: emoji('📷', W, 40), m: 'Informuje o fotoradarze lub odcinkowym pomiarze prędkości.' },

  // E – kierunku i miejscowości
  { c: 'E-15a', g: 'E', s: 'red', n: 'Numer drogi krajowej', p: text('7', W, 34), m: 'Numer drogi krajowej (czerwona tablica).' },
  { c: 'E-15b', g: 'E', s: 'yellowRect', n: 'Numer drogi wojewódzkiej', p: text('719', K, 30), m: 'Numer drogi wojewódzkiej (żółta tablica).' },
  { c: 'E-15c', g: 'E', s: 'greenRect', n: 'Numer drogi międzynarodowej', p: text('E 77', W, 28), m: 'Numer drogi międzynarodowej (zielona tablica z literą E).' },

  // S – sygnały świetlne
  { c: 'S-1', g: 'S', s: 'light', n: 'Sygnalizator ogólny', p: trafficLight('all'), m: 'Czerwony – stój; czerwony z żółtym – za chwilę zielony; zielony – jedź; żółty – stój, chyba że zatrzymanie spowodowałoby niebezpieczeństwo.' },
  { c: 'S-1r', g: 'S', s: 'light', n: 'Sygnał czerwony', p: trafficLight('r'), m: 'Zakaz wjazdu za sygnalizator (za linię zatrzymania).' },
  { c: 'S-1y', g: 'S', s: 'light', n: 'Sygnał żółty', p: trafficLight('y'), m: 'Zakaz wjazdu za sygnalizator, chyba że zatrzymanie wymagałoby gwałtownego hamowania. Żółty migający – zachowaj ostrożność.' },
  { c: 'S-2', g: 'S', s: 'light', n: 'Zielona strzałka (tabliczka T-10)', p: `<rect x="30" y="6" width="40" height="88" rx="8" fill="#222"/><circle cx="50" cy="28" r="12" fill="#ff3030"/><rect x="34" y="60" width="32" height="24" rx="3" fill="#000"/><path d="M40 72 L56 72 L56 66 L64 72 L56 78 L56 72" stroke="#22d36a" stroke-width="4" fill="#22d36a"/>`, m: 'Przy czerwonym możesz skręcić w prawo po zatrzymaniu się i ustąpieniu pierwszeństwa pieszym i pojazdom.' },
];

// Znaki poziome – osobny renderer (fragment jezdni)
export const MARKINGS = [
  { c: 'P-1', n: 'Linia pojedyncza przerywana', m: 'Rozdziela pasy ruchu; wolno ją przekraczać.', draw: 'dash' },
  { c: 'P-2', n: 'Linia pojedyncza ciągła', m: 'Zakaz przejeżdżania przez linię i najeżdżania na nią.', draw: 'solid' },
  { c: 'P-3', n: 'Linia jednostronnie przekraczalna', m: 'Można przekroczyć od strony linii przerywanej (np. po zakończeniu wyprzedzania).', draw: 'dashSolid' },
  { c: 'P-4', n: 'Linia podwójna ciągła', m: 'Rozdziela kierunki ruchu – zakaz przekraczania.', draw: 'double' },
  { c: 'P-6', n: 'Linia ostrzegawcza', m: 'Krótkie przerwy, długie kreski – zapowiada linię ciągłą.', draw: 'warn' },
  { c: 'P-10', n: 'Przejście dla pieszych („zebra”)', m: 'Wyznacza przejście dla pieszych.', draw: 'zebra' },
  { c: 'P-12', n: 'Linia bezwzględnego zatrzymania – STOP', m: 'Linia ciągła z napisem STOP – zatrzymaj się przed nią.', draw: 'stop' },
  { c: 'P-13', n: 'Linia warunkowego zatrzymania (trójkąty)', m: 'Wskazuje miejsce zatrzymania, gdy musisz ustąpić pierwszeństwa (z A-7).', draw: 'teeth' },
  { c: 'P-14', n: 'Linia warunkowego zatrzymania (prostokąty)', m: 'Miejsce zatrzymania przed przejściem lub sygnalizatorem.', draw: 'blocks' },
  { c: 'P-21', n: 'Powierzchnia wyłączona z ruchu', m: 'Zakaz wjazdu na powierzchnię oznaczoną skośnymi pasami.', draw: 'hatch' },
  { c: 'P-24', n: 'Miejsce dla pojazdu osoby niepełnosprawnej', m: 'Postój tylko dla pojazdów z kartą parkingową.', draw: 'disabled' },
];

export function markingSVG(code, size = 120) {
  const m = MARKINGS.find((x) => x.c === code);
  const w = '#f4f4f4';
  let d = '';
  switch (m?.draw) {
    case 'dash': d = [0, 1, 2, 3].map((i) => `<rect x="47" y="${4 + i * 26}" width="6" height="14" fill="${w}"/>`).join(''); break;
    case 'solid': d = `<rect x="47" y="0" width="6" height="100" fill="${w}"/>`; break;
    case 'dashSolid': d = `<rect x="42" y="0" width="5" height="100" fill="${w}"/>` + [0, 1, 2, 3].map((i) => `<rect x="53" y="${4 + i * 26}" width="5" height="14" fill="${w}"/>`).join(''); break;
    case 'double': d = `<rect x="41" y="0" width="5" height="100" fill="${w}"/><rect x="54" y="0" width="5" height="100" fill="${w}"/>`; break;
    case 'warn': d = [0, 1, 2].map((i) => `<rect x="47" y="${2 + i * 34}" width="6" height="28" fill="${w}"/>`).join(''); break;
    case 'zebra': d = [0, 1, 2, 3, 4, 5].map((i) => `<rect x="${6 + i * 16}" y="25" width="9" height="50" fill="${w}"/>`).join(''); break;
    case 'stop': d = `<rect x="0" y="70" width="100" height="7" fill="${w}"/><text x="50" y="50" fill="${w}" font-size="22" font-weight="800" text-anchor="middle" font-family="Arial">STOP</text>`; break;
    case 'teeth': d = [0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${4 + i * 14} 46 l10 0 l-5 14z" fill="${w}"/>`).join(''); break;
    case 'blocks': d = [0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${4 + i * 14}" y="48" width="9" height="6" fill="${w}"/>`).join(''); break;
    case 'hatch': d = `<path d="M30 0 L70 0 L50 100 Z" fill="none" stroke="${w}" stroke-width="3"/>` + [10, 25, 40, 55, 70].map((y) => `<line x1="${36 + y / 6}" y1="${y}" x2="${64 - y / 6}" y2="${y + 10}" stroke="${w}" stroke-width="3"/>`).join(''); break;
    case 'disabled': d = `<rect x="12" y="10" width="76" height="80" fill="#1d5bbf"/><text x="50" y="54" font-size="40" text-anchor="middle" dominant-baseline="central" filter="url(#sgWht)">♿</text>`; break;
  }
  return `<svg class="sign" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${m?.c} ${m?.n}">${DEFS}<rect width="100" height="100" rx="8" fill="#4b4f57"/>${d}</svg>`;
}

const byCode = new Map(SIGNS.map((s) => [s.c, s]));
export const getSign = (code) => byCode.get(code) || MARKINGS.find((m) => m.c === code);

export function signSVG(code, size = 96) {
  const s = byCode.get(code);
  if (!s) return MARKINGS.some((m) => m.c === code) ? markingSVG(code, size) : '';
  const body = SHAPES[s.s](s.p || '');
  return `<svg class="sign" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${s.c} ${s.n}">${DEFS}${body}</svg>`;
}

export const SIGN_GROUPS = [
  { g: 'A', n: 'Ostrzegawcze (A)', d: 'Trójkąt, żółte tło, czerwona obwódka. Uprzedzają o niebezpieczeństwie. Poza obszarem zabudowanym stoją zwykle 150–300 m przed miejscem, w obszarze zabudowanym do 100 m, na autostradzie i ekspresówce 300–500 m.' },
  { g: 'B', n: 'Zakazu (B)', d: 'Okrągłe, czerwona obwódka. Zakazy obowiązują od miejsca ustawienia znaku, zwykle do najbliższego skrzyżowania (chyba że znak lub tabliczka stanowi inaczej).' },
  { g: 'C', n: 'Nakazu (C)', d: 'Okrągłe, niebieskie tło, białe piktogramy. Nakazują określone zachowanie.' },
  { g: 'D', n: 'Informacyjne (D)', d: 'Najczęściej prostokątne, niebieskie. Informują o rodzaju drogi, obiektach i zasadach ruchu.' },
  { g: 'E', n: 'Kierunku i miejscowości (E)', d: 'Drogowskazy, numery dróg, nazwy miejscowości.' },
  { g: 'P', n: 'Poziome (P)', d: 'Linie i symbole na jezdni. Znak pionowy ma pierwszeństwo przed poziomym, sygnał świetlny przed znakiem, polecenie policjanta przed wszystkim.' },
  { g: 'S', n: 'Sygnały świetlne (S)', d: 'Sygnalizatory dla kierujących i pieszych.' },
];
