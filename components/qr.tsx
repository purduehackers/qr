import { AwesomeQRCode } from '@awesomeqr/react'
import { AwesomeQR } from 'awesome-qr'
import { useState } from 'react'
import logo from '../public/ph_logo_block.png'

const Qr = ({ data }) => {
  const [url, setUrl] = useState('')

  new AwesomeQR({
    text: data,
    size: 1000,
    logoImage: logo.src.toString(),
    logoScale: 0.2,
    logoMargin: 18,
    logoCornerRadius: 1
  })
    .draw()
    .then((dataUrl) => setUrl(dataUrl.toString('base64')))
  return <img src={url} className="w-1/3"></img>
}

export default Qr
