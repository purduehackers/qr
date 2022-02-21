import { AwesomeQR } from 'awesome-qr'
import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const data = req.query.data

  if (data === undefined) {
    return res
      .status(401)
      .send('Bad request; format your request like /api/qr?data=your_data')
  }

  const logo = fs.readFileSync(
    path.join(process.cwd(), 'static', 'ph_logo.png')
  )

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
