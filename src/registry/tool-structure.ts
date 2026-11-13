export interface StructureColumn {
  key: string
  label: string
  mono?: boolean
}

export interface StructureTable {
  caption: string
  columns: readonly StructureColumn[]
  rows: readonly { cells: Readonly<Record<string, string>> }[]
  note?: string
}

const peselStructure: StructureTable = {
  caption: 'Budowa numeru PESEL',
  note: 'Jeśli suma się nie zgadza, walidator nie wskazuje, która cyfra jest błędna, i nie podaje poprawionego numeru – błąd może być w każdej z cyfr.',
  columns: [
    { key: 'digits', label: 'Cyfry', mono: true },
    { key: 'meaning', label: 'Znaczenie' },
    { key: 'notes', label: 'Uwagi' },
  ],
  rows: [
    { cells: { digits: '1–2', meaning: 'Rok urodzenia', notes: 'Dwie ostatnie cyfry roku' } },
    { cells: { digits: '3–4', meaning: 'Miesiąc', notes: 'Powiększony o liczbę zależną od stulecia' } },
    { cells: { digits: '5–6', meaning: 'Dzień', notes: '01–31' } },
    {
      cells: {
        digits: '7–10',
        meaning: 'Numer serii i płeć',
        notes: '10. cyfra parzysta: kobieta, nieparzysta: mężczyzna',
      },
    },
    { cells: { digits: '11', meaning: 'Cyfra kontrolna', notes: 'Wyliczana z pozostałych dziesięciu' } },
  ],
}

const tables: Readonly<Record<string, StructureTable>> = {
  'generator-pesel': peselStructure,
}

export function structureTableFor(slug: string): StructureTable | null {
  return tables[slug] ?? null
}
