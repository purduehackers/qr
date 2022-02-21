import { useTheme } from 'next-themes'
import ThemeButton from './theme-button'

const Nav = () => {
  const { resolvedTheme } = useTheme()

  return (
    <nav className="w-full bg-gray-100 dark:bg-gray-800">
      <div className="container px-4 sm:px-14 mx-auto flex">
        <div className="grow" />
        {resolvedTheme && <ThemeButton />}
      </div>
    </nav>
  )
}

export default Nav
