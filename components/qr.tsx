import { AwesomeQR } from 'awesome-qr'
import { useState } from 'react'

const Qr = ({
  data,
  logo,
  lightColor,
  darkColor
}: {
  data: string
  logo: string
  lightColor: string
  darkColor: string
}) => {
  const [url, setUrl] = useState('')

  new AwesomeQR({
    text: data,
    colorLight: lightColor,
    colorDark: darkColor,
    size: 1000,
    autoColor: false,
    logoScale: 0.2,
    logoImage: logo,
    logoMargin: 18,
    logoCornerRadius: 1
  })
    .draw()
    .then((dataUrl) => setUrl(dataUrl?.toString('base64') || ''))
  return (
    <div className="flex flex-col">
      <img src={url} id="qrCode" className="w-80"></img>
      <button
        className="bg-amber-400 dark:bg-amber-500 rounded-md shadow-md dark:shadow-black/25 py-2 xs:px-2 font-bold hover:scale-105 transform transition
        disabled:opacity-50 disabled:hover:scale-100 dark:text-black mt-2"
        onClick={() => {
          const link = document.createElement('a')
          link.download = `ph-qr-code-${data
            .replace('http://', '')
            .replace('https://', '')
            .substring(0, 10)}.png`
          //@ts-ignore
          link.href = document.getElementById('qrCode').getAttribute('src')
          link.click()
        }}
      >
        Download
      </button>
    </div>
  )
}

export default Qr
