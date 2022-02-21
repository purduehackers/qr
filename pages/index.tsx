import Nav from '../components/nav'

const Index = () => {
  return (
    <div className="min-h-screen overflow-hidden flex flex-col font-title dark:bg-gray-900">
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
