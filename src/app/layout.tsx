'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import ChatbotWidget from '@/components/chatbot/ChatbotWidget'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  
  // Determine if current page should have special body class
  const isHomePage = pathname === '/'
  const isLocatorPage = pathname === '/locator'
  
  // Set favicon dynamically
  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
    if (!link) {
      const newLink = document.createElement('link')
      newLink.rel = 'icon'
      newLink.href = '/logo.PNG'
      newLink.type = 'image/png'
      document.getElementsByTagName('head')[0].appendChild(newLink)
    } else {
      link.href = '/logo.PNG'
      link.type = 'image/png'
    }
  }, [])

  // Add appropriate class to body element
  useEffect(() => {
    document.body.classList.remove('home-page', 'locator-page')
    
    if (isHomePage) {
      document.body.classList.add('home-page')
    } else if (isLocatorPage) {
      document.body.classList.add('locator-page')
    }
    
    // Force dark mode
    document.documentElement.classList.add('dark')
    document.body.style.backgroundColor = '#292929'
    document.body.style.color = '#FFFFFF'
    
    return () => {
      document.body.classList.remove('home-page', 'locator-page')
    }
  }, [isHomePage, isLocatorPage])
  
  return (
    <html lang="en">
      <head>
        <title>Arise Divine Masculine - Social Connection Platform</title>
        <meta name="description" content="Connect with groups and individuals in your community" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#292929" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.PNG" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.PNG" />
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
      </head>
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className={`flex-grow ${(isHomePage || isLocatorPage) ? 'pt-0' : 'pt-20'}`}>
            {children}
          </main>
          <Footer />
          <ChatbotWidget />
        </div>
      </body>
    </html>
  )
}