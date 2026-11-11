const polish: Record<string, string> = {
  ą: 'a',
  ć: 'c',
  ę: 'e',
  ł: 'l',
  ń: 'n',
  ó: 'o',
  ś: 's',
  ź: 'z',
  ż: 'z',
}

export function slugifyPolish(input: string): string {
  const folded = Array.from(input.normalize('NFC'))
    .map((char) => polish[char.toLocaleLowerCase('pl-PL')] ?? char)
    .join('')
  return folded
    .toLocaleLowerCase('pl-PL')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
