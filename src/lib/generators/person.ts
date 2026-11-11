import { formatIsoDate } from './dates'
import { generatePesel, validatePesel, type PeselGenerateOptions, type PeselSex } from './pesel'
import { cryptoRandomInt, type RandomInt } from './random'

/**
 * Short name and address lists written for this tool.
 * They are not taken from a population register or a published dataset.
 * Every person is fictional; the PESEL only has a valid checksum.
 */
const GIVEN_NAMES: Record<PeselSex, readonly string[]> = {
  kobieta: [
    'Anna', 'Maria', 'Katarzyna', 'Agnieszka', 'Ewa',
    'Joanna', 'Magdalena', 'Monika', 'Natalia', 'Zofia',
  ],
  mezczyzna: [
    'Adam', 'Piotr', 'Krzysztof', 'Tomasz', 'Paweł',
    'Marcin', 'Michał', 'Jakub', 'Kamil', 'Łukasz',
  ],
}

const SURNAMES: readonly Record<PeselSex, string>[] = [
  { kobieta: 'Nowak', mezczyzna: 'Nowak' },
  { kobieta: 'Kowalska', mezczyzna: 'Kowalski' },
  { kobieta: 'Wiśniewska', mezczyzna: 'Wiśniewski' },
  { kobieta: 'Wójcik', mezczyzna: 'Wójcik' },
  { kobieta: 'Kamińska', mezczyzna: 'Kamiński' },
  { kobieta: 'Lewandowska', mezczyzna: 'Lewandowski' },
  { kobieta: 'Zielińska', mezczyzna: 'Zieliński' },
  { kobieta: 'Woźniak', mezczyzna: 'Woźniak' },
  { kobieta: 'Dąbrowska', mezczyzna: 'Dąbrowski' },
  { kobieta: 'Kozłowska', mezczyzna: 'Kozłowski' },
]

const CITIES = ['Testowo', 'Przykładów', 'Fikcyjnów', 'Debugowo', 'Atrapa'] as const

const STREETS = [
  'ul. Testowa',
  'ul. Przykładowa',
  'ul. Fikcyjna',
  'ul. Próbna',
  'al. Wymyślona',
  'os. Debugowe',
] as const

export const TEST_PERSON_CSV_HEADER =
  'imie,nazwisko,plec,data_urodzenia,pesel,kod_pocztowy,miejscowosc,ulica,numer'

export interface TestPerson {
  firstName: string
  lastName: string
  sex: PeselSex
  birthDate: string
  pesel: string
  postalCode: string
  city: string
  street: string
  houseNumber: string
}

export type TestPersonOptions = Pick<PeselGenerateOptions, 'birthDate' | 'sex' | 'from' | 'to'>

export function generateTestPerson(
  options: TestPersonOptions = {},
  rng: RandomInt = cryptoRandomInt,
): TestPerson {
  const sex = options.sex ?? randomSex(rng)
  const names = GIVEN_NAMES[sex]
  const firstName = names[rng(names.length)] ?? ''
  const surname = SURNAMES[rng(SURNAMES.length)]
  const pesel = generatePesel({ ...options, sex }, rng)
  const parsed = validatePesel(pesel)
  if (!parsed.valid || surname === undefined) {
    throw new Error('Generated PESEL did not validate')
  }
  const city = CITIES[rng(CITIES.length)] ?? ''
  const street = STREETS[rng(STREETS.length)] ?? ''
  return {
    firstName,
    lastName: surname[sex],
    sex,
    birthDate: formatIsoDate(parsed.birthDate),
    pesel,
    postalCode: postalCode(rng),
    city,
    street,
    houseNumber: String(1 + rng(200)),
  }
}

export function generateTestPeople(
  count: number,
  options: TestPersonOptions = {},
  rng: RandomInt = cryptoRandomInt,
): TestPerson[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('count must be a non-negative integer')
  }
  const people: TestPerson[] = []
  const seen = new Set<string>()
  const maxAttempts = count * 50 + 1000
  for (let attempt = 0; people.length < count; attempt += 1) {
    if (attempt >= maxAttempts) {
      throw new RangeError('Unable to generate the requested number of unique people')
    }
    const person = generateTestPerson(options, rng)
    if (seen.has(person.pesel)) {
      continue
    }
    seen.add(person.pesel)
    people.push(person)
  }
  return people
}

export function testPeopleToCsv(people: readonly TestPerson[]): string {
  const rows = people.map((person) =>
    [
      person.firstName,
      person.lastName,
      person.sex,
      person.birthDate,
      person.pesel,
      person.postalCode,
      person.city,
      person.street,
      person.houseNumber,
    ].map(csvField).join(','),
  )
  return [TEST_PERSON_CSV_HEADER, ...rows].join('\n')
}

export function testPeopleToJson(people: readonly TestPerson[]): string {
  return JSON.stringify(people.map(exportedPerson), null, 2)
}

function exportedPerson(person: TestPerson): Record<string, string> {
  return {
    imie: person.firstName,
    nazwisko: person.lastName,
    plec: person.sex,
    data_urodzenia: person.birthDate,
    pesel: person.pesel,
    kod_pocztowy: person.postalCode,
    miejscowosc: person.city,
    ulica: person.street,
    numer: person.houseNumber,
  }
}

function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

function postalCode(rng: RandomInt): string {
  return `${String(rng(100)).padStart(2, '0')}-${String(rng(1000)).padStart(3, '0')}`
}

function randomSex(rng: RandomInt): PeselSex {
  return rng(2) === 0 ? 'kobieta' : 'mezczyzna'
}
