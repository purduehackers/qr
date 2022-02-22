import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const logo = fs.readFileSync(
    path.resolve(process.cwd(), 'public', 'ph_logo_block.png')
  )
  res.send(logo)
}
