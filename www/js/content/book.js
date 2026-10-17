// Spis treści podręcznika DrogEduDei.
import { PART1 } from './book1.js';
import { PART1B } from './book2.js';
import { PART2, PART3, CATEGORIES } from './book3.js';
import { PART4 } from './book4.js';

export const PARTS = [
  { id: 'teoria', icon: '📘', title: 'Część I – Teoria (wszystkie kategorie)', desc: 'Pojęcia, znaki, sygnały, pierwszeństwo, prędkość, manewry, postój, piesi, autostrady, światła, kolej, uprzywilejowane, alkohol, pierwsza pomoc, dokumenty, technika jazdy.', chapters: [...PART1, ...PART1B] },
  { id: 'kategorie', icon: '🪪', title: 'Część II – Kategorie prawa jazdy', desc: 'AM, A1, A2, A, B, B+E, C1, C, C+E, D1, D, T – wymagania i przepisy szczególne.', chapters: PART2 },
  { id: 'praktyka', icon: '🚗', title: 'Część III – Praktyka i egzamin', desc: 'Przygotowanie do jazdy, plac manewrowy, parkowanie i koperta, przebieg egzaminu.', chapters: PART3 },
  { id: 'zdrowie', icon: '🩺', title: 'Część IV – Badania i zdrowie kierowcy', desc: 'Badania lekarskie i psychotechniczne, kierowcy zawodowi, taxi i aplikacje przewozowe, porady zdrowotne.', chapters: PART4 },
];

export const CHAPTERS = PARTS.flatMap((p) => p.chapters.map((c) => ({ ...c, part: p.id })));
export const chapterById = (id) => CHAPTERS.find((c) => c.id === id);
export { CATEGORIES };
export const CAT_KEYS = CATEGORIES.map((c) => c.k);
