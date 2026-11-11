export interface OperatorDetails {
  name: string
  legalForm: string
  nip: string
  regon: string
  correspondenceAddress: string
  email: string
}

export const site = {
  name: 'DevNarzędzia',
  workingName: true,
  defaultSiteUrl: 'https://devnarzedzia.example',
  storagePrefix: 'devnarzedzia',
  operator: {
    name: 'Piotr Szewczyk',
    legalForm: 'jednoosobowa działalność gospodarcza',
    nip: '6222809805',
    regon: '368785970',
    correspondenceAddress: 'Bobrowiecka 10/2, 00-728 Warszawa',
    email: 'pszewczykpl@gmail.com',
  } satisfies OperatorDetails,
} as const
