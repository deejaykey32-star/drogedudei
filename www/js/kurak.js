// Kurak – przewodnik DrogEduDei: czerwony kogut w czapce szofera (w stylu taksówkarza).
export function kurakSVG(size = 96, mood = 'happy') {
  const checker = Array.from({ length: 10 }, (_, i) =>
    `<rect x="${22 + i * 5.6}" y="${i % 2 ? 31 : 28}" width="5.6" height="3" fill="${i % 2 ? '#111' : '#ffd400'}"/>`).join('');
  const mouth = mood === 'sad'
    ? '<path d="M60 70 L74 68 L62 76 Z" fill="#ffb300" stroke="#c77700" stroke-width="1"/>'
    : '<path d="M60 64 L78 69 L60 74 Z" fill="#ffb300" stroke="#c77700" stroke-width="1"/><path d="M60 69 L74 69" stroke="#c77700" stroke-width="1"/>';
  return `<svg class="kurak" viewBox="0 0 100 110" width="${size}" height="${size * 1.1}" role="img" aria-label="Kurak – czerwony kogut w czapce szofera">
  <!-- ogon -->
  <path d="M18 78 Q2 60 10 42 Q16 58 24 62 Q14 46 22 32 Q28 52 32 60" fill="#b3001b"/>
  <path d="M14 70 Q6 56 12 48" stroke="#1b7f3b" stroke-width="4" fill="none" stroke-linecap="round"/>
  <!-- tułów -->
  <ellipse cx="46" cy="82" rx="28" ry="22" fill="#e1172b"/>
  <path d="M30 80 Q44 96 64 84" stroke="#a80014" stroke-width="3" fill="none"/>
  <!-- nogi -->
  <path d="M40 102 L38 108 M38 108 l-5 1 M38 108 l4 1 M54 102 L56 108 M56 108 l-4 1 M56 108 l5 1" stroke="#ffb300" stroke-width="3" stroke-linecap="round"/>
  <!-- głowa -->
  <circle cx="52" cy="56" r="18" fill="#e1172b"/>
  <!-- grzebień spod czapki -->
  <path d="M34 46 q-6 -4 -2 -9 q2 4 6 4 z" fill="#ff2d3f"/>
  <!-- korale -->
  <path d="M60 72 Q62 84 56 84 Q52 80 56 72 Z" fill="#ff2d3f"/>
  <!-- oko -->
  <circle cx="58" cy="54" r="5.5" fill="#fff"/><circle cx="59.5" cy="54.5" r="2.8" fill="#111"/><circle cx="60.5" cy="53.5" r="1" fill="#fff"/>
  ${mouth}
  <!-- czapka szofera: denko, otok z szachownicą TAXI, daszek -->
  <g transform="translate(52 44) scale(.74 .8) translate(-52 -31)">
  <path d="M24 30 Q48 14 82 26 L80 34 Q50 30 24 36 Z" fill="#1c1c22"/>
  <rect x="22" y="28" width="56" height="7" rx="2" fill="#26262e"/>
  ${checker}
  <path d="M64 34 Q84 32 90 40 Q78 40 62 38 Z" fill="#0d0d10"/>
  <circle cx="46" cy="25" r="3.2" fill="#ffd400" stroke="#b38f00" stroke-width="1"/>
  </g>
  <!-- skrzydło z kierownicą -->
  <path d="M30 78 Q40 64 56 74 Q48 90 32 88 Z" fill="#c4001a"/>
  <circle cx="64" cy="92" r="9" fill="none" stroke="#333" stroke-width="3"/><circle cx="64" cy="92" r="2" fill="#333"/><path d="M55 92 h18 M64 92 v8" stroke="#333" stroke-width="2"/>
</svg>`;
}

export const KURAK_TIPS = [
  'Ko-ko-kontrola lusterek przed każdym manewrem! Lusterko, kierunkowskaz, manewr – zawsze w tej kolejności.',
  'Pieszy wchodzący na przejście ma pierwszeństwo. Zwolnij zanim dojedziesz – nie na ostatnim metrze.',
  'Znak STOP to nie sugestia. Koła muszą się zatrzymać, nawet gdy w okolicy nie ma żywej kury.',
  '20 minut dziennie to więcej niż 3 godziny raz w tygodniu. Wracaj codziennie – seria dni rośnie!',
  'Na rondzie z A-7 ustępujesz tym, którzy już krążą. Bez A-7 – reguła prawej ręki.',
  'Na autostradzie odstęp to połowa prędkości w metrach. 140 km/h? Minimum 70 m od zderzaka przed tobą.',
  'Senność za kierownicą? Kawa + 15 minut drzemki. Otwarte okno nie pomaga na długo.',
  'Taksówkarzu, kierowco z aplikacji: badania lekarskie i psychotechniczne co 5 lat – zapisz termin w kalendarzu.',
  'Przed egzaminem praktycznym sprawdź, gdzie w aucie egzaminacyjnym są zbiorniki płynów. Egzaminator lubi pytać.',
  'B-21 zakazuje skrętu w lewo, ale nie zawracania. B-23 odwrotnie. Ko-ko-klasyk egzaminu!',
];
