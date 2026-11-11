const sentences = [
  'Tester wkleja krótki akapit i sprawdza, czy formularz przyjmuje polskie znaki.',
  'Przykładowy opis produktu mieści się w limicie znaków i nie zawiera danych osobowych.',
  'Zespół porządkuje etykiety przycisków, zanim odda widok do przeglądu.',
  'Notatka wdrożeniowa tłumaczy, skąd biorą się dane pokazane na ekranie.',
  'Akapit pomocniczy wypełnia kartę, gdy prawdziwa treść nie jest jeszcze gotowa.',
  'Katalog narzędzi rośnie, a pusty stan strony głównej znika po dodaniu pierwszej pozycji.',
  'Walidacja komunikatu błędu powinna być czytelna także na wąskim ekranie.',
  'Dokumentacja opisuje tylko to, co użytkownik może zrobić w tym widoku.',
]

export function polishLorem(paragraphs: number, sentencesPerParagraph: number): string {
  const paragraphCount = clamp(paragraphs, 1, 12)
  const sentenceCount = clamp(sentencesPerParagraph, 1, 8)
  const blocks: string[] = []
  for (let paragraph = 0; paragraph < paragraphCount; paragraph += 1) {
    const chunk: string[] = []
    for (let sentence = 0; sentence < sentenceCount; sentence += 1) {
      const index = (paragraph * sentenceCount + sentence) % sentences.length
      chunk.push(sentences[index] ?? '')
    }
    blocks.push(chunk.join(' '))
  }
  return blocks.join('\n\n')
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.trunc(value)))
}
