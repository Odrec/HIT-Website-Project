import { describe, it, expect } from 'vitest'
import { compareInfoMarkets } from '@/lib/info-markets'

const names = (list: string[]) =>
  list
    .map((name) => ({ name }))
    .sort(compareInfoMarkets)
    .map((m) => m.name)

describe('compareInfoMarkets', () => {
  it('puts the three known markets in the order Schloss, SL, Caprivi', () => {
    expect(names(['Infomarkt Caprivi', 'Infomarkt SL', 'Infomarkt Schloss'])).toEqual([
      'Infomarkt Schloss',
      'Infomarkt SL',
      'Infomarkt Caprivi',
    ])
  })

  it('appends unknown markets after them, in German alphabetical order', () => {
    expect(names(['Zelt', 'Infomarkt Caprivi', 'Ökohaus', 'Mensa'])).toEqual([
      'Infomarkt Caprivi',
      'Mensa',
      'Ökohaus',
      'Zelt',
    ])
  })
})
