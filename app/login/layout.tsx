import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'نظام الإشعارات',
  description: 'نظام إدارة الإشعارات',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" >
      <body className={inter.className}>
      {children}
      <ToastProvider/>
      </body>
    </html>
  )
}

