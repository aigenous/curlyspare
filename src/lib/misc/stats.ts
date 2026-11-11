export interface TextStats {
  characters: number
  charactersNoSpaces: number
  words: number
  lines: number
  paragraphs: number
}

export function textStats(input: string): TextStats {
  const characters = Array.from(input).length
  const charactersNoSpaces = Array.from(input.replace(/\s/g, '')).length
  const words = input.trim() ? input.trim().split(/\s+/).length : 0
  const lines = input.length === 0 ? 0 : input.split(/\r\n|\r|\n/).length
  const paragraphs = input.trim() ? input.trim().split(/\n\s*\n/).length : 0
  return { characters, charactersNoSpaces, words, lines, paragraphs }
}
