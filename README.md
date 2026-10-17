# DrogEduDei 🐓🚗

Aplikacja do nauki przepisów ruchu drogowego – odpowiednik [LangEduDei](https://langedudei.pages.dev) dla kierowców. Przewodnikiem jest **Kurak**: czerwony kogut w czapce szofera (taksówkarza).

## Co zawiera

| Sekcja | Zawartość |
|---|---|
| **Pulpit** | seria dni, XP, minuty dziś, „Twoja droga do prawa jazdy”, pytanie dnia, krąg 20 minut |
| **Podręcznik** | 36 rozdziałów w 4 częściach (teoria, kategorie, praktyka, badania i zdrowie) z ilustracjami znaków (SVG), tabelami i animowanymi schematami skrzyżowań; lektor czyta rozdział |
| **Atlas znaków + fiszki** | znaki A, B, C, D, E, P, S z opisami; fiszki z powtórkami w odstępach |
| **Mapy** | 10 interaktywnych schematów (kto jedzie pierwszy – z animacją), mapa ośrodków WORD (Leaflet/OSM) |
| **Ćwiczenia** | 164 pytania autorskie TAK/NIE i A/B/C z wyjaśnieniami + pytania generowane ze znaków; trening, pytania specjalistyczne dla kategorii, powtórki błędów (system Leitnera) |
| **Egzamin próbny** | 32 pytania (20 + 12), czas 35/50 s, punktacja 3/2/1, próg 68/74 – dla wybranej kategorii |
| **Symulator egzaminu – Katowice** | plac manewrowy + jazda po prawdziwych ulicach wokół WORD Katowice (ul. Francuska 78, dane OSM): sygnalizacja z cyklem świateł, ronda Fieldorfa „Nila” i Policji Woj. Śl., przejścia z pieszymi, STOP, limity prędkości, ruch innych pojazdów, koperta, parkowanie prostopadłe, przystanek (D), hamowanie przy pachołku; polecenia egzaminatora czytane przez lektora; ocena pozytywna/negatywna |
| **Widok zza kierownicy** | 3D (three.js): wnętrze pojazdu z floty WORD Katowice, obracająca się kierownica, prędkościomierz, działające lusterka (render z kamer wstecznych) |
| **Jazda wzorcowa** | Kurak sam przejeżdża trasę zgodnie z przepisami (demo) |
| **Psychotesty** | refleks, reakcje wyboru, koordynacja, antycypacja, tachistoskop, tablica Schultego – z historią wyników |
| **Zdrowie** | badania lekarskie i psychologiczne, kierowcy zawodowi, taxi/Uber/Bolt, kalkulator terminu badań, porady |
| **Praktyka** | checklisty placu dla kategorii, ćwiczenia „ułóż w kolejności”, dziennik jazd |
| **Android** | aplikacja Capacitor + **widżet** (pytanie dnia TAK/NIE, seria, minuty) + lektor Google (TTS) |

### Flota pojazdów w symulatorze (wg word.katowice.pl)

AM Junak 906 · A1 Yamaha MT-125 · A2 Yamaha MT-03 · A Suzuki Gladius 650 · B Škoda Fabia IV, Toyota Yaris (OT Dąbrowa Górnicza) · B+E VW Transporter T5 + Niewiadów B1400, VW Caravelle + Niewiadów B3500 · C MAN TGL 12.250 (2013/2018) · C+E MAN TGS 18.360 + naczepa · D Solaris Urbino 12 · T Zetor Proxima 8441 + Warfama T-041. Kategorie B1, C1, C1+E, D1, D+E – pojazdy poglądowe (WORD Katowice ich nie podaje).

## Uruchomienie

```bash
npm install
npm run vendor
npm run serve
```

Aplikacja: http://localhost:5173 (PWA, działa offline po pierwszym uruchomieniu).

### Android (APK + widżet)

Wymaga Android SDK i JDK 21 (np. z Android Studio).

```bash
npm run android:build
```

APK: `dist/drogedudei.apk` (oraz `dist/web/drogedudei.apk` – link „Pobierz APK” na stronie). Widżet: przytrzymaj pulpit → Widżety → DrogEduDei.

### Aktualizacja mapy Katowic

Dane `www/data/katowice.json` powstają z OpenStreetMap (`tools/osm/raw.json`, `tools/osm/nodes.json` – zapytania Overpass, okolice WORD) skryptem `npm run osm:build`.

## Zastrzeżenia

- Materiał edukacyjny. Pytania są autorskie (wzorowane na formie egzaminu), nie pochodzą z oficjalnej bazy. Przepisy się zmieniają – ostateczną wykładnią są aktualne ustawy, rozporządzenia i oficjalna baza pytań.
- Symulator nie odwzorowuje dokładnie organizacji ruchu ani tras egzaminacyjnych WORD; układ ulic, sygnalizacji i przejść pochodzi z OpenStreetMap.
- Dane mapy © OpenStreetMap contributors (ODbL). three.js i Leaflet – licencje MIT/BSD.
