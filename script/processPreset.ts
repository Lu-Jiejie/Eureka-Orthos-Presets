/* eslint-disable no-console */
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { ORANGE_COLOR, PURPLE_COLOR, RED_COLOR } from './const'

const rawDir = path.join(process.cwd(), './raw')
const l10nDir = path.join(process.cwd(), './l10n')
const processedDir = path.join(process.cwd(), './processed')
const presetDir = path.join(process.cwd(), './preset')
const rawFiles = await fs.readdir(rawDir)
const mobsData = JSON.parse(await fs.readFile(path.join(process.cwd(), './data/mobDatabase.json'), 'utf-8'))

rawFiles.forEach(async (rawFile) => {
  if (!rawFile.includes('-'))
    return

  const fileBasename = path.basename(rawFile, path.extname(rawFile))
  const rawFilePath = path.join(rawDir, rawFile)
  const l10nFilePath = path.join(l10nDir, `${fileBasename}.json`)

  console.log(`Processing ${rawFile}...`)

  const content = JSON.parse(await fs.readFile(rawFilePath, 'utf-8'))
  const l10n = JSON.parse(await fs.readFile(l10nFilePath, 'utf-8'))

  // 翻译标题
  content.Name = `正统优雷卡 引战范围 ${fileBasename}`
  content.Group = '正统优雷卡'

  content.MaxDistance = 200

  // 处理elements
  const elements = content.ElementsL as { Name: string, [key: string]: string | number | boolean }[]
  for (let i = elements.length - 1; i >= 0; i--) {
    // 移除无用element
    if (elements[i].Name.includes('[AoE]')
      || elements[i].Name.includes('[BOSS]')
      || !elements[i].Name.includes('(')
      || elements[i].Name.includes('(Sight Range)')
      || elements[i].Name.includes('(dot)')
    ) {
      elements.splice(i, 1)
      continue
    }

    const oldName = elements[i].Name
    const mobName = oldName.split(' (')[0].trim()
    const l10nName = l10n[mobName]

    const mobInfo = mobsData[elements[i].refActorNPCNameID as number]
    let overlayTextPrefix = ''
    if (mobInfo.Patrol === 'True') {
      overlayTextPrefix = ''
      elements.push({
        Name: `${l10nName}(巡逻怪箭头)`,
        type: 3,
        offX: 9.0,
        radius: 0.0,
        color: RED_COLOR,
        Filled: false,
        fillIntensity: 0.3,
        thicc: 3.0,
        refActorNPCNameID: elements[i].refActorNPCNameID,
        refActorComparisonType: 6,
        includeRotation: true,
        LineEndB: 1,
        AdditionalRotation: 4.712389,
        refActorTetherTimeMin: 0.0,
        refActorTetherTimeMax: 0.0,
        FillStep: 15.0,
      })
    }
    else if (mobInfo.Patrol === 'True') {
      overlayTextPrefix = ''
    }

    // 危险等级
    switch (mobInfo.DangerLevel) {
      case 'Caution':
        elements[i].overlayTextColor = ORANGE_COLOR
        break
      case 'Danger':
        elements[i].overlayTextColor = RED_COLOR
        break
    }

    // 处理视线怪
    if (oldName.includes('(Sight)')) {
      elements[i].Name = `${l10nName}(视线)`
      elements[i].color = RED_COLOR
    }
    // 处理声音怪
    else if (oldName.includes('(Sound)')) {
      elements[i].Name = `${l10nName}(声音)`
      elements[i].color = PURPLE_COLOR
    }
    // 处理距离怪
    else if (oldName.includes('(Proximity)')) {
      elements[i].Name = `${l10nName}(距离)`
      elements[i].color = RED_COLOR
    }

    //
    elements[i].overlayVOffset = -0.5 // overlay偏移
    elements[i].thicc = 1
    elements[i].fillIntensity = 0.1
    elements[i].overlayText = `${overlayTextPrefix}${l10nName}`
    elements[i].refTargetYou = true
    elements[i].refActorTargetingYou = 1
  }
  const jsonString = JSON.stringify(content, null, 2)
  await fs.writeFile(path.join(processedDir, `${fileBasename}.json`), jsonString)
  const modifiedContent = jsonString.replace(/\n/g, '')
  const finalContent = `~Lv2~${modifiedContent}`
  await fs.writeFile(path.join(presetDir, `${fileBasename}.txt`), finalContent)
})
