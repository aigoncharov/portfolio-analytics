import OpenAPI, { MarketInstrument, InstrumentType } from '@tinkoff/invest-openapi-js-sdk'

import { apiURL, socketURL } from './consts'

const oneDayInMs = 24 * 60 * 60 * 1000

type MarketMap = {
  [Key in InstrumentType]: {
    [figi: string]: MarketInstrument
  }
}

export class Client extends OpenAPI {
  constructor(secretToken: string) {
    super({
      apiURL,
      socketURL,
      secretToken,
    })
  }

  public async marketMap(): Promise<MarketMap> {
    const [
      { instruments: stocks },
      { instruments: bonds },
      { instruments: etfs },
      { instruments: currencies },
    ] = await Promise.all([this.stocks(), this.bonds(), this.etfs(), this.currencies()])

    const marketMap: MarketMap = {
      Stock: {},
      Bond: {},
      Etf: {},
      Currency: {},
    }
    stocks.forEach((stock) => {
      marketMap.Stock[stock.figi] = stock
    })
    bonds.forEach((bond) => {
      marketMap.Bond[bond.figi] = bond
    })
    etfs.forEach((etf) => {
      marketMap.Etf[etf.figi] = etf
    })
    currencies.forEach((currency) => {
      marketMap.Currency[currency.figi] = currency
    })

    return marketMap
  }

  public async currentPrice(figi: string) {
    const to = new Date().toISOString()
    const from = new Date(Date.now() - oneDayInMs).toISOString()

    const { candles } = await this.candlesGet({
      from,
      to,
      interval: 'hour',
      figi,
    })

    const lastCandle = candles.pop()

    if (!lastCandle) {
      throw new Error(`Instrument ${figi} is missing an hour candle from ${from} to ${to}`)
    }

    return lastCandle.c
  }
}
