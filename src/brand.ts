import { site } from './site'

export const brand = {
  name: site.name,
  workingName: site.workingName,
  siteUrl: (import.meta.env.VITE_SITE_URL || site.defaultSiteUrl).replace(/\/$/, ''),
  storagePrefix: site.storagePrefix,
  operator: site.operator,
} as const

export const generatorDisclaimer =
  'Dane wygenerowane losowo, wyłącznie do testowania oprogramowania. Numery mają jedynie poprawną sumę kontrolną i mogą przypadkowo pokrywać się z numerami istniejących osób lub firm; nie identyfikują nikogo, a serwis ich nie zapisuje. Zabronione jest używanie ich do podszywania się pod inne osoby, w dokumentach, formularzach urzędowych, bankowych lub finansowych – może to stanowić przestępstwo (m.in. art. 190a § 2, 270, 286 Kodeksu karnego).'
