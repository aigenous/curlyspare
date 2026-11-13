import { site } from './site'

export const brand = {
  name: site.name,
  workingName: site.workingName,
  siteUrl: (import.meta.env?.VITE_SITE_URL || site.defaultSiteUrl).replace(/\/$/, ''),
  storagePrefix: site.storagePrefix,
  operator: site.operator,
} as const

export const generatorDisclaimer =
  'Dane fikcyjne, wygenerowane losowo wyłącznie do testowania oprogramowania. Numery mają jedynie poprawny format i sumę kontrolną i mogą przypadkowo pokrywać się z numerami istniejących osób lub firm; nie identyfikują nikogo, a serwis ich nie zapisuje. Zabronione jest używanie ich do podszywania się pod inne osoby, w dokumentach, formularzach urzędowych, bankowych lub finansowych – może to stanowić przestępstwo (m.in. art. 190a § 2, 270, 275, 286 i 297 Kodeksu karnego).'

export const personTestDisclaimer =
  'Fikcyjne dane wyłącznie do testowania oprogramowania. Imiona, nazwiska i adresy są wymyślone, a PESEL ma jedynie poprawną sumę kontrolną – może przypadkowo pokrywać się z numerem istniejącej osoby, ale rekord jej nie dotyczy. Serwis nie zapisuje wygenerowanych danych. Zabronione jest używanie ich jako danych prawdziwych: do podszywania się, zakładania lub weryfikowania kont, w dokumentach, formularzach urzędowych, bankowych, pożyczkowych lub innych finansowych – może to stanowić przestępstwo (m.in. art. 190a § 2, 270, 275, 286 i 297 Kodeksu karnego).'

export const gtinDisclaimer =
  'Kody wygenerowane losowo, wyłącznie do testów. Mają poprawną cyfrę kontrolną, ale nie zostały przydzielone przez GS1 ani inny uprawniony podmiot i mogą przypadkowo pokrywać się z kodami istniejących produktów. Nie wolno ich umieszczać na produktach wprowadzanych do obrotu.'

export const vatValidatorDisclaimer =
  'Narzędzie sprawdza wyłącznie format i – tam, gdzie algorytm jest publiczny – sumę kontrolną numeru. Nie łączy się z VIES ani innym rejestrem, więc nie potwierdza, że numer został nadany ani że podmiot jest aktywnym podatnikiem VAT UE. Status sprawdzisz w systemie VIES Komisji Europejskiej, a dla polskich podatników – w Wykazie podatników VAT (tzw. białej liście).'

export const vinValidatorDisclaimer =
  'Narzędzie sprawdza wyłącznie format i cyfrę kontrolną (9. znak) według ISO 3779. Nie weryfikuje pojazdu w żadnym rejestrze (np. CEPiK) ani jego historii. Cyfra kontrolna jest obowiązkowa w pojazdach z rynku północnoamerykańskiego; wiele pojazdów europejskich jej nie stosuje, więc wynik „niepoprawna cyfra kontrolna” nie oznacza, że VIN jest fałszywy.'

export const isbnValidatorDisclaimer =
  'Narzędzie sprawdza sumę kontrolną i przelicza ISBN-10 ↔ ISBN-13. Nie sprawdza, czy publikacja o tym numerze istnieje.'
