# Regulamin serwisu CurlySpare

Obowiązuje od [DATA].

## § 1. Kto prowadzi Serwis

1. Serwis internetowy CurlySpare, dostępny pod adresem [ADRES SERWISU] (dalej: „Serwis”), prowadzi Piotr Szewczyk, prowadzący jednoosobową działalność gospodarczą pod firmą [PEŁNA NAZWA FIRMY], wpisaną do Centralnej Ewidencji i Informacji o Działalności Gospodarczej (CEIDG), adres: [ADRES], NIP: 6222809805, REGON: [REGON] (dalej: „Usługodawca”).
2. Kontakt z Usługodawcą: e-mail [E-MAIL KONTAKTOWY] lub pisemnie na adres wskazany w ust. 1.
3. Świadczenie usług w Serwisie nie wymaga zezwolenia.
4. Nazwa „aigenous”, używana w Serwisie, oznacza projekt prowadzony w ramach działalności gospodarczej Usługodawcy. Nie jest odrębną firmą ani stroną umowy z Użytkownikiem.

## § 2. Definicje

1. **Użytkownik** – każda osoba korzystająca z Serwisu.
2. **Konsument** – Użytkownik będący konsumentem w rozumieniu art. 22¹ Kodeksu cywilnego; postanowienia dotyczące Konsumenta stosuje się także do osoby fizycznej prowadzącej działalność gospodarczą, gdy korzysta z Serwisu w celu niemającym dla niej charakteru zawodowego (art. 385⁵ Kodeksu cywilnego).
3. **Narzędzia** – programy udostępnione w Serwisie, działające w przeglądarce Użytkownika.
4. **Generatory danych testowych** – Narzędzia tworzące losowe ciągi znaków o formacie i sumie kontrolnej odpowiadających m.in. numerom PESEL, NIP, REGON, KRS, serii i numerowi dowodu osobistego, numerowi paszportu, numerowi rachunku bankowego (NRB) lub kodom EAN/GTIN, a także Generator osoby testowej.
5. **Generator osoby testowej** – Narzędzie tworzące rekordy fikcyjnych osób (imię, nazwisko, płeć, data urodzenia, PESEL z poprawną sumą kontrolną oraz wymyślony adres), z możliwością skopiowania lub pobrania w formacie CSV lub JSON.
6. **Walidatory** – Narzędzia sprawdzające wyłącznie format oraz sumę lub cyfrę kontrolną wpisanego numeru, bez sprawdzania go w jakimkolwiek rejestrze.
7. **Regulamin** – niniejszy dokument.

## § 3. Jakie usługi świadczymy

1. Usługodawca udostępnia Narzędzia **nieodpłatnie**. Korzystanie z Serwisu nie wymaga zakładania konta, logowania ani podawania danych osobowych.
2. W Serwisie dostępne są w szczególności:
   1) **Generatory danych testowych**: PESEL, NIP, REGON, KRS, seria i numer dowodu osobistego, numer paszportu, NRB, EAN/GTIN oraz Generator osoby testowej;
   2) **Walidatory**: VAT UE, IBAN (PL), VIN, ISBN (z przeliczaniem ISBN-10 ↔ ISBN-13) oraz funkcje sprawdzania wbudowane w generatory;
   3) **konwertery i narzędzia kodowania**: m.in. formatowanie i walidacja JSON, XML i SQL, walidator JSON Schema, tester JSONPath, konwersje JSON ↔ YAML, CSV, XML, TOML i TypeScript, CSV na Markdown, Base64, Base32, hex, kodowanie URL, ucieczki Unicode, parser adresu URL, dekoder i koder JWT, skróty SHA, HMAC, UUID, kompresja gzip/deflate, znacznik czasu Unix, cURL na fetch;
   4) **narzędzia tekstowe i kalkulatory**: m.in. wielkość liter, licznik tekstu, lorem ipsum, slug, linie tekstu, porównanie tekstu, tester wyrażeń regularnych, podgląd Markdown, encje HTML, generator haseł, generator kodów QR, parser User-Agent, systemy liczbowe, jednostki danych, konwerter kolorów, kalkulatory VAT, procentów, CIDR i chmod, kwota słownie, strefy czasowe, różnica dat, dni robocze, wyjaśniacz cron.
3. Lista Narzędzi może się zmieniać; aktualna lista jest widoczna na stronie głównej Serwisu.
4. Rekordy z Generatora osoby testowej są oznaczone jako testowe: w kopiowanym tekście prefiksem „[TEST]”, a w plikach CSV i JSON polem „dane_testowe”.
5. Narzędzia **nie sprawdzają danych w żadnym rejestrze** (np. PESEL, CEIDG, KRS, REGON, VIES, Wykaz podatników VAT, CEPiK, rejestr dowodów osobistych, rejestry bankowe). Pozytywny wynik Walidatora oznacza tylko poprawny format i sumę kontrolną. Nie potwierdza, że numer został nadany, jest aktualny lub należy do określonego podmiotu. W szczególności Walidator VAT UE nie potwierdza statusu czynnego podatnika VAT UE; ten status można sprawdzić w systemie VIES Komisji Europejskiej, a dla polskich podatników – w Wykazie podatników VAT.
6. Wyniki Narzędzi mają charakter pomocniczy. Nie są poradą prawną, podatkową ani księgową.

## § 4. Jak działa Serwis i wymagania techniczne

1. Wszystkie obliczenia wykonuje kod uruchomiony w przeglądarce Użytkownika. **Treści wpisywane do Narzędzi, wybierane pliki i wygenerowane wyniki nie są wysyłane do Usługodawcy ani przez niego zapisywane.** Znikają po zamknięciu lub odświeżeniu strony, chyba że Użytkownik sam je skopiuje lub pobierze.
2. Pliki Serwisu (strony, skrypty, czcionki) są dostarczane przez dostawcę hostingu Vercel Inc. Serwis nie pobiera czcionek, skryptów ani innych zasobów z serwerów innych podmiotów. Przy każdym wejściu na stronę dostawca automatycznie rejestruje techniczne dane połączenia (logi serwera) – szczegóły w Polityce prywatności.
3. Do korzystania z Serwisu potrzebne są: urządzenie z dostępem do internetu oraz aktualna przeglądarka (np. Chrome, Firefox, Safari, Edge) z włączonym JavaScriptem. Niektóre funkcje mogą wymagać zgody przeglądarki, np. na dostęp do schowka (kopiowanie) albo na pobranie pliku.
4. Serwis nie używa plików cookies ani narzędzi analitycznych. W pamięci przeglądarki (localStorage) zapisuje tylko wybrany przez Użytkownika motyw kolorystyczny, i to dopiero po kliknięciu przełącznika motywu.

## § 5. Zawarcie i zakończenie umowy

1. Umowa o świadczenie usług drogą elektroniczną zostaje zawarta, gdy Użytkownik otworzy dowolną stronę Serwisu. Trwa przez czas korzystania z Serwisu.
2. Umowa kończy się, gdy Użytkownik zamknie stronę Serwisu. Nie są potrzebne żadne oświadczenia ani opłaty.
3. Usługodawca może w każdej chwili zakończyć lub zmienić działanie Serwisu albo poszczególnych Narzędzi, w szczególności z przyczyn technicznych, prawnych lub związanych z bezpieczeństwem.

## § 6. Zasady korzystania

1. Użytkownik korzysta z Serwisu zgodnie z prawem, Regulaminem i dobrymi obyczajami.
2. **Zabronione jest dostarczanie treści o charakterze bezprawnym** oraz korzystanie z Serwisu w celu popełnienia przestępstwa, naruszenia praw innych osób lub wyrządzenia komuś szkody.
3. Zabronione jest zakłócanie działania Serwisu, w tym ataki na infrastrukturę i zautomatyzowane masowe pobieranie zasobów w sposób obciążający serwery.
4. Nie wpisuj do Narzędzi produkcyjnych haseł, kluczy API, sekretów ani prywatnych tokenów, mimo że są przetwarzane wyłącznie lokalnie.

## § 7. Dane testowe – zasady obowiązkowe

1. Dane z Generatorów danych testowych są **losowe i służą wyłącznie do testowania oprogramowania**, np. walidacji formularzy, testów automatycznych i danych przykładowych w środowiskach deweloperskich.
2. Wygenerowane numery mają jedynie poprawny format i sumę kontrolną. Nie pochodzą z żadnego rejestru i nie identyfikują żadnej osoby, firmy, dokumentu, rachunku ani produktu. Pula możliwych numerów jest ograniczona, więc **numer może przypadkowo pokrywać się z numerem nadanym istniejącej osobie lub firmie**. Taka zbieżność nie oznacza, że wynik dotyczy tej osoby lub firmy.
3. Rekordy z Generatora osoby testowej są w całości fikcyjne: imiona i nazwiska pochodzą z krótkiej listy popularnych imion i nazwisk, miejscowości i ulice są wymyślone, kod pocztowy ma tylko poprawny format, a PESEL – tylko poprawną sumę kontrolną.
4. Usługodawca **nie zapisuje** wygenerowanych danych.
5. **Zabronione jest** używanie wygenerowanych danych:
   1) do podszywania się pod inne osoby lub firmy, w tym do tworzenia tzw. syntetycznych tożsamości;
   2) w dokumentach lub jako elementu dokumentów mających uchodzić za autentyczne;
   3) w formularzach i postępowaniach urzędowych, sądowych, bankowych, kredytowych, pożyczkowych, ubezpieczeniowych, płatniczych lub innych finansowych oraz w procesach weryfikacji tożsamości (KYC);
   4) do zakładania lub weryfikowania rzeczywistych kont, rachunków lub profili oraz przy zawieraniu rzeczywistych umów;
   5) jako danych prawdziwych w systemach produkcyjnych – w tym usuwanie oznaczenia „[TEST]” lub pola „dane_testowe” w celu ukrycia testowego charakteru danych;
   6) w przypadku kodów EAN/GTIN – do oznaczania produktów wprowadzanych do obrotu.
6. Takie użycie może stanowić przestępstwo, w szczególności z art. 190a § 2 (podszywanie się pod inną osobę), art. 270 (fałszerstwo dokumentu), art. 275 (posługiwanie się dokumentem stwierdzającym tożsamość innej osoby), art. 286 (oszustwo) lub art. 297 (oszustwo kredytowe) Kodeksu karnego.
7. Za sposób wykorzystania wygenerowanych danych poza Serwisem odpowiada Użytkownik.

## § 8. Brak gwarancji

1. Narzędzia są udostępniane nieodpłatnie, **w stanie, w jakim się znajdują („as is”)**. Usługodawca dba o ich poprawne działanie, ale nie gwarantuje, że wyniki będą zawsze poprawne, kompletne lub przydatne do określonego celu, ani że Serwis będzie dostępny bez przerw.
2. Przed użyciem wyniku w ważnej sprawie (np. kwoty VAT, kwoty słownie, liczby dni roboczych, harmonogramu cron, konwersji danych) sprawdź go samodzielnie.
3. Serwis może być czasowo niedostępny, np. z powodu prac technicznych, awarii u dostawcy hostingu lub siły wyższej.

## § 9. Odpowiedzialność

1. Usługodawca nie odpowiada za szkody wynikłe z:
   1) użycia Narzędzi lub ich wyników niezgodnie z Regulaminem, w szczególności z § 6 lub § 7;
   2) czasowej niedostępności Serwisu z przyczyn opisanych w § 8 ust. 3;
   3) niezweryfikowania wyniku przez Użytkownika przed jego użyciem w ważnej sprawie.
2. Powyższe ograniczenia **nie dotyczą** szkody wyrządzonej umyślnie (art. 473 § 2 Kodeksu cywilnego) ani wskutek rażącego niedbalstwa, a także szkody na osobie.
3. Regulamin nie wyłącza ani nie ogranicza odpowiedzialności Usługodawcy w zakresie, w jakim nie pozwalają na to przepisy prawa.
4. Wobec Konsumentów postanowienia Regulaminu stosuje się w zakresie, w jakim nie są sprzeczne z bezwzględnie obowiązującymi przepisami prawa. Postanowienia, które byłyby niedozwolone w rozumieniu art. 385¹–385³ Kodeksu cywilnego, nie wiążą Konsumenta, a w ich miejsce stosuje się przepisy prawa.

## § 10. Prawa autorskie i licencje

1. Nazwa, wygląd i teksty Serwisu są chronione prawem. Można z nich korzystać w zakresie dozwolonym przez prawo, w tym w ramach dozwolonego użytku.
2. Własny kod źródłowy Serwisu jest udostępniany na **licencji MIT** (Copyright (c) 2026 Piotr Szewczyk). Licencja nie obejmuje nazwy, logotypu ani tekstów Serwisu.
3. Serwis zawiera komponenty open source stron trzecich, udostępniane na ich własnych licencjach (m.in. MIT, ISC, BSD, Apache-2.0), oraz kroje pisma **Poltawski Nowy, Atkinson Hyperlegible Next i Atkinson Hyperlegible Mono na licencji SIL Open Font License 1.1**. Wykaz komponentów, informacje o prawach autorskich i pełne teksty licencji są na stronie [Licencje oprogramowania stron trzecich](/licencje). Licencje stron trzecich mają pierwszeństwo przed Regulaminem w zakresie tych komponentów.
4. Wyniki działania Narzędzi należą do Użytkownika w zakresie, w jakim mogą być przedmiotem praw.

## § 11. Reklamacje

1. Reklamację dotyczącą działania Serwisu możesz zgłosić e-mailem na adres [E-MAIL KONTAKTOWY] lub pisemnie na adres [ADRES].
2. Opisz problem i podaj adres do odpowiedzi. Pomoże nam też nazwa Narzędzia, data oraz używana przeglądarka i system.
3. Odpowiadamy w ciągu **14 dni** od otrzymania reklamacji, e-mailem (albo na inny wskazany adres).
4. Konsument może skorzystać z pozasądowych sposobów rozwiązywania sporów, w szczególności:
   1) z bezpłatnej pomocy **miejskiego lub powiatowego rzecznika konsumentów**;
   2) z mediacji lub stałego polubownego sądu konsumenckiego przy **wojewódzkim inspektoracie Inspekcji Handlowej**;
   3) z pomocy organizacji konsumenckich (np. Federacji Konsumentów).

   Informacje o tych możliwościach są na stronie Urzędu Ochrony Konkurencji i Konsumentów: https://prawakonsumenta.uokik.gov.pl. Skorzystanie z nich jest dobrowolne.

## § 12. Dane osobowe

Zasady przetwarzania danych osobowych, w tym logów serwera i korespondencji e-mail, opisuje [Polityka prywatności](/polityka-prywatnosci).

## § 13. Zmiany Regulaminu i postanowienia końcowe

1. Usługodawca może zmienić Regulamin z ważnych przyczyn, w szczególności zmiany przepisów, zmiany zakresu Narzędzi, zmiany dostawcy hostingu lub względów bezpieczeństwa.
2. Nowa wersja zostanie opublikowana w Serwisie z datą wejścia w życie, nie wcześniej niż **14 dni** po publikacji. Krótszy termin jest możliwy, gdy zmiana wynika z przepisów prawa, polega wyłącznie na dodaniu Narzędzia lub dotyczy bezpieczeństwa.
3. Zmiany **nie działają wstecz**: do korzystania z Serwisu przed datą wejścia zmian w życie stosuje się dotychczasowy Regulamin. Jeśli nie akceptujesz zmian, możesz po prostu przestać korzystać z Serwisu.
4. Regulamin jest dostępny nieodpłatnie pod adresem [ADRES SERWISU]/regulamin; możesz go zapisać lub wydrukować.
5. Regulamin podlega prawu polskiemu, w szczególności ustawie z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną i Kodeksowi cywilnemu. Wybór prawa nie pozbawia Konsumenta ochrony, jaką zapewniają mu bezwzględnie obowiązujące przepisy państwa jego zwykłego pobytu.
6. Nic w Regulaminie nie ogranicza praw Konsumenta wynikających z bezwzględnie obowiązujących przepisów prawa.
7. Regulamin obowiązuje od [DATA].
