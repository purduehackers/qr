import { useState } from 'react'
import Head from 'next/head'
import { GetStaticProps } from 'next'
import Nav from '../components/nav'
import Qr from '../components/qr'

const Index = ({ logo }) => {
  const [url, setUrl] = useState('')
  return (
    <div className="min-h-screen overflow-hidden flex flex-col font-title dark:bg-gray-900">
      <Head>
        <meta property="og:site_name" content="Purdue Hackers" />
        <meta property="og:name" content="QR Codes — Purdue Hackers" />
        <meta property="og:title" content="QR Codes — Purdue Hackers" />
        <meta
          property="og:image"
          content="https://og.purduehackers.com/QR%20Codes.png?theme=light&md=1&fontSize=300px&caption="
        />
        <meta
          property="og:description"
          content="A website & API for generating custom, Purdue Hackers-branded QR Codes."
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="og:type" content="website" />
        <title>QR Codes — Purdue Hackers</title>
      </Head>
      <Nav />
      <div className="flex flex-col items-center justify-top mt-0 grow-0 w-full flex-1 px-5 pb-8 sm:pb-16 text-center sm:px-20 bg-gray-100 dark:bg-gray-800">
        <div className="mt-8 sm:mt-16">
          <h1 className="text-4xl sm:text-7xl lg:text-8-xl font-bold text-amber-450 dark:text-amber-500">
            Purdue Hackers QR Codes
          </h1>
        </div>
      </div>
      <div className="p-8">
        <p className="text-center text-xl">
          This website is a WIP. You can download this image, but you'll have to
          rename it after you download it. In the meantime, the API provides a
          better experience—try fetching{' '}
          <span>
            <code>/api/qr?data=your_data</code>
          </span>
          .
        </p>
      </div>
      <div className="container flex flex-col justify-center gap-x-4 md:flex-row px-5 sm:px-20 py-8 mt-8">
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            onChange={(e) => setUrl(e.target.value)}
            defaultValue="https://purduehackers.com"
          ></input>
        </form>
        <Qr data={url} logo={logo} />
      </div>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const fs = require('fs')
  const path = require('path')
  const mime = require('mime')

  const imgPath = path.resolve(process.cwd(), 'public', 'ph_logo_block.png')
  const logo = fs.readFileSync(imgPath, { encoding: 'base64' })
  const mimetype = mime.getType()

  const b64 = `data:${mimetype};base64,${logo}`

  return {
    props: {
      logo: b64
    }
  }
}

export default Index
