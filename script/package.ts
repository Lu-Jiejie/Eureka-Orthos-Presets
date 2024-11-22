/* eslint-disable no-console */
import * as fs from 'node:fs'
import * as path from 'node:path'
import process from 'node:process'

const txtFolderPath = path.join(process.cwd(), './preset')
const readmeFilePath = path.join(process.cwd(), 'README.md')

const txtFiles = fs.readdirSync(txtFolderPath).filter(file => path.extname(file) === '.txt')

let combinedContent = ''
txtFiles.forEach((file) => {
  const filePath = path.join(txtFolderPath, file)
  const fileContent = fs.readFileSync(filePath, 'utf8')
  combinedContent += `${fileContent}\n`
})

const readmeContent = fs.readFileSync(readmeFilePath, 'utf8')

const insertMarker = '## 一键导入'

const markerIndex = readmeContent.indexOf(insertMarker)
if (markerIndex === -1) {
  console.error('插入标记未找到')
  process.exit(1)
}

const nextLineIndex = readmeContent.indexOf('\n', markerIndex)
if (nextLineIndex === -1) {
  console.error('插入标记后面的换行符未找到')
  process.exit(1)
}

const newReadmeContent = `${readmeContent.substring(0, nextLineIndex + 1)}\n\`\`\`\n${combinedContent}\`\`\`\n`

fs.writeFileSync(readmeFilePath, newReadmeContent, 'utf8')

console.log('操作完成，已更新 README.md 文件')
