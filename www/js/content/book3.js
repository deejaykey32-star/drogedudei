// Podręcznik – Część II: Kategorie prawa jazdy, Część III: Praktyka.

export const CATEGORIES = [
  { k: 'AM', icon: '🛵', age: '14 lat', what: 'Motorower (do 45 km/h, do 50 cm³) i lekki czterokołowiec.', course: '30 h zajęć łącznie (teoria + praktyka)', med: 'Badanie lekarskie', plac: ['Przygotowanie do jazdy i sprawdzenie stanu', 'Jazda po łuku w kształcie ósemki', 'Jazda wolnym slalomem', 'Omijanie przeszkody', 'Hamowanie do zatrzymania w wyznaczonym miejscu'] },
  { k: 'A1', icon: '🏍️', age: '16 lat', what: 'Motocykl do 125 cm³, do 11 kW (i 0,1 kW/kg); motocykl trójkołowy do 15 kW.', course: '20 h teorii + 20 h praktyki', med: 'Badanie lekarskie', plac: ['Przygotowanie i sprawdzenie stanu motocykla', 'Ósemka', 'Wolny slalom', 'Szybki slalom', 'Omijanie przeszkody', 'Hamowanie awaryjne', 'Ruszanie na wzniesieniu'] },
  { k: 'A2', icon: '🏍️', age: '18 lat', what: 'Motocykl do 35 kW (i 0,2 kW/kg).', course: '20 h teorii + 20 h praktyki', med: 'Badanie lekarskie', plac: ['Jak A1'] },
  { k: 'A', icon: '🏍️', age: '24 lata (20 lat – po 2 latach z A2)', what: 'Wszystkie motocykle.', course: '20 h teorii + 20 h praktyki', med: 'Badanie lekarskie', plac: ['Jak A1'] },
  { k: 'B1', icon: '🚙', age: '16 lat', what: 'Czterokołowiec (np. quad drogowy).', course: '30 h teorii + 30 h praktyki', med: 'Badanie lekarskie', plac: ['Jak B'] },
  { k: 'B', icon: '🚗', age: '18 lat (szkolenie można zacząć 3 mies. wcześniej)', what: 'Samochód o DMC do 3,5 t i do 8 miejsc pasażerskich; z przyczepą lekką (do 750 kg) lub cięższą, gdy DMC zespołu ≤ 3,5 t. Z kodem 96 – zespół do 4250 kg.', course: '30 h teorii + 30 h praktyki', med: 'Badanie lekarskie', plac: ['Przygotowanie do jazdy, sprawdzenie stanu technicznego (losowo: światła, sygnał dźwiękowy, płyny)', 'Ruszanie i jazda pasem ruchu do przodu i do tyłu („łuk”)', 'Ruszanie do przodu z miejsca na wzniesieniu'] },
  { k: 'B+E', icon: '🚗🚚', age: '18 lat', what: 'Samochód kat. B z przyczepą o DMC do 3,5 t.', course: '15 h praktyki', med: 'Badanie lekarskie', plac: ['Sprawdzenie stanu zespołu', 'Sprzęganie i rozprzęganie', 'Jazda do tyłu łukiem', 'Ruszanie na wzniesieniu'] },
  { k: 'C1', icon: '🚚', age: '18 lat', what: 'Samochód o DMC 3,5–7,5 t (+ przyczepa lekka).', course: '20 h teorii + 20 h praktyki', med: 'Badanie lekarskie (+ psychologiczne przy pracy zawodowej)', plac: ['Przygotowanie i sprawdzenie', 'Łuk do przodu i do tyłu', 'Wzniesienie', 'Parkowanie'] },
  { k: 'C', icon: '🚛', age: '21 lat (18 lat z kwalifikacją wstępną)', what: 'Samochód ciężarowy o DMC > 3,5 t (+ przyczepa lekka).', course: '20 h teorii + 30 h praktyki', med: 'Badanie lekarskie; zawodowo – także psychologiczne', plac: ['Przygotowanie i sprawdzenie stanu (np. ciśnienie w układzie hamulcowym, płyny)', 'Łuk do przodu i do tyłu', 'Ruszanie na wzniesieniu', 'Parkowanie skośne/prostopadłe'] },
  { k: 'C+E', icon: '🚛🚛', age: '21 lat (18 z kwalifikacją)', what: 'Kat. C z przyczepą powyżej 750 kg (ciągnik siodłowy + naczepa).', course: '20 h praktyki', med: 'Jak C', plac: ['Sprzęganie i rozprzęganie', 'Jazda do tyłu łukiem', 'Parkowanie'] },
  { k: 'D1', icon: '🚐', age: '21 lat', what: 'Autobus do 16 miejsc pasażerskich, długość do 8 m.', course: '20 h teorii + 20 h praktyki', med: 'Badanie lekarskie; zawodowo – psychologiczne', plac: ['Jak D'] },
  { k: 'D', icon: '🚌', age: '24 lata (21 z kwalifikacją wstępną)', what: 'Autobus.', course: '20 h teorii + 60 h praktyki (z kat. B)', med: 'Badanie lekarskie; zawodowo – psychologiczne', plac: ['Przygotowanie i sprawdzenie stanu', 'Łuk do przodu i do tyłu', 'Wzniesienie', 'Zatrzymanie na przystanku, otwarcie drzwi', 'Parkowanie'] },
  { k: 'T', icon: '🚜', age: '16 lat', what: 'Ciągnik rolniczy lub pojazd wolnobieżny (z przyczepami).', course: '30 h teorii + 20 h praktyki', med: 'Badanie lekarskie', plac: ['Sprzęganie z przyczepą', 'Jazda do tyłu', 'Ruszanie na wzniesieniu'] },
];

export const PART2 = [
  {
    id: 'k-tabela', icon: '🪪', title: 'Kategorie prawa jazdy – przegląd', cats: ['all'],
    lead: 'Każda kategoria to inny pojazd, inny wiek i inne zadania na egzaminie. Wybierz swoją kategorię w ustawieniach – egzamin próbny dobierze pytania specjalistyczne.',
    blocks: [
      ['categories'],
      ['tip', 'Prawo jazdy kat. A, B, B1, T wydaje się na 15 lat (dokument), a C, D – na 5 lat (wymaga badań lekarskich).'],
      ['warn', 'Wymagania dotyczące wieku i liczby godzin podajemy orientacyjnie; przed zapisem na kurs sprawdź aktualne przepisy ustawy o kierujących pojazdami.'],
    ],
  },
  {
    id: 'k-moto', icon: '🏍️', title: 'AM, A1, A2, A – motorowery i motocykle', cats: ['AM', 'A1', 'A2', 'A'],
    lead: 'Na jednośladzie nie masz karoserii – twoim „zderzakiem” jest wyobraźnia i odzież ochronna.',
    blocks: [
      ['ul', [
        'Kask ochronny obowiązkowy dla kierującego i pasażera.',
        'Światła mijania przez cały czas jazdy.',
        'Zakaz jazdy bez trzymania kierownicy i zdejmowania nóg z podnóżków.',
        'Jazda obok innego uczestnika ruchu po jezdni – zakazana (poza kolumną rowerów).',
      ]],
      ['h', 'Technika jazdy'],
      ['ul', ['Przeciwskręt: by skręcić w lewo przy prędkości, lekko popchnij lewą rączkę kierownicy.', 'Hamuj oboma hamulcami; przedni daje ok. 70% siły.', 'Patrz tam, gdzie chcesz jechać – motocykl podąża za wzrokiem.', 'Odzież: kask, kurtka i spodnie z protektorami, rękawice, buty za kostkę.']],
      ['tip', 'Na placu egzaminacyjnym kat. A ósemkę i slalomy wykonujesz bez podpierania się nogą i potrącania pachołków.'],
    ],
  },
  {
    id: 'k-przyczepy', icon: '🧳', title: 'Przyczepy: B, kod 96, B+E', cats: ['B', 'B+E', 'C+E', 'D+E'],
    lead: 'Przyczepa zmienia drogę hamowania, tor jazdy na zakręcie i zachowanie przy bocznym wietrze.',
    blocks: [
      ['table', ['Uprawnienie', 'Co możesz ciągnąć'], [
        ['B', 'Przyczepa lekka (DMC ≤ 750 kg) lub cięższa, jeśli DMC zespołu ≤ 3500 kg.'],
        ['B + kod 96', 'Zespół o DMC 3500–4250 kg (po kursie i egzaminie praktycznym).'],
        ['B+E', 'Przyczepa o DMC do 3500 kg (zespół do 7000 kg).'],
      ]],
      ['ul', ['Poza obszarem zabudowanym: 70 km/h, na autostradzie i ekspresowej 80 km/h.', 'Sprawdź połączenie: zaczep, linka zrywająca, wtyczka świateł, koło podporowe podniesione.', 'Cofanie: kręć kierownicą w przeciwną stronę niż ma jechać przyczepa; ruchy małe i powolne.', 'Pas ruchu przy skręcie w prawo – szerszy łuk, uważaj na rowerzystów.']],
    ],
  },
  {
    id: 'k-ciezarowe', icon: '🚛', title: 'C1, C, C+E – samochody ciężarowe', cats: ['C1', 'C', 'C+E', 'C1+E'],
    lead: 'Masa, wymiary, czas pracy i tachograf – to tematy pytań specjalistycznych dla kat. C.',
    blocks: [
      ['h', 'Czas jazdy i odpoczynku (rozporządzenie WE 561/2006)'],
      ['table', ['Zasada', 'Wartość'], [
        ['Dzienny czas jazdy', '9 h (2 razy w tygodniu do 10 h)'],
        ['Przerwa', '45 min po 4,5 h jazdy (można podzielić 15 + 30 min)'],
        ['Tygodniowy czas jazdy', 'max 56 h'],
        ['Dwa kolejne tygodnie', 'max 90 h'],
        ['Odpoczynek dzienny', '11 h (skrócony 9 h – max 3 razy między odpoczynkami tygodniowymi)'],
        ['Odpoczynek tygodniowy', '45 h (skrócony min. 24 h)'],
      ]],
      ['h', 'Wymiary i masy (typowo)'],
      ['ul', ['Szerokość max 2,55 m (chłodnie 2,60 m), wysokość 4 m.', 'Długość: pojedynczy pojazd 12 m, ciągnik z naczepą 16,5 m, zespół z przyczepą 18,75 m.', 'Nacisk osi napędowej do 11,5 t (na drogach o takim dopuszczalnym nacisku).', 'Ładunek musi być rozmieszczony i zabezpieczony – odpowiada kierowca.']],
      ['h', 'Tachograf'],
      ['ul', ['Karta kierowcy – osobista, nie wolno używać cudzej.', 'Wydruki i wpisy manualne przy awarii tachografu.', 'Ograniczniki prędkości: ciężarowe > 3,5 t – 90 km/h.']],
      ['tip', 'Martwe pole ciężarówki jest ogromne – szczególnie po prawej stronie. Przy skręcie w prawo upewnij się, że nie ma rowerzysty.'],
    ],
  },
  {
    id: 'k-autobusy', icon: '🚌', title: 'D1, D, D+E – autobusy', cats: ['D1', 'D', 'D+E'],
    lead: 'Przewozisz ludzi – płynność jazdy i bezpieczeństwo pasażerów są ważniejsze niż czas.',
    blocks: [
      ['ul', [
        'Na przystanku: zatrzymaj się przy krawędzi, otwieraj drzwi dopiero po zatrzymaniu, ruszaj po zamknięciu drzwi.',
        'Autobus szkolny (z tablicą „autobus szkolny”) – zatrzymany na przystanku z włączonymi światłami awaryjnymi: inni kierujący zachowują szczególną ostrożność.',
        'Przewożenie dzieci: autobus oznaczony, opiekun, pasy bezpieczeństwa tam, gdzie są.',
        'Liczba osób – nie więcej niż w dowodzie rejestracyjnym; stojący tylko w autobusach do tego przystosowanych (nie na autostradzie w niektórych przypadkach).',
        'Apteczka i gaśnica (2 gaśnice w autobusie) obowiązkowe; młotki do wybijania szyb.',
      ]],
      ['h', 'Na egzaminie D'],
      ['ul', ['Podjeżdżanie do przystanku i zatrzymanie w wyznaczonym miejscu.', 'Płynne ruszanie i hamowanie (komfort pasażerów).', 'Obserwacja w lusterkach całej długości pojazdu przy skrętach.']],
    ],
  },
  {
    id: 'k-ciagniki', icon: '🚜', title: 'T – ciągniki rolnicze', cats: ['T'],
    lead: 'Wolny pojazd na szybkiej drodze – kluczowe są widoczność, oznakowanie i ładunek.',
    blocks: [
      ['ul', ['Prędkość max: 30 km/h (ciągnik rolniczy, pojazd wolnobieżny; konstrukcyjnie może więcej, ale przepisy ograniczają).', 'Zakaz wjazdu na autostradę i drogę ekspresową.', 'Trójkąt wyróżniający (tablica wyróżniająca pojazd wolno poruszający się) z tyłu.', 'Ładunek wystający z tyłu > 0,5 m oznacz chorągiewką lub światłem.', 'Przewożenie osób – tylko na miejscach do tego przeznaczonych.', 'Brudząc jezdnię (błoto) – masz obowiązek ją oczyścić.']],
    ],
  },
];

export const PART3 = [
  {
    id: 'p-przygotowanie', icon: '🔧', title: 'Przygotowanie do jazdy i sprawdzenie pojazdu', cats: ['all'],
    lead: 'Pierwsze zadanie na egzaminie praktycznym. Krótko, ale bez pomyłek – egzaminator patrzy od pierwszej sekundy.',
    blocks: [
      ['h', 'Ustawienia w kabinie (kolejność)'],
      ['ol', ['Fotel: odległość (nogi lekko zgięte przy wciśniętym sprzęgle), oparcie (nadgarstki na kierownicy przy wyprostowanych rękach).', 'Zagłówek: górna krawędź na wysokości czubka głowy.', 'Kierownica (jeśli regulowana).', 'Lusterka: wewnętrzne – cała tylna szyba; boczne – widzisz fragment swojego auta (ok. 1/4).', 'Pasy bezpieczeństwa – zapięte, nieskręcone.', 'Drzwi zamknięte, hamulec postojowy, luz – potem silnik.']],
      ['h', 'Sprawdzenie stanu technicznego (losowo na egzaminie)'],
      ['ul', ['Światła: mijania, drogowe, pozycyjne, stop, cofania, kierunkowskazy, awaryjne, przeciwmgłowe tylne.', 'Sygnał dźwiękowy.', 'Płyny: hamulcowy, chłodniczy, spryskiwaczy, olej (miarka) – wskaż zbiornik i poziom MIN/MAX.', 'Opony: stan, głębokość bieżnika (min. 1,6 mm).', 'Kat. C/D: ciśnienie w układzie hamulcowym, stan zbiorników, oświetlenie zespołu.']],
      ['tip', 'Nie wiesz, gdzie jest zbiornik? Przed egzaminem obejrzyj komorę silnika pojazdu egzaminacyjnego – WORD Katowice publikuje modele aut egzaminacyjnych.'],
    ],
  },
  {
    id: 'p-plac', icon: '🚧', title: 'Plac manewrowy', cats: ['all'],
    lead: 'Plac to kilka minut, ale błąd = koniec egzaminu (dwie próby na zadanie). Ćwicz, aż ruchy będą automatyczne.',
    blocks: [
      ['h', 'Łuk – jazda pasem ruchu do przodu i do tyłu (B, C, D)'],
      ['ol', ['Ustaw się przed linią startu, sprawdź lusterka.', 'Jedź do przodu do linii zatrzymania (przednim zderzakiem nad linią lub przed nią – zgodnie z poleceniem).', 'Zatrzymaj się, wrzuć wsteczny, obejrzyj się.', 'Cofaj, kontrolując odległość od linii przez lusterka; skręcaj zgodnie z łukiem.', 'Zatrzymaj się tak, by tył pojazdu był między linią a pachołkami końca.']],
      ['warn', 'Najechanie na linię ograniczającą pas, potrącenie pachołka lub zatrzymanie poza strefą = błąd. Masz dwie próby.'],
      ['h', 'Ruszanie na wzniesieniu'],
      ['ol', ['Zatrzymaj się przed linią na wzniesieniu, zaciągnij hamulec postojowy.', 'Wciśnij sprzęgło, wrzuć jedynkę, dodaj gazu (~1500 obr./min).', 'Puszczaj sprzęgło do punktu złapania (auto „przysiada”).', 'Zwolnij hamulec postojowy, ruszaj płynnie – auto nie może się stoczyć (> 20 cm = błąd).']],
      ['h', 'Motocykl (A): ósemka, slalomy, omijanie, hamowanie'],
      ['ul', ['Ósemka – stała, niewielka prędkość, wzrok przed siebie, bez podpierania.', 'Wolny slalom – sprzęgło na półsprzęgle, lekko tylny hamulec.', 'Omijanie przeszkody i hamowanie awaryjne – przy prędkości min. ok. 30 km/h (wymagana prędkość jest mierzona).']],
    ],
  },
  {
    id: 'p-miasto', icon: '🏙️', title: 'Jazda w ruchu drogowym: parkowanie, koperta, zawracanie', cats: ['all'],
    lead: 'W ruchu egzaminator sprawdza, czy jeździsz bezpiecznie, płynnie i zgodnie z przepisami – i czy umiesz zaparkować.',
    blocks: [
      ['h', 'Parkowanie równoległe („koperta”)'],
      ['svg', `<svg viewBox="0 0 320 170" class="diagram"><rect width="320" height="170" fill="#4d525a"/><rect x="0" y="120" width="320" height="50" fill="#c9c3b6"/><line x1="0" y1="118" x2="320" y2="118" stroke="#eee" stroke-width="3"/><rect x="20" y="88" width="70" height="28" rx="6" fill="#7f8c8d"/><rect x="220" y="88" width="70" height="28" rx="6" fill="#7f8c8d"/><rect x="98" y="86" width="114" height="32" fill="none" stroke="#f1c40f" stroke-width="2" stroke-dasharray="6 4"/><path d="M290 70 L250 70 Q200 70 180 90 Q160 108 110 102" stroke="#2ecc71" stroke-width="3" fill="none" stroke-dasharray="7 5"/><rect x="236" y="54" width="70" height="28" rx="6" fill="#e74c3c"/><text x="160" y="40" fill="#fff" font-size="13" text-anchor="middle">1 → zrównaj się z autem przed miejscem · 2 → cofaj, skręt w prawo</text><text x="160" y="160" fill="#333" font-size="12" text-anchor="middle">3 → wyprostuj · 4 → kontra w lewo · 5 → wyrównaj</text></svg>`],
      ['ol', ['Włącz prawy kierunkowskaz, zatrzymaj się równolegle do auta przed wolnym miejscem (ok. 0,5–1 m odstępu, tylne zderzaki w linii).', 'Cofaj powoli; gdy tylny słupek minie tył tamtego auta – pełny skręt w prawo.', 'Gdy auto jest pod kątem ok. 45° (w lewym lusterku widzisz całe auto za tobą) – wyprostuj koła.', 'Gdy przedni zderzak minie tył auta przed tobą – pełny skręt w lewo.', 'Wyrównaj, podjedź do przodu, by odstępy były podobne. Koła nie mogą dotknąć krawężnika.']],
      ['h', 'Parkowanie prostopadłe i skośne'],
      ['ul', ['Prostopadłe przodem – szeroki łuk, auto w środku miejsca; tyłem – lepsza widoczność przy wyjeździe.', 'Wyjazd z miejsca = włączanie się do ruchu: ustąp wszystkim.', 'Zaparkowany pojazd nie może wystawać poza linie ani utrudniać ruchu.']],
      ['h', 'Zawracanie i hamowanie'],
      ['ul', ['Zawracanie na skrzyżowaniu – jak skręt w lewo; z wykorzystaniem wjazdu/bramy – „na trzy razy”.', 'Hamowanie do zatrzymania w wyznaczonym miejscu – przednim zderzakiem przy wskazanym punkcie (np. pachołek, linia).', 'Hamowanie awaryjne (kat. A) – mocno oba hamulce, bez blokady kół.']],
      ['tip', 'Na egzaminie egzaminator mówi wcześniej: „Proszę na najbliższym skrzyżowaniu skręcić w prawo”. Jeśli nie słyszysz – zapytaj. Pomyłka kierunku nie jest błędem, jeśli jedziesz bezpiecznie.'],
    ],
  },
  {
    id: 'p-egzamin', icon: '🏁', title: 'Egzamin państwowy: teoria i praktyka', cats: ['all'],
    lead: 'Wiedza to połowa sukcesu. Druga połowa to wiedzieć, jak wygląda egzamin i co jest błędem.',
    blocks: [
      ['h', 'Egzamin teoretyczny'],
      ['table', ['Element', 'Wartość'], [
        ['Liczba pytań', '32: 20 podstawowych (TAK/NIE) + 12 specjalistycznych (A/B/C)'],
        ['Czas', 'Podstawowe: 20 s na zapoznanie + 15 s na odpowiedź; specjalistyczne: 50 s łącznie. Całość ok. 25 min.'],
        ['Punktacja', 'Pytania za 3, 2 i 1 pkt; maks. 74 pkt'],
        ['Zaliczenie', 'min. **68 punktów**'],
        ['Pytania z filmem/zdjęciem', 'Film odtwarza się raz.'],
      ]],
      ['h', 'Egzamin praktyczny'],
      ['ul', ['Plac manewrowy (zadania zależą od kategorii) → jazda w ruchu drogowym (zwykle 25–40 minut).', 'Zadanie nieudane dwukrotnie = wynik negatywny.', 'Błąd zagrażający bezpieczeństwu lub zmuszający egzaminatora do interwencji = natychmiastowe przerwanie.']],
      ['h', 'Błędy przerywające egzamin (przykłady)'],
      ['ul', ['Wjazd na czerwonym świetle, niezatrzymanie się przed STOP.', 'Nieustąpienie pierwszeństwa pojazdowi lub pieszemu.', 'Wyprzedzanie w miejscu zabronionym, jazda pod prąd.', 'Przekroczenie prędkości, jazda niedostosowana do warunków.', 'Najechanie na linię ciągłą w sposób zagrażający, kolizja z pachołkiem/przeszkodą.', 'Zachowanie wskazujące na stan po alkoholu, wulgarne zachowanie wobec egzaminatora.']],
      ['tip', 'W DrogEduDei znajdziesz **Symulator egzaminu – Katowice**: trasa wokół WORD przy ul. Francuskiej, z placem, sygnalizacją, rondami, przejściami i kopertą – dla każdej kategorii z odpowiednim pojazdem.'],
    ],
  },
];
