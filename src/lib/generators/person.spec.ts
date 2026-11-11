import { describe, expect, it } from 'vitest'
import { validatePesel } from './pesel'
import {
  formatTestPersonCopyLine,
  generateTestPeople,
  generateTestPerson,
  TEST_COPY_PREFIX,
  TEST_DATA_FIELD,
  TEST_DATA_MARKER,
  testPeopleToCsv,
  testPeopleToJson,
  type TestPerson,
} from './person'
import { sequenceRng } from './sequence-rng'

const birthDate = { year: 1944, month: 5, day: 14 }

describe('fictional test person', () => {
  it('builds a man whose PESEL matches the chosen date and sex', () => {
    const person = generateTestPerson(
      { sex: 'mezczyzna', birthDate },
      sequenceRng([1, 1, 0, 1, 3, 2, 0, 0, 12, 345, 6]),
    )
    expect(person).toMatchObject({
      firstName: 'Piotr',
      lastName: 'Kowalski',
      sex: 'mezczyzna',
      birthDate: '1944-05-14',
      pesel: '44051401359',
      city: 'Testowo',
      street: 'ul. Testowa',
      postalCode: '12-345',
      houseNumber: '7',
    })
  })

  it('uses the feminine surname and an even PESEL sex digit', () => {
    const person = generateTestPerson(
      { sex: 'kobieta', birthDate: { year: 2000, month: 2, day: 29 } },
      sequenceRng([0, 2, 0, 0, 0, 0, 1, 1, 1, 1, 0]),
    )
    expect(person.firstName).toBe('Anna')
    expect(person.lastName).toBe('Wiśniewska')
    expect(person.pesel.startsWith('002229')).toBe(true)
    expect(validatePesel(person.pesel)).toMatchObject({
      valid: true,
      sex: 'kobieta',
      birthDate: { year: 2000, month: 2, day: 29 },
    })
  })

  it('keeps generated people distinct and format-valid', () => {
    const people = generateTestPeople(8)
    expect(new Set(people.map((person) => person.pesel)).size).toBe(8)
    for (const person of people) {
      expect(person.postalCode).toMatch(/^\d{2}-\d{3}$/)
      expect(validatePesel(person.pesel)).toMatchObject({
        valid: true,
        sex: person.sex,
        birthDate: {
          year: Number(person.birthDate.slice(0, 4)),
          month: Number(person.birthDate.slice(5, 7)),
          day: Number(person.birthDate.slice(8, 10)),
        },
      })
    }
  })

  it('exports CSV and JSON with Polish field names', () => {
    const person: TestPerson = {
      firstName: 'Ewa',
      lastName: 'Nowak',
      sex: 'kobieta',
      birthDate: '1990-01-02',
      pesel: '90010200002',
      postalCode: '00-001',
      city: 'Testowo, gmina',
      street: 'ul. "Fikcyjna"',
      houseNumber: '4',
    }
    const csv = testPeopleToCsv([person])
    const [header, row] = csv.split('\n')
    expect(TEST_DATA_FIELD).toBe('dane_testowe')
    expect(header).toBe(
      'imie,nazwisko,plec,data_urodzenia,pesel,kod_pocztowy,miejscowosc,ulica,numer,dane_testowe',
    )
    expect(header?.split(',').at(-1)).toBe('dane_testowe')
    expect(row?.endsWith(`,${TEST_DATA_MARKER}`)).toBe(true)
    expect(csv).toContain('"Testowo, gmina"')
    expect(csv).toContain('"ul. ""Fikcyjna"""')
    const parsed: unknown = JSON.parse(testPeopleToJson([person]))
    expect(parsed).toEqual([
      {
        imie: 'Ewa',
        nazwisko: 'Nowak',
        plec: 'kobieta',
        data_urodzenia: '1990-01-02',
        pesel: '90010200002',
        kod_pocztowy: '00-001',
        miejscowosc: 'Testowo, gmina',
        ulica: 'ul. "Fikcyjna"',
        numer: '4',
        dane_testowe: TEST_DATA_MARKER,
      },
    ])
    const record = (parsed as { dane_testowe: string }[])[0]
    expect(record?.dane_testowe).toBe(TEST_DATA_MARKER)
    expect(record?.dane_testowe).toBe('tak')
    expect(row?.endsWith(`,${record?.dane_testowe}`)).toBe(true)
  })

  it('marks every exported record as test data and adds no other fields', () => {
    const person = generateTestPerson(
      { sex: 'kobieta', birthDate: { year: 1991, month: 3, day: 4 } },
      sequenceRng([0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0]),
    )
    const parsed: unknown = JSON.parse(testPeopleToJson([person]))
    const records = parsed as Record<string, string>[]
    expect(records).toHaveLength(1)
    const record = records[0]
    expect(record).toBeDefined()
    if (!record) return
    expect(Object.keys(record)).toEqual([
      'imie',
      'nazwisko',
      'plec',
      'data_urodzenia',
      'pesel',
      'kod_pocztowy',
      'miejscowosc',
      'ulica',
      'numer',
      'dane_testowe',
    ])
    expect(Object.hasOwn(record, 'dane_testowe')).toBe(true)
    expect(record.dane_testowe).toBe('tak')
    const banned = ['dowod', 'paszport', 'telefon', 'email', 'e-mail', 'nrb', 'iban', 'nip', 'phone']
    for (const key of Object.keys(record)) {
      expect(banned.includes(key)).toBe(false)
    }
    const csvRow = testPeopleToCsv([person]).split('\n')[1] ?? ''
    expect(csvRow.endsWith(',tak')).toBe(true)
  })

  it('prefixes every copied line with [TEST]', () => {
    const first = generateTestPerson(
      { sex: 'mezczyzna', birthDate },
      sequenceRng([1, 1, 0, 1, 3, 2, 0, 0, 12, 345, 6]),
    )
    const second: TestPerson = {
      firstName: 'Ewa',
      lastName: 'Nowak',
      sex: 'kobieta',
      birthDate: '1990-01-02',
      pesel: '90010200002',
      postalCode: '00-001',
      city: 'Testowo',
      street: 'ul. Fikcyjna',
      houseNumber: '4',
    }
    const lines = [first, second].map((person) =>
      formatTestPersonCopyLine(person, person.sex === 'kobieta' ? 'kobieta' : 'mężczyzna'),
    )
    expect(TEST_COPY_PREFIX).toBe('[TEST]')
    expect(lines[0]).toBe(
      '[TEST] Piotr Kowalski, mężczyzna, 14.05.1944, PESEL 44051401359, ul. Testowa 7, 12-345 Testowo',
    )
    expect(lines.every((line) => line.startsWith('[TEST]'))).toBe(true)
    expect(lines.join('\n').split('\n')).toHaveLength(2)
  })
})
