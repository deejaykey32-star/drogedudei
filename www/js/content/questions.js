// Bank pytań DrogEduDei (pytania autorskie, wzorowane na formie egzaminu państwowego).
// Format wiersza:
//   ['tn', pytanie, odpowiedź(true/false), wyjaśnienie, waga(1-3), obraz?]
//   ['abc', pytanie, [A,B,C], indeksPoprawnej, wyjaśnienie, waga, obraz?, kategorie?]
// obraz: { sign: 'A-7' } | { signs: [...] } | { scene: 'nazwa' } | { mark: 'P-2' }
import { SIGNS } from '../signs.js';

const RAW = {
  't-pojecia': [
    ['tn', 'Czy wyjazd z parkingu na drogę publiczną jest skrzyżowaniem?', false, 'Wyjazd z parkingu, posesji czy drogi wewnętrznej nie jest skrzyżowaniem – to włączanie się do ruchu.', 3],
    ['tn', 'Czy osoba prowadząca rower po chodniku jest pieszym?', true, 'Osoba prowadząca rower, wózek czy hulajnogę jest w rozumieniu przepisów pieszym.', 2],
    ['tn', 'Czy unieruchomienie pojazdu na 3 minuty w celu załadunku jest postojem?', true, 'Unieruchomienie niewynikające z warunków ruchu, trwające ponad 1 minutę, to postój.', 2],
    ['abc', 'Wyprzedzanie to:', ['przejeżdżanie obok pojazdu jadącego w tym samym kierunku', 'przejeżdżanie obok pojazdu jadącego z przeciwka', 'przejeżdżanie obok pojazdu unieruchomionego'], 0, 'Wymijanie dotyczy jadących z przeciwka, omijanie – unieruchomionych.', 2],
    ['abc', 'Ile osób łącznie z kierowcą może przewozić samochód osobowy?', ['do 7', 'do 9', 'do 12'], 1, 'Samochód osobowy przewozi nie więcej niż 9 osób łącznie z kierowcą.', 1],
    ['abc', 'Co jest najważniejsze w hierarchii sygnałów i znaków?', ['znak pionowy', 'sygnał świetlny', 'polecenie policjanta'], 2, 'Polecenia osoby kierującej ruchem mają pierwszeństwo przed sygnałami i znakami.', 3],
    ['tn', 'Czy tablica z nazwą miejscowości oznacza początek obszaru zabudowanego?', false, 'O obszarze zabudowanym decyduje znak D-42, nie tablica z nazwą miejscowości.', 3],
  ],
  't-znaki-a': [
    ['tn', 'Czy ten znak informuje o niebezpiecznym zakręcie w prawo?', true, 'To A-1 – niebezpieczny zakręt w prawo.', 1, { sign: 'A-1' }],
    ['tn', 'Czy ten znak nakazuje ustąpić pierwszeństwa na najbliższym skrzyżowaniu?', true, 'A-7 nakazuje ustąpić pierwszeństwa pojazdom na drodze, na którą wjeżdżasz.', 3, { sign: 'A-7' }],
    ['tn', 'Czy ten znak oznacza, że na najbliższym skrzyżowaniu obowiązuje reguła prawej ręki?', true, 'A-5 – skrzyżowanie dróg równorzędnych.', 3, { sign: 'A-5' }],
    ['tn', 'Czy znak A-6b oznacza, że masz pierwszeństwo przed pojazdami z prawej?', true, 'A-6b: wlot drogi podporządkowanej z prawej – jedziesz drogą z pierwszeństwem.', 3, { sign: 'A-6b' }],
    ['abc', 'W jakiej odległości od miejsca niebezpiecznego ustawia się znaki ostrzegawcze poza obszarem zabudowanym?', ['do 50 m', '150–300 m', '500–1000 m'], 1, 'Poza obszarem zabudowanym 150–300 m, w obszarze do 100 m, na autostradzie 300–500 m.', 2],
    ['abc', 'Ten znak uprzedza o:', ['przejeździe kolejowym z zaporami', 'przejeździe kolejowym bez zapór', 'tramwaju'], 1, 'A-10 – przejazd kolejowy bez zapór.', 2, { sign: 'A-10' }],
    ['tn', 'Czy po minięciu tego znaku powinieneś zachować szczególną ostrożność ze względu na dzieci?', true, 'A-17 „Dzieci”.', 2, { sign: 'A-17' }],
    ['abc', 'Znak A-30 z tabliczką „koleiny” oznacza, że:', ['obowiązuje zakaz wyprzedzania', 'na jezdni są koleiny – dostosuj prędkość', 'trwają roboty drogowe'], 1, 'A-30 – inne niebezpieczeństwo; tabliczka wyjaśnia jakie.', 1, { sign: 'A-30' }],
  ],
  't-znaki-b': [
    ['tn', 'Czy znak B-21 zabrania zawracania?', false, 'B-21 zakazuje tylko skrętu w lewo. Zawracanie zakazuje B-23.', 3, { sign: 'B-21' }],
    ['tn', 'Czy znak B-23 zabrania skrętu w lewo?', false, 'B-23 zakazuje zawracania, nie skrętu w lewo.', 3, { sign: 'B-23' }],
    ['tn', 'Czy w miejscu obowiązywania tego znaku możesz zatrzymać się na 30 sekund, aby wysadzić pasażera?', true, 'B-35 – zakaz postoju; zatrzymanie do 1 minuty jest dozwolone.', 3, { sign: 'B-35' }],
    ['tn', 'Czy w miejscu obowiązywania tego znaku możesz zatrzymać się na 30 sekund, aby wysadzić pasażera?', false, 'B-36 – zakaz zatrzymywania się, także na chwilę.', 3, { sign: 'B-36' }],
    ['abc', 'Znak B-33 „ograniczenie prędkości” bez tabliczki przestaje obowiązywać:', ['po 1 km', 'na najbliższym skrzyżowaniu', 'dopiero na znaku B-34'], 1, 'Zakazy z grupy B obowiązują do najbliższego skrzyżowania, chyba że odwoła je wcześniej znak B-34 lub B-42.', 3, { sign: 'B-33-50' }],
    ['tn', 'Czy znak B-1 zabrania wjazdu rowerów?', true, 'B-1 zakazuje ruchu wszelkich pojazdów, w tym rowerów.', 2, { sign: 'B-1' }],
    ['abc', 'Przed tym znakiem musisz:', ['zwolnić i ustąpić pierwszeństwa', 'zatrzymać się zawsze i ustąpić pierwszeństwa', 'zatrzymać się tylko gdy nadjeżdża pojazd'], 1, 'Znak STOP nakazuje bezwzględnie się zatrzymać – nawet przy pustej drodze.', 3, { sign: 'B-20' }],
    ['tn', 'Czy znak B-25 zabrania wyprzedzania motocykla?', false, 'B-25 zakazuje wyprzedzania pojazdów silnikowych wielośladowych; motocykl jednośladowy można wyprzedzić.', 2, { sign: 'B-25' }],
    ['abc', 'Na zwężonym odcinku z tym znakiem:', ['masz pierwszeństwo', 'ustępujesz jadącym z przeciwka', 'obowiązuje reguła prawej ręki'], 1, 'B-31 – pierwszeństwo dla nadjeżdżających z przeciwka.', 2, { sign: 'B-31' }],
  ],
  't-znaki-c': [
    ['tn', 'Czy ten znak pozwala zawrócić na skrzyżowaniu za znakiem?', true, 'C-2 (nakaz jazdy w prawo za znakiem) nie zabrania zawracania – zakaz wynikałby z B-23.', 2, { sign: 'C-2' }],
    ['tn', 'Czy przy tym znaku wolno zawracać?', false, 'C-5 – nakaz jazdy prosto, zawracanie jest zabronione.', 2, { sign: 'C-5' }],
    ['abc', 'Znak C-13 oznacza:', ['zakaz wjazdu rowerów', 'drogę dla rowerów', 'przejazd dla rowerzystów'], 1, 'C-13 – droga dla rowerów, z obowiązkiem korzystania.', 1, { sign: 'C-13' }],
    ['abc', 'Znak C-14 z liczbą 30 oznacza:', ['prędkość maksymalną 30 km/h', 'prędkość minimalną 30 km/h', 'zalecaną prędkość 30 km/h'], 1, 'C-14 – prędkość minimalna.', 2, { sign: 'C-14' }],
    ['tn', 'Czy znak C-12 sam w sobie nakazuje ustąpić pierwszeństwa pojazdom na rondzie?', false, 'C-12 oznacza tylko ruch okrężny. O pierwszeństwie decyduje A-7 (lub jego brak).', 3, { sign: 'C-12' }],
  ],
  't-znaki-d': [
    ['tn', 'Czy na drodze oznaczonej tym znakiem możesz zatrzymać się przy lewej krawędzi jezdni?', true, 'Na drodze jednokierunkowej wolno zatrzymać się i stanąć przy lewej krawędzi.', 2, { sign: 'D-3' }],
    ['abc', 'Jaka jest dopuszczalna prędkość w strefie zamieszkania?', ['10 km/h', '20 km/h', '30 km/h'], 1, 'Strefa zamieszkania (D-40) – max 20 km/h.', 3, { sign: 'D-40' }],
    ['tn', 'Czy w strefie zamieszkania pieszy ma pierwszeństwo przed pojazdem?', true, 'W strefie zamieszkania pieszy korzysta z całej szerokości drogi i ma pierwszeństwo.', 3, { sign: 'D-40' }],
    ['abc', 'Ten znak oznacza:', ['koniec drogi z pierwszeństwem', 'drogę z pierwszeństwem', 'skrzyżowanie równorzędne'], 1, 'D-1 – droga z pierwszeństwem.', 2, { sign: 'D-1' }],
    ['tn', 'Czy wyjeżdżając z drogi wewnętrznej (D-46) musisz ustąpić pierwszeństwa pieszym idącym chodnikiem?', true, 'Wyjazd z drogi wewnętrznej to włączanie się do ruchu – ustępujesz wszystkim.', 3, { sign: 'D-46' }],
    ['abc', 'Znak D-42 w godzinach 23:00–5:00 oznacza limit:', ['50 km/h', '60 km/h', '70 km/h'], 1, 'W obszarze zabudowanym w nocy limit wynosi 60 km/h.', 3, { sign: 'D-42' }],
    ['tn', 'Czy znak D-5 oznacza, że masz pierwszeństwo na zwężonym odcinku?', true, 'D-5 – pierwszeństwo przed nadjeżdżającymi z przeciwka.', 2, { sign: 'D-5' }],
  ],
  't-poziome': [
    ['tn', 'Czy wolno najechać na linię pojedynczą ciągłą przy wyprzedzaniu?', false, 'Linii P-2 nie wolno przekraczać ani na nią najeżdżać.', 3, { mark: 'P-2' }],
    ['tn', 'Czy linia P-3 pozwala zakończyć wyprzedzanie, przejeżdżając od strony linii przerywanej?', true, 'Linia jednostronnie przekraczalna – przekraczasz ją od strony przerywanej.', 2, { mark: 'P-3' }],
    ['abc', 'Gdy znak pionowy i poziomy są sprzeczne, obowiązuje:', ['znak poziomy', 'znak pionowy', 'reguła prawej ręki'], 1, 'Znaki pionowe mają pierwszeństwo przed poziomymi.', 3],
    ['abc', 'Linia złożona z trójkątów (P-13) oznacza miejsce:', ['bezwzględnego zatrzymania', 'warunkowego zatrzymania przy ustępowaniu pierwszeństwa', 'przejścia dla pieszych'], 1, 'P-13 występuje z A-7: zatrzymujesz się, jeśli musisz ustąpić.', 2, { mark: 'P-13' }],
    ['tn', 'Czy wjeżdżając na pas ze strzałką w prawo możesz pojechać prosto?', false, 'Strzałki kierunkowe na pasach są wiążące.', 3],
  ],
  't-sygnaly': [
    ['tn', 'Czy przy sygnale czerwonym z zieloną strzałką musisz się zatrzymać przed skrętem w prawo?', true, 'Zielona strzałka pozwala skręcić dopiero po zatrzymaniu i ustąpieniu pierwszeństwa.', 3, { sign: 'S-2' }],
    ['tn', 'Czy przy sygnale żółtym możesz wjechać na skrzyżowanie, jeśli zatrzymanie wymagałoby gwałtownego hamowania?', true, 'Tak – to wyjątek od zakazu wjazdu przy żółtym.', 2, { sign: 'S-1y' }],
    ['abc', 'Policjant stoi zwrócony do ciebie bokiem. To oznacza:', ['stój', 'wolną drogę', 'uwagę – za chwilę zmiana'], 1, 'Bok policjanta = sygnał zezwalający na wjazd.', 3],
    ['abc', 'Policjant stoi zwrócony do ciebie przodem. To oznacza:', ['stój', 'wolną drogę', 'możesz skręcić w prawo'], 0, 'Przód lub tył policjanta = zakaz wjazdu.', 3],
    ['tn', 'Czy policjant kierujący ruchem przy działającej sygnalizacji ma pierwszeństwo przed światłami?', true, 'Polecenia osoby kierującej ruchem są ważniejsze od sygnałów świetlnych.', 3],
    ['abc', 'Żółty sygnał migający oznacza:', ['zakaz wjazdu', 'ostrzeżenie – obowiązują znaki i zasady ogólne', 'wolną drogę z pierwszeństwem'], 1, 'Żółte migające – sygnalizacja wyłączona, uwaga.', 2],
    ['abc', 'Kto przejedzie pierwszy?', ['A – ma zieloną strzałkę', 'B – ma zielone światło', 'jednocześnie'], 1, 'A z zieloną strzałką musi ustąpić B, który ma sygnał zielony.', 3, { scene: 'sygnalizacja' }],
  ],
  't-pierwszenstwo': [
    ['abc', 'Kto przejedzie pierwszy?', ['A', 'B', 'jednocześnie'], 1, 'B nadjeżdża z prawej strony pojazdu A – reguła prawej ręki.', 3, { scene: 'prawaReka' }],
    ['abc', 'Kolejność przejazdu pojazdów:', ['A, B, C', 'C, B, A', 'B, A, C'], 0, 'A nie ma nikogo z prawej; B ustępuje A; C skręca w lewo i ma B z prawej.', 3, { scene: 'trzyAuta' }],
    ['abc', 'Pojazd A skręca w lewo. Kto przejedzie pierwszy?', ['A', 'B', 'kolejność dowolna'], 1, 'Skręcając w lewo ustępujesz jadącym z przeciwka na wprost.', 3, { scene: 'lewoskret' }],
    ['abc', 'Kto przejedzie ostatni?', ['A', 'B', 'C'], 0, 'A wjeżdża z drogi podporządkowanej (A-7).', 3, { scene: 'podporzadkowana' }],
    ['tn', 'Czy na skrzyżowaniu równorzędnym tramwaj ma pierwszeństwo przed samochodem nadjeżdżającym z jego prawej strony?', true, 'Na skrzyżowaniu równorzędnym pojazd szynowy ma pierwszeństwo.', 3, { scene: 'tramwaj' }],
    ['tn', 'Czy wyjeżdżając z posesji musisz ustąpić pierwszeństwa rowerzyście jadącemu drogą dla rowerów?', true, 'Włączając się do ruchu ustępujesz wszystkim uczestnikom.', 3],
    ['tn', 'Czy wolno wjechać na skrzyżowanie przy zielonym świetle, jeśli za skrzyżowaniem nie ma miejsca na kontynuowanie jazdy?', false, 'Nie wolno blokować skrzyżowania.', 3],
    ['tn', 'Czy przed znakiem STOP przy pustej drodze możesz tylko zwolnić?', false, 'Zatrzymanie przed znakiem STOP jest bezwzględnie obowiązkowe.', 3, { scene: 'stop' }],
    ['abc', 'Na skrzyżowaniu z sygnalizacją skręcasz w lewo przy zielonym. Musisz ustąpić:', ['nikomu – masz zielone', 'pojazdom z przeciwka jadącym na wprost i w prawo', 'tylko tramwajom'], 1, 'Zielone nie zwalnia z obowiązku ustąpienia przy skręcie w lewo.', 3],
    ['abc', 'Pojazd uprzywilejowany zbliża się do skrzyżowania, ty masz zielone. Co robisz?', ['jadę, mam zielone', 'ułatwiam mu przejazd, w razie potrzeby się zatrzymuję', 'trąbię, by ostrzec innych'], 1, 'Pojazd uprzywilejowany ma pierwszeństwo bez względu na sygnały.', 3, { scene: 'uprzywilejowany' }],
  ],
  't-rondo': [
    ['tn', 'Czy wjeżdżając na rondo oznaczone A-7 i C-12 ustępujesz pojazdom jadącym po rondzie?', true, 'A-7 na wlocie = ustępujesz jadącym po rondzie.', 3, { scene: 'rondo' }],
    ['abc', 'Na rondzie oznaczonym wyłącznie znakiem C-12 pierwszeństwo ma:', ['pojazd na rondzie', 'pojazd wjeżdżający (z prawej)', 'większy pojazd'], 1, 'Bez A-7 obowiązuje reguła prawej ręki – wjeżdżający jest z prawej strony jadących po rondzie.', 3, { sign: 'C-12' }],
    ['tn', 'Czy wjeżdżając na rondo należy włączyć lewy kierunkowskaz?', false, 'Wjazd na rondo to nie skręt w lewo. Sygnalizujesz zjazd (prawy) i ewentualną zmianę pasa.', 2],
    ['tn', 'Czy na rondzie wolno wyprzedzać?', true, 'Zakaz wyprzedzania na skrzyżowaniu nie dotyczy skrzyżowań o ruchu okrężnym.', 2],
    ['abc', 'Chcesz na rondzie zawrócić. Który pas zajmujesz przed wjazdem (przy braku innych oznaczeń)?', ['prawy', 'lewy', 'dowolny'], 1, 'Zawracając i jadąc w lewo – zajmij lewy pas.', 2],
  ],
  't-predkosc': [
    ['abc', 'Dopuszczalna prędkość samochodu osobowego na autostradzie wynosi:', ['120 km/h', '130 km/h', '140 km/h'], 2, 'Autostrada – 140 km/h.', 3, { sign: 'D-9' }],
    ['abc', 'Dopuszczalna prędkość samochodu osobowego na drodze ekspresowej dwujezdniowej:', ['100 km/h', '120 km/h', '140 km/h'], 1, 'Ekspresowa dwujezdniowa – 120 km/h; jednojezdniowa – 100 km/h.', 3, { sign: 'D-7' }],
    ['abc', 'Jaka jest dopuszczalna prędkość samochodu osobowego na drodze jednojezdniowej poza obszarem zabudowanym?', ['80 km/h', '90 km/h', '100 km/h'], 1, 'Poza obszarem zabudowanym na drodze jednojezdniowej – 90 km/h.', 3],
    ['abc', 'Jaki minimalny odstęp musisz zachować przy 120 km/h na autostradzie?', ['30 m', '60 m', '120 m'], 1, 'Połowa prędkości w metrach: 120/2 = 60 m.', 3],
    ['tn', 'Czy dwukrotne zwiększenie prędkości wydłuża drogę hamowania około czterokrotnie?', true, 'Droga hamowania rośnie z kwadratem prędkości.', 2],
    ['abc', 'Samochód osobowy z przyczepą poza obszarem zabudowanym (nie autostrada) – limit:', ['70 km/h', '80 km/h', '90 km/h'], 0, 'Zespoły pojazdów – 70 km/h, na autostradzie i ekspresowej 80 km/h.', 2],
    ['tn', 'Czy kierowca w okresie próbnym (do 8. miesiąca) może jechać 120 km/h na autostradzie?', false, 'W pierwszych 8 miesiącach limit na autostradzie wynosi 100 km/h.', 2],
    ['tn', 'Czy limit ze znaku jest prędkością, z którą zawsze wolno jechać niezależnie od warunków?', false, 'Obowiązuje prędkość bezpieczna – limit ze znaku to maksimum.', 2],
  ],
  't-manewry': [
    ['tn', 'Czy wolno wyprzedzać bezpośrednio przed przejściem dla pieszych bez sygnalizacji?', false, 'Zakaz wyprzedzania na przejściu i bezpośrednio przed nim.', 3, { sign: 'D-6' }],
    ['abc', 'Jaki minimalny odstęp zachowujesz, wyprzedzając rowerzystę?', ['0,5 m', '1 m', '2 m'], 1, 'Przy wyprzedzaniu jednośladu – co najmniej 1 m.', 3],
    ['tn', 'Czy pojazd sygnalizujący skręt w lewo wyprzedzasz z prawej strony?', true, 'Pojazd skręcający w lewo wyprzedza się z prawej.', 2],
    ['tn', 'Czy wolno cofać na drodze ekspresowej?', false, 'Zakaz cofania na autostradzie i drodze ekspresowej.', 3],
    ['abc', 'Dwa pojazdy jednocześnie wjeżdżają na środkowy pas – jeden z lewego, drugi z prawego. Pierwszeństwo ma:', ['wjeżdżający z lewej', 'wjeżdżający z prawej', 'szybszy'], 1, 'Zmieniając pas ustępujesz także pojazdowi wjeżdżającemu na ten pas z prawej strony.', 3],
    ['tn', 'Czy wyprzedzanie na skrzyżowaniu z ruchem kierowanym jest dozwolone?', true, 'Zakaz wyprzedzania na skrzyżowaniu nie dotyczy skrzyżowań z ruchem kierowanym i rond.', 2],
    ['abc', 'Kolejność czynności przy zmianie pasa ruchu:', ['kierunkowskaz → lusterka → manewr', 'lusterka → kierunkowskaz → manewr', 'manewr → kierunkowskaz → lusterka'], 1, 'Najpierw obserwacja, potem sygnał, na końcu manewr.', 2],
  ],
  't-postoj': [
    ['abc', 'Najmniejsza odległość od przejścia dla pieszych, w której wolno się zatrzymać przed nim:', ['5 m', '10 m', '15 m'], 1, 'Zakaz zatrzymania na przejściu i bliżej niż 10 m przed nim.', 3],
    ['abc', 'Zakaz zatrzymania obowiązuje w odległości mniejszej niż ... od przystanku:', ['10 m', '15 m', '20 m'], 1, 'Przystanek komunikacji publicznej – 15 m.', 3, { sign: 'D-15' }],
    ['tn', 'Czy samochodem o DMC 3 t możesz zaparkować na chodniku?', false, 'Na chodniku tylko pojazdy o DMC do 2,5 t.', 2],
    ['abc', 'Ile metrów chodnika musisz zostawić pieszym, parkując na nim?', ['1 m', '1,5 m', '2 m'], 1, 'Co najmniej 1,5 m.', 3],
    ['tn', 'Czy wolno zatrzymać się na moście, gdy nie ma wyznaczonego miejsca?', false, 'Zakaz zatrzymania na moście, wiadukcie i w tunelu.', 2],
    ['tn', 'Czy pojazd stojący w korku przed przejściem dla pieszych narusza zakaz zatrzymania?', false, 'Unieruchomienie wynikające z warunków ruchu nie jest zatrzymaniem w rozumieniu zakazu – ale nie blokuj przejścia.', 1],
  ],
  't-niechronieni': [
    ['tn', 'Czy musisz ustąpić pierwszeństwa pieszemu wchodzącemu na przejście?', true, 'Od 2021 r. ustępujesz pieszemu na przejściu i wchodzącemu na nie.', 3, { scene: 'piesi' }],
    ['tn', 'Czy wolno omijać pojazd, który zatrzymał się przed przejściem, aby przepuścić pieszego?', false, 'Zakaz omijania pojazdu zatrzymanego w celu ustąpienia pierwszeństwa pieszemu.', 3],
    ['abc', 'Maksymalna prędkość hulajnogi elektrycznej wynosi:', ['15 km/h', '20 km/h', '25 km/h'], 1, 'Hulajnoga elektryczna – max 20 km/h.', 2],
    ['abc', 'Dziecko w wieku do 7 lat może korzystać z drogi tylko pod opieką osoby, która ukończyła:', ['10 lat', '13 lat', '18 lat'], 0, 'Opiekunem może być osoba, która ukończyła 10 lat.', 2],
    ['tn', 'Czy pieszy idący poza obszarem zabudowanym po zmroku poboczem musi mieć element odblaskowy?', true, 'Tak – chyba że idzie drogą dla pieszych lub chodnikiem.', 2],
    ['tn', 'Czy skręcając w prawo musisz ustąpić pierwszeństwa pieszemu przechodzącemu przez jezdnię drogi, na którą wjeżdżasz?', true, 'Pieszy przechodzący przez jezdnię drogi, na którą skręcasz, ma pierwszeństwo.', 3, { scene: 'piesi' }],
  ],
  't-autostrady': [
    ['abc', 'Jak tworzysz korytarz życia, jadąc lewym pasem drogi trzypasowej?', ['zjeżdżam w prawo', 'zjeżdżam w lewo', 'zatrzymuję się na pasie'], 1, 'Lewy pas – w lewo, pozostałe – w prawo.', 3],
    ['abc', 'Jak tworzysz korytarz życia, jadąc środkowym pasem drogi trzypasowej?', ['zjeżdżam w prawo', 'zjeżdżam w lewo', 'zostaję na środku'], 0, 'Wszystkie pasy poza skrajnie lewym zjeżdżają w prawo.', 3],
    ['tn', 'Czy przy jeździe na suwak należy zjechać na sąsiedni pas jak najwcześniej?', false, 'Jedziesz swoim pasem do miejsca zwężenia, tam włączasz się na przemian.', 3],
    ['abc', 'Na autostradzie trójkąt ostrzegawczy ustawiasz:', ['bezpośrednio za pojazdem', '30–50 m za pojazdem', 'ok. 100 m za pojazdem'], 2, 'Autostrada i ekspresowa – 100 m.', 2],
    ['tn', 'Czy na autostradę może wjechać pojazd o prędkości konstrukcyjnej 30 km/h?', false, 'Wymagane min. 40 km/h prędkości konstrukcyjnej.', 2],
    ['tn', 'Czy wolno zawrócić na autostradzie przez przejazd w pasie dzielącym?', false, 'Zakaz zawracania i wjazdu na pas dzielący.', 3],
  ],
  't-swiatla': [
    ['abc', 'Tylne światło przeciwmgłowe możesz włączyć, gdy widoczność spadnie poniżej:', ['50 m', '100 m', '150 m'], 0, 'Tylne przeciwmgłowe – przy widoczności mniejszej niż 50 m.', 3],
    ['tn', 'Czy w dzień przy dobrej widoczności możesz jechać na światłach do jazdy dziennej zamiast mijania?', true, 'Tak – światła do jazdy dziennej mogą zastąpić mijania przy dobrej przejrzystości powietrza.', 2],
    ['abc', 'Odległość między pojazdami przy holowaniu na lince:', ['2–3 m', '4–6 m', '8–10 m'], 1, 'Połączenie giętkie: 4–6 m.', 2],
    ['abc', 'Holując pojazd w obszarze zabudowanym, możesz jechać maksymalnie:', ['30 km/h', '40 km/h', '50 km/h'], 0, 'Holowanie: 30 km/h w obszarze zabudowanym, 60 km/h poza nim.', 2],
    ['tn', 'Czy w tunelu musisz mieć włączone światła mijania?', true, 'W tunelu zawsze światła mijania.', 2],
    ['tn', 'Czy na nieoświetlonej drodze możesz używać świateł drogowych, jadąc tuż za innym pojazdem?', false, 'Nie wolno oślepiać kierującego przed tobą.', 2],
  ],
  't-kolej': [
    ['tn', 'Czy wolno wjechać na przejazd kolejowy, gdy zapory zaczęły się opuszczać?', false, 'Zakaz wjazdu, gdy zapory są opuszczone lub zaczęły się opuszczać.', 3, { sign: 'A-9' }],
    ['tn', 'Czy wolno wyprzedzać bezpośrednio przed przejazdem kolejowym?', false, 'Zakaz wyprzedzania na przejeździe i bezpośrednio przed nim.', 3],
    ['abc', 'Tramwaj na drodze dwukierunkowej wyprzedzasz:', ['z lewej', 'z prawej', 'z dowolnej strony'], 1, 'Pojazd szynowy wyprzedza się z prawej (wyjątki: jednokierunkowa, torowisko po prawej).', 2, { sign: 'A-21' }],
    ['abc', 'Utknąłeś na przejeździe. Co robisz najpierw?', ['próbuję uruchomić silnik', 'wyprowadzam ludzi z pojazdu i odchodzę od torów', 'dzwonię do pomocy drogowej'], 1, 'Najważniejsze jest życie – opuść przejazd, potem powiadom 112.', 3],
  ],
  't-uprzywilejowane': [
    ['tn', 'Czy pojazd z samymi niebieskimi światłami błyskowymi (bez sygnału dźwiękowego) jest uprzywilejowany?', false, 'Uprzywilejowany wysyła jednocześnie sygnały świetlne i dźwiękowe.', 3],
    ['tn', 'Czy w obszarze zabudowanym musisz umożliwić autobusowi włączenie się do ruchu z przystanku?', true, 'Tak – gdy kierujący autobusem sygnalizuje zamiar, zmniejsz prędkość lub się zatrzymaj.', 2],
    ['abc', 'Przy kolizji (tylko straty materialne) należy:', ['zostawić pojazdy na miejscu do przyjazdu Policji', 'usunąć pojazdy z drogi, by nie tamowały ruchu', 'odjechać bez wymiany danych'], 1, 'Przy kolizji usuń pojazdy z drogi; spisz oświadczenie lub wezwij Policję.', 2],
    ['tn', 'Czy można jechać bezpośrednio za karetką na sygnale, korzystając z utworzonego przejazdu?', false, 'Zabronione – to stwarza zagrożenie.', 2],
  ],
  't-alkohol': [
    ['abc', 'Stan nietrzeźwości to stężenie alkoholu we krwi powyżej:', ['0,2 ‰', '0,5 ‰', '0,8 ‰'], 1, 'Powyżej 0,5 ‰ (0,25 mg/dm³ w wydychanym powietrzu) – przestępstwo.', 3],
    ['abc', 'Stan po użyciu alkoholu to stężenie:', ['0,1–0,2 ‰', '0,2–0,5 ‰', '0,5–0,8 ‰'], 1, 'Stan po użyciu: 0,2–0,5 ‰ – wykroczenie.', 3],
    ['tn', 'Czy kawa przyspiesza wydalanie alkoholu z organizmu?', false, 'Tylko czas – ok. 0,1–0,15 ‰ na godzinę.', 2],
    ['tn', 'Czy leki z trójkątem ostrzegawczym na opakowaniu mogą upośledzać zdolność prowadzenia?', true, 'Trójkąt na opakowaniu to ostrzeżenie dla kierowców.', 2],
    ['abc', 'Czujesz senność w trasie. Najlepiej:', ['otworzyć okno i jechać dalej', 'zatrzymać się i zdrzemnąć 15–20 min', 'przyspieszyć, by szybciej dojechać'], 1, 'Tylko odpoczynek usuwa senność.', 2],
  ],
  't-pomoc': [
    ['abc', 'Prawidłowy stosunek uciśnięć do oddechów przy RKO u dorosłego:', ['15:2', '30:2', '30:5'], 1, '30 uciśnięć : 2 oddechy.', 3],
    ['abc', 'Głębokość uciśnięć klatki piersiowej u dorosłego:', ['2–3 cm', '5–6 cm', '8–10 cm'], 1, '5–6 cm, tempo 100–120/min.', 2],
    ['abc', 'Poszkodowany jest nieprzytomny, ale oddycha prawidłowo. Co robisz?', ['rozpoczynam RKO', 'układam w pozycji bocznej bezpiecznej', 'podaję wodę'], 1, 'Pozycja boczna bezpieczna i kontrola oddechu.', 3],
    ['tn', 'Czy zdejmujesz kask motocykliście, który nie oddycha?', true, 'Kask zdejmujesz, gdy trzeba udrożnić drogi oddechowe i prowadzić RKO.', 3],
    ['abc', 'Oparzenie termiczne chłodzisz wodą przez:', ['1–2 minuty', '10–20 minut', 'godzinę'], 1, '10–20 minut letnią/chłodną wodą.', 2],
    ['abc', 'Ile czasu poświęcasz na ocenę oddechu?', ['do 10 sekund', '30 sekund', 'minutę'], 0, 'Patrz, słuchaj, wyczuj – do 10 sekund.', 2],
  ],
  't-dokumenty': [
    ['tn', 'Czy w Polsce musisz wozić dowód rejestracyjny samochodu osobowego?', false, 'Od 2018 r. nie – dane są w CEPiK.', 2],
    ['abc', 'Obowiązkowe wyposażenie samochodu osobowego w Polsce to:', ['apteczka i trójkąt', 'gaśnica i trójkąt', 'kamizelka i apteczka'], 1, 'Gaśnica i trójkąt ostrzegawczy.', 3],
    ['abc', 'Limit punktów karnych dla kierowcy z prawem jazdy dłużej niż rok wynosi:', ['20', '24', '30'], 1, '24 punkty (20 w pierwszym roku).', 2],
    ['abc', 'Okres próbny dla nowego kierowcy kat. B trwa:', ['1 rok', '2 lata', '3 lata'], 1, 'Okres próbny – 2 lata.', 2],
    ['abc', 'Minimalna głębokość bieżnika opon w samochodzie osobowym:', ['1,0 mm', '1,6 mm', '3,0 mm'], 1, 'W Polsce min. 1,6 mm.', 2],
  ],
  't-technika': [
    ['abc', 'System ABS:', ['skraca drogę hamowania na każdej nawierzchni', 'zapobiega blokowaniu kół i pozwala sterować podczas hamowania', 'zapobiega poślizgowi przy ruszaniu'], 1, 'ABS zachowuje sterowność; ASR działa przy ruszaniu.', 2],
    ['abc', 'Przy nadsterowności (tył ucieka) należy:', ['skręcić kierownicą w stronę poślizgu (kontra)', 'mocno zahamować', 'dodać gwałtownie gazu'], 0, 'Kontrowanie kierownicą w kierunku poślizgu.', 2],
    ['abc', 'Czerwona kontrolka ciśnienia oleju oznacza:', ['można jechać do serwisu', 'natychmiast zatrzymaj pojazd i wyłącz silnik', 'trzeba dolać płynu do spryskiwaczy'], 1, 'Czerwone kontrolki – natychmiastowe zatrzymanie.', 3],
    ['tn', 'Czy zbyt niskie ciśnienie w oponach wydłuża drogę hamowania?', true, 'I zwiększa zużycie paliwa oraz ryzyko uszkodzenia opony.', 1],
    ['tn', 'Czy pozostawienie pracującego silnika na postoju w obszarze zabudowanym dłużej niż minutę jest dozwolone?', false, 'To wykroczenie (hałas, spaliny).', 1],
  ],
  'k-moto': [
    ['abc', 'W jakim wieku można uzyskać prawo jazdy kat. A1?', ['14 lat', '16 lat', '18 lat'], 1, 'A1 – 16 lat.', 2, null, ['A1', 'A2', 'A', 'AM']],
    ['abc', 'Większość siły hamowania motocykla zapewnia:', ['hamulec tylny', 'hamulec przedni', 'hamowanie silnikiem'], 1, 'Przedni hamulec – ok. 70% siły hamowania.', 2, null, ['A1', 'A2', 'A', 'AM']],
    ['abc', 'Na łuku w lewo przy większej prędkości motocyklista inicjuje skręt:', ['popychając lewą rączkę kierownicy', 'popychając prawą rączkę kierownicy', 'tylko przechylając ciało w prawo'], 0, 'Przeciwskręt – popchnięcie rączki po stronie skrętu.', 3, null, ['A1', 'A2', 'A']],
    ['tn', 'Czy pasażer motocykla musi mieć kask ochronny?', true, 'Kask obowiązuje kierującego i pasażera.', 3, null, ['AM', 'A1', 'A2', 'A']],
    ['abc', 'Kat. AM uprawnia do kierowania:', ['motocyklem do 125 cm³', 'motorowerem i czterokołowcem lekkim', 'ciągnikiem rolniczym'], 1, 'AM – motorower i czterokołowiec lekki.', 2, null, ['AM']],
  ],
  'k-przyczepy': [
    ['abc', 'Prawo jazdy kat. B pozwala ciągnąć przyczepę cięższą niż 750 kg, gdy DMC zespołu nie przekracza:', ['3500 kg', '4250 kg', '7000 kg'], 0, 'Zespół do 3500 kg; z kodem 96 – do 4250 kg.', 3, null, ['B', 'B+E']],
    ['abc', 'Cofając z przyczepą, aby przyczepa skręciła w prawo, kierownicę kręcisz:', ['w prawo', 'w lewo', 'nie ma znaczenia'], 1, 'Przy cofaniu przyczepa skręca odwrotnie do ruchu kierownicy.', 3, null, ['B+E', 'C+E', 'D+E', 'T']],
    ['abc', 'Linka zrywająca przy przyczepie z hamulcem najazdowym służy do:', ['holowania', 'zahamowania przyczepy po odczepieniu się', 'zasilania świateł'], 1, 'Gdy przyczepa się odczepi, linka uruchamia jej hamulec.', 2, null, ['B+E', 'B']],
  ],
  'k-ciezarowe': [
    ['abc', 'Dzienny czas jazdy kierowcy zawodowego wynosi zasadniczo:', ['8 h', '9 h', '12 h'], 1, '9 h (2 razy w tygodniu do 10 h).', 3, null, ['C', 'C1', 'C+E', 'D', 'D1', 'D+E']],
    ['abc', 'Po ilu godzinach jazdy kierowca musi zrobić przerwę 45 min?', ['4,5 h', '6 h', '9 h'], 0, 'Po 4,5 h jazdy przerwa 45 min (lub 15 + 30).', 3, null, ['C', 'C1', 'C+E', 'D', 'D1', 'D+E']],
    ['abc', 'Maksymalny tygodniowy czas jazdy wynosi:', ['48 h', '56 h', '90 h'], 1, '56 h w tygodniu, 90 h w dwóch kolejnych tygodniach.', 2, null, ['C', 'C1', 'C+E', 'D', 'D1', 'D+E']],
    ['abc', 'Maksymalna szerokość typowego samochodu ciężarowego (bez chłodni):', ['2,50 m', '2,55 m', '2,60 m'], 1, '2,55 m; chłodnie 2,60 m.', 2, null, ['C', 'C1', 'C+E']],
    ['tn', 'Czy kierowca może używać karty kierowcy innej osoby, gdy zapomniał swojej?', false, 'Karta kierowcy jest osobista.', 3, null, ['C', 'C1', 'C+E', 'D', 'D1', 'D+E']],
    ['abc', 'Największe martwe pole samochodu ciężarowego występuje zwykle:', ['z tyłu po lewej', 'z prawej strony kabiny', 'przed maską'], 1, 'Prawa strona kabiny – niebezpieczne przy skręcie w prawo (rowerzyści).', 3, null, ['C', 'C1', 'C+E']],
  ],
  'k-autobusy': [
    ['tn', 'Czy kierowca autobusu może otworzyć drzwi przed całkowitym zatrzymaniem pojazdu?', false, 'Drzwi otwiera się po zatrzymaniu.', 3, null, ['D', 'D1', 'D+E']],
    ['abc', 'Kat. D1 uprawnia do kierowania autobusem:', ['do 16 miejsc pasażerskich i długości do 8 m', 'do 30 miejsc', 'dowolnym autobusem'], 0, 'D1 – do 16 miejsc dla pasażerów, długość do 8 m.', 2, null, ['D1', 'D']],
    ['abc', 'Autobus szkolny zatrzymany na przystanku z włączonymi światłami awaryjnymi – co robisz?', ['wyprzedzam szybko', 'zachowuję szczególną ostrożność, mogą wybiec dzieci', 'trąbię'], 1, 'Szczególna ostrożność – dzieci.', 3, null, ['D', 'D1', 'B']],
  ],
  'k-ciagniki': [
    ['abc', 'Maksymalna prędkość ciągnika rolniczego wynosi:', ['25 km/h', '30 km/h', '40 km/h'], 1, 'Ciągnik rolniczy i pojazd wolnobieżny – 30 km/h.', 2, null, ['T']],
    ['tn', 'Czy ciągnik rolniczy może wjechać na drogę ekspresową?', false, 'Zakaz – pojazd nie spełnia warunku min. 40 km/h i jest wolnobieżny.', 2, null, ['T']],
    ['abc', 'Prawo jazdy kat. T można uzyskać w wieku:', ['14 lat', '16 lat', '18 lat'], 1, 'Kat. T – 16 lat.', 2, null, ['T']],
  ],
  'p-plac': [
    ['abc', 'Ile prób masz na wykonanie zadania na placu egzaminacyjnym?', ['jedną', 'dwie', 'trzy'], 1, 'Dwa nieudane podejścia = wynik negatywny.', 2],
    ['abc', 'Podczas ruszania na wzniesieniu pojazd stoczył się o 50 cm. To:', ['dopuszczalne', 'błąd', 'zależy od egzaminatora'], 1, 'Stoczenie się powyżej ok. 20 cm to błąd.', 2],
  ],
  'p-egzamin': [
    ['abc', 'Ile punktów trzeba zdobyć, by zdać egzamin teoretyczny?', ['60 z 74', '68 z 74', '70 z 74'], 1, 'Min. 68 z 74 punktów.', 3],
    ['abc', 'Ile pytań jest na egzaminie teoretycznym?', ['20', '32', '40'], 1, '20 podstawowych + 12 specjalistycznych.', 2],
    ['abc', 'Na odpowiedź na pytanie specjalistyczne masz łącznie:', ['15 s', '35 s', '50 s'], 2, 'Specjalistyczne – 50 s na przeczytanie i odpowiedź.', 2],
  ],
  'b-lekarskie': [
    ['abc', 'Kierowca zawodowy przed 60. rokiem życia przechodzi badania lekarskie co:', ['2 lata', '5 lat', '10 lat'], 1, 'Co 5 lat, po 60. r.ż. co 30 miesięcy.', 2],
    ['abc', 'Minimalna ostrość wzroku dla kierowcy kat. B (obuoczna, z korekcją):', ['0,3', '0,5', '0,8'], 1, 'Grupa 1 – min. 0,5.', 2],
    ['tn', 'Czy obturacyjny bezdech senny może być przeciwwskazaniem do prowadzenia pojazdów?', true, 'Nieleczony OBS powoduje senność; leczenie zwykle pozwala prowadzić.', 2],
  ],
  'b-psycho': [
    ['tn', 'Czy kierowca przewozu osób przez aplikację (np. Uber, Bolt) musi mieć orzeczenie psychologiczne?', true, 'Przewóz osób samochodem osobowym wymaga badań lekarskich i psychologicznych.', 3],
    ['abc', 'Kierowca, który przekroczył limit punktów karnych, może zostać skierowany na:', ['badanie psychologiczne', 'kurs pierwszej pomocy', 'badanie słuchu'], 0, 'M.in. kontrolne sprawdzenie kwalifikacji i badanie psychologiczne.', 2],
    ['abc', 'Co najbardziej pogarsza wynik testu czasu reakcji?', ['lekki stres', 'niewyspanie', 'kawa w zwykłej ilości'], 1, 'Zmęczenie i niewyspanie najbardziej wydłużają reakcję.', 1],
  ],
  'b-taxi': [
    ['tn', 'Czy kierowca przewożący osoby przez aplikację musi współpracować z podmiotem posiadającym licencję na przewóz osób?', true, 'Od 2020 r. (lex Uber) przewóz osób wymaga licencji.', 3, null, ['B']],
    ['abc', 'Pasażer chce wysiąść na przejściu dla pieszych. Co robisz?', ['zatrzymuję się na chwilę', 'zatrzymuję się w miejscu dozwolonym', 'zatrzymuję się na przystanku autobusowym'], 1, 'Zakaz zatrzymania na przejściu i bliżej niż 10 m; na przystanku – zakaz w promieniu 15 m.', 3, null, ['B']],
  ],
};

export const QUESTIONS = [];
for (const [ch, rows] of Object.entries(RAW)) {
  for (const [i, r] of rows.entries()) {
    const n = i + 1;
    if (r[0] === 'tn') {
      const [, q, c, e, w = 2, img] = r;
      QUESTIONS.push({ id: `${ch}#${n}`, ch, t: 'tn', q, c, e, w, img, cats: ['all'] });
    } else {
      const [, q, a, c, e, w = 2, img, cats] = r;
      QUESTIONS.push({ id: `${ch}#${n}`, ch, t: 'abc', q, a, c, e, w, img, cats: cats || ['all'] });
    }
  }
}

// ---- Generatory pytań ze znaków (rozpoznawanie znaczenia) ----
function shuffle(a, rnd = Math.random) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

export function signQuestion(sign, mode = 'abc') {
  const pool = SIGNS.filter((s) => s.c !== sign.c && s.g === sign.g);
  const others = shuffle(pool.length >= 2 ? pool : SIGNS.filter((s) => s.c !== sign.c)).slice(0, 2);
  const chMap = { A: 't-znaki-a', B: 't-znaki-b', C: 't-znaki-c', D: 't-znaki-d', E: 't-znaki-d', S: 't-sygnaly' };
  if (mode === 'tn') {
    const truth = Math.random() < 0.5;
    const shown = truth ? sign : others[0];
    return { id: `sign-tn:${sign.c}:${shown.c}`, ch: chMap[sign.g], t: 'tn', q: `Czy ten znak to „${shown.n}”?`, c: truth, e: `To znak ${sign.c} „${sign.n}”. ${sign.m}`, w: 1, img: { sign: sign.c }, cats: ['all'], gen: true };
  }
  if (mode === 'pick') {
    const opts = shuffle([sign, ...others]);
    return { id: `sign-pick:${sign.c}`, ch: chMap[sign.g], t: 'pick', q: `Wskaż znak: „${sign.n}”`, a: opts.map((o) => o.c), c: opts.indexOf(sign), e: `${sign.c}: ${sign.m}`, w: 1, cats: ['all'], gen: true };
  }
  const opts = shuffle([sign, ...others]);
  return { id: `sign:${sign.c}`, ch: chMap[sign.g], t: 'abc', q: 'Co oznacza ten znak?', a: opts.map((o) => o.n), c: opts.indexOf(sign), e: `${sign.c}: ${sign.m}`, w: 1, img: { sign: sign.c }, cats: ['all'], gen: true };
}

export function questionsFor(chId) {
  const own = QUESTIONS.filter((q) => q.ch === chId);
  const groups = { 't-znaki-a': 'A', 't-znaki-b': 'B', 't-znaki-c': 'C', 't-znaki-d': 'D' };
  if (groups[chId]) {
    const signs = SIGNS.filter((s) => s.g === groups[chId] || (chId === 't-znaki-d' && s.g === 'E'));
    return own.concat(signs.map((s, i) => signQuestion(s, i % 3 === 0 ? 'pick' : 'abc')));
  }
  return own;
}

export const byId = (id) => QUESTIONS.find((q) => q.id === id);
export { shuffle };
