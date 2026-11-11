export function identifiersToCsv(header: string, values: readonly string[]): string {
  return [header, ...values.map(csvField)].join('\n')
}

export function identifiersToJson(values: readonly string[]): string {
  return JSON.stringify(values, null, 2)
}

function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

/** Starts a client-side file download. The blob stays in the browser. */
export function downloadText(filename: string, content: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
