export interface OperatorDetails {
  name: string
  legalForm: string
  nip: string
  regon: string
  correspondenceAddress: string
  email: string
}

export const site = {
  name: 'CurlySpare',
  workingName: false,
  defaultSiteUrl: 'https://devnarzedzia.example',
  storagePrefix: 'curlyspare',
  operator: {
    name: 'Piotr Szewczyk',
    legalForm: 'jednoosobowa działalność gospodarcza',
    nip: '6222809805',
    regon: '368785970',
    correspondenceAddress: '[ADRES]',
    email: '[E-MAIL KONTAKTOWY]',
  } satisfies OperatorDetails,
} as const
