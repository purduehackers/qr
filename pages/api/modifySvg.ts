const fs = require('fs')
const path = require('path')

export default (req: any, res: any) => {
  const imgPath = path.resolve(process.cwd(), 'public', 'PurdueHackers.svg')
  const logoRead = fs.readFileSync(imgPath, { encoding: 'base64' })
  const modifiedSvgContent = logoRead.replace(/<path/g, '<path fill="red"')

  const modifiedSvgFilePath = 'modified-svg-file.svg'
  fs.writeFileSync(modifiedSvgFilePath, modifiedSvgContent, 'utf-8')
  res.status(200).json({ message: 'SVG file has been modified and saved.' })
}
