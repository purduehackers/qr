import { AwesomeQR } from 'awesome-qr'
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const data = req.query.data
  const lightInput = String(req.query.lightColor)
  const lightColor = CSS.supports('color', lightInput) ? lightInput : 'black'
  const darkInput = String(req.query.darkColor)
  const darkColor = CSS.supports('color', darkInput) ? darkInput : 'white'

  CSS.supports('color', String(darkColor)) ? String(darkColor) : 'black'
  if (!data) {
    return res
      .status(400)
      .send('Bad request; format your request like /api/qr?data=your_data')
  }

  const logo = fs.readFileSync(
    path.resolve(process.cwd(), 'public', 'PurdueHackers.svg')
  )

  const buffer = await new AwesomeQR({
    text: `${data}`,
    colorDark: `${darkColor}`,
    colorLight: `${lightColor}`,
    size: 1000,
    logoImage: logo,
    autoColor: false,
    logoScale: 0.2,
    logoMargin: 18,
    logoCornerRadius: 1
  }).draw()

  // Alternative: ph_logo_margin.png, logoScale: 0.25, no logoMargin
  // Alternative: ph_logo_block.png, logoScale: 0.2, logoMargin: 18
  // Alternative: ph_logo_block.png, logoScale: 0.18, logoMargin: 24
  // Alternative: ph_logo.png, logoScale: 0.15, logoMargin: 40

  res.setHeader('Content-Type', 'image/png')
  res.send(buffer)
}
