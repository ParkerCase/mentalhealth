// src/app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import ChatbotWidget from '@/components/chatbot/ChatbotWidget'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Social Connection Platform',
  description: 'Connect with groups and individuals in your community',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Force dark mode by making the dark styles load first */}
        <meta name="color-scheme" content="dark" />
        {/* Preload the earth textures */}
        <link rel="preload" href="/earth-map.jpg" as="image" />
      </head>
      <body className={`${inter.className} bg-[#292929] text-white min-h-screen`}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <ChatbotWidget />
        </div>
      </body>
    </html>
  )
}