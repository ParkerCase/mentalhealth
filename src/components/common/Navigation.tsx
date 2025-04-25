'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  name: string
  path: string
}

export default function Navigation() {
  const pathname = usePathname()
  
  const navItems: NavItem[] = [
    { name: 'Home', path: '/' },
    { name: 'Locator', path: '/locator' },
    { name: 'Who We Are', path: '/who-we-are' },
    { name: 'Register Group/Leader', path: '/groups/register' },
    { name: 'Archive', path: '/archives' },
    { name: 'Contact', path: '/contact' },
  ]

  return (
    <nav className="mt-4">
      <ul className="flex flex-wrap space-x-1 md:space-x-4">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link 
              href={item.path}
              className={`px-3 py-2 rounded ${
                pathname === item.path
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}