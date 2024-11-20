/* eslint-disable no-console */
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import ky from 'ky'

async function fetchCNName(query: string) {
  const FFXIV_CSV_API = 'https://strings.wakingsands.com/xivcsv/_search'
  const should = query.trim().split(/\s+/).map(word => ({
    function_score: {
      query: {
        multi_match: {
          query: word,
          fields: ['cn^3', 'en^2', 'ja^1'],
          fuzziness: 'AUTO',
        },
      },
      boost: 8,
      boost_mode: 'multiply',
    },
  }))

  const csv = await ky.post(FFXIV_CSV_API, {
    json: {
      query: {
        bool: {
          should,
        },
      },
    },
  }).json() as any

  return (csv.hits.hits[0]._source.cn as string).trim().split(/\s+/)[0]
}

const rawDir = path.join(process.cwd(), './raw')
const l10nDir = path.join(process.cwd(), './l10n')
const rawFiles = await fs.readdir(rawDir)

rawFiles.forEach(async (file) => {
  // if (file !== '1-10.json')
  //   return
  const fileBasename = path.basename(file, path.extname(file))
  const filePath = path.join(rawDir, file)

  console.log(`Generating l10n from ${file}...`)

  const content = JSON.parse(await fs.readFile(filePath, 'utf-8'))
  const elements = content.ElementsL as { Name: string, [key: string]: string }[]
  const elementsNames = Array.from(new Set(
    elements.map(element => element.Name)
      .filter(name => !name.includes('[AoE]') && !name.includes('[BOSS]') && name.includes('('))
      .map(name => name.split(' (')[0]),
  ))

  const l10n: Record<string, string> = {}
  for (const name of elementsNames)
    l10n[name] = await fetchCNName(name)

  await fs.writeFile(path.join(l10nDir, `${fileBasename}.json`), JSON.stringify(l10n, null, 2))
})
