import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { site } from '../src/site'

const root = fileURLToPath(new URL('..', import.meta.url))
const placeholder = '[ADRES E-MAIL DO KONTAKTU]'

function walk(directory: string): string[] {
  let entries: string[]
  try {
    entries = readdirSync(directory)
  } catch {
    return []
  }
  const files: string[] = []
  for (const entry of entries) {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) {
      files.push(...walk(path))
      continue
    }
    files.push(path)
  }
  return files
}

describe('operator details', () => {
  it('keeps the name, legal form, NIP and REGON, and leaves address and email as Lawyer placeholders', () => {
    expect(site.operator).toEqual({
      name: 'Piotr Szewczyk',
      legalForm: 'jednoosobowa działalność gospodarcza',
      nip: '6222809805',
      regon: '368785970',
      correspondenceAddress: '[ADRES]',
      email: '[E-MAIL KONTAKTOWY]',
    })
  })

  it('does not leave the contact placeholder anywhere in src/ or public/', () => {
    const files = [...walk(join(root, 'src')), ...walk(join(root, 'public'))]
    expect(files.length).toBeGreaterThan(0)
    const hits = files.filter((file) => readFileSync(file).includes(placeholder))
    expect(hits.map((file) => relative(root, file))).toEqual([])
  })
})
