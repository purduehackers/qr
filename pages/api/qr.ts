import { AwesomeQR } from 'awesome-qr'
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const data = req.query.data

  if (data === undefined) {
    return res.status(401).send('Bad query')
  }

  const logo = fs.readFileSync('static/ph_logo.png')

  const buffer = await new AwesomeQR({
    text: `${data}`,
    size: 500,
    logoImage: logo,
    logoScale: 0.3,
    logoCornerRadius: 2
  }).draw()

  res.setHeader('Content-Type', 'image/png')
  res.send(buffer)
}
