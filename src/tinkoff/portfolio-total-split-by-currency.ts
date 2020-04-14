import { program } from 'commander'

import { run } from './utils/run'
import { Client } from './utils/client'
import { Currency } from '@tinkoff/invest-openapi-js-sdk'

interface IOptions {
  token: string
  account: string
}

program.requiredOption('-t, --token <value>', 'Tinkoff API token')
program.parse(process.argv)

const { token } = program.opts() as IOptions

const apiClient = new Client(token)

run(async () => {
  const [{ positions }, { currencies: cash }, marketMap] = await Promise.all([
    apiClient.portfolio(),
    apiClient.portfolioCurrencies(),
    apiClient.marketMap(),
  ])

  const totalByCurrency: { [Item in Currency]?: number } = {}

  cash.forEach(({ currency, balance }) => {
    if (!totalByCurrency[currency]) {
      totalByCurrency[currency] = 0
    }

    totalByCurrency[currency]! += balance
  })

  await Promise.all(
    positions.map(async ({ instrumentType, figi, ticker, balance }) => {
      let { currency } = marketMap[instrumentType][figi]

      if (instrumentType === 'Currency') {
        return
      }

      if (!currency) {
        console.warn(`Instrument ${ticker} does not have a currency`)
        return
      }

      if (!totalByCurrency[currency]) {
        totalByCurrency[currency] = 0
      }

      const instrumentPrice = await apiClient.currentPrice(figi)
      const instrumentTotal = balance * instrumentPrice

      totalByCurrency[currency]! += instrumentTotal
    }),
  )

  console.log(totalByCurrency)
})
