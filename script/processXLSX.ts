import fs from 'node:fs/promises'
import process from 'node:process'
import path from 'node:path'
import xlsx from 'xlsx'

const databaseBuffer = await fs.readFile(path.join(process.cwd(), './data/mobDatabase.xlsx'))

// 读取为xlsx
const workbook = xlsx.read(databaseBuffer, { type: 'buffer' })
const worksheet = workbook.Sheets[workbook.SheetNames[0]]
const rawJSON = xlsx.utils.sheet_to_json(worksheet) as { [key: string]: string | number }[]

const processedJSON: { [key: number]: { [key: string]: string | number } } = {}

rawJSON.forEach((row) => {
  if (row.EO !== 'True')
    return

  processedJSON[row.Id as number] = row
  delete row.PotD
  delete row.HoH
  delete row.EO
})

await fs.writeFile(path.join(process.cwd(), './data/mobDatabase.json'), JSON.stringify(processedJSON, null, 2))
