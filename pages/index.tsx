import Head from 'next/head'
import Nav from '../components/nav'

const Index = () => {
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
      <div className="container px-5 sm:px-20 py-8">
        <p className="text-xl">
          This website is a WIP. For now, you can get a QR code by fetching{' '}
          <span>
            <code>`/api/qr?data=your_data`</code>
          </span>
          .
        </p>
      </div>
    </div>
  )
}

export default Index
