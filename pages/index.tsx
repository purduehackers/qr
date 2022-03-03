import { useState } from 'react'
import Head from 'next/head'
import { GetStaticProps } from 'next'
import Nav from '../components/nav'
import Qr from '../components/qr'
import StyledLink from '../components/styled-link'
import FooterLinks from '../components/footer-links'

const Index = ({ logo }: { logo: string }) => {
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
      <div className="w-full flex flex-col md:flex-row items-center justify-center gap-x-12 w-11/12 md:w-2/3 mx-auto px-5 sm:px-20 py-8 mt-8 rounded-lg shadow-md dark:shadow-black/25 bg-gray-200 dark:bg-gray-700 p-4 flex flex-col justify-top gap-y-1 mb-8">
        <div className="flex flex-col w-full sm:w-auto">
          <h2 className="font-bold text-center text-2xl dark:text-white dark:font-extrabold">
            Edit QR code data here 👇
          </h2>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col xs:flex-row items-center gap-y-2 xs:gap-x-2 mb-1"
          >
            <textarea
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter some QR code data..."
              className="rounded border-none outline-none resize-none dark:bg-gray-900 dark:text-gray-100 my-4 p-2 w-full"
            ></textarea>
          </form>
        </div>
        <Qr data={url} logo={logo} />
      </div>
      <div className="p-8 container mx-auto p-8 px-4 md:px-16 lg:px-72 xl:px-96 flex justify-center flex-col gap-y-2 mx-auto">
        <h2 className="text-3xl sm:text-4xl lg:text-5-xl font-bold text-amber-450 dark:text-amber-500">
          What is this?
        </h2>
        <p className="text-xl">
          This is a website that generates Purdue Hackers-branded QR codes. It's
          meant for internal use, but it's a public website in case you want to
          make a QR code with our branding for some reason.
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5-xl font-bold text-amber-450 dark:text-amber-500 mt-6">
          API
        </h2>
        <p className="text-xl">
          This website also includes an API to programmatically generate QR
          codes. You can use it by fetching{' '}
          <span>
            <code>/api/qr?data=YOUR_DATA</code>
          </span>
          . Check out{' '}
          <StyledLink
            destination="https://ph-qr.vercel.app/api/qr?data=https%3A%2F%2Fpurduehackers.com"
            newTab
          >
            this example
          </StyledLink>
          !
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5-xl font-bold text-amber-450 dark:text-amber-500 mt-6">
          Make it your own!
        </h2>
        <p className="text-xl">
          If you like this website and want to make your own version, this
          project is open-source{' '}
          <StyledLink
            destination="https://github.com/MatthewStanciu/ph-qr"
            newTab
          >
            on our GitHub
          </StyledLink>
          . All you need to do is add your own logo to the{' '}
          <span>
            <code>public</code>
          </span>{' '}
          folder, then change{' '}
          <StyledLink
            destination="https://github.com/MatthewStanciu/ph-qr/blob/main/pages/index.tsx#L89"
            newTab
          >
            this line
          </StyledLink>{' '}
          and{' '}
          <StyledLink
            destination="https://github.com/MatthewStanciu/ph-qr/blob/main/pages/api/qr.ts#L16"
            newTab
          >
            this line
          </StyledLink>
          .
        </p>
      </div>
      <footer className="bg-gray-100 dark:bg-gray-800 text-center dark:text-gray-100 bottom-0 mt-auto w-full flex flex-col justify-center gap-y-4 py-8 px-4">
        <p>
          Made with 💛 by the{' '}
          <StyledLink destination="https://purduehackers.com" newTab>
            Purdue Hackers
          </StyledLink>{' '}
          organizing team.
        </p>
        <FooterLinks />
      </footer>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const fs = require('fs')
  const path = require('path')
  const mime = require('mime')

  const imgPath = path.resolve(process.cwd(), 'public', 'ph_logo_block.png')
  const logo = fs.readFileSync(imgPath, { encoding: 'base64' })
  const mimetype = mime.getType(imgPath)

  const b64 = `data:${mimetype};base64,${logo}`

  return {
    props: {
      logo: b64
    }
  }
}

export default Index
