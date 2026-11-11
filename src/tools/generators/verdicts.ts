export function euVatPassMessage(country: string, vat: string): string {
  return `Format i suma kontrolna poprawne (${country}): ${vat}.`
}

export function vinPassMessage(vin: string): string {
  return `Cyfra kontrolna poprawna: ${vin}.`
}

export function isbnPassMessage(kind: string, isbn10: string | null): string {
  const summary = `Suma kontrolna poprawna (${kind}).`
  if (isbn10 === null) {
    return `${summary} Prefiks 979 nie ma odpowiednika ISBN-10.`
  }
  return summary
}

export function ibanPassMessage(formatted: string, nrb: string): string {
  return `Format i suma kontrolna poprawne: ${formatted}. NRB: ${nrb}.`
}
