import { AwesomeQR } from 'awesome-qr'
import { useState } from 'react'

const Qr = ({ data, logo }: { data: string; logo: string }) => {
  const [url, setUrl] = useState('')

  new AwesomeQR({
    text: data,
    size: 1000,
    logoScale: 0.2,
    logoImage: logo,
    logoMargin: 18,
    logoCornerRadius: 1
  })
    .draw()
    .then((dataUrl) => setUrl(dataUrl?.toString('base64') || ''))
  return <img src={url} className="w-1/3"></img>
}

export default Qr
