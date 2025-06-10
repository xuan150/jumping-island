import { Press_Start_2P } from 'next/font/google'
import './globals.css'

const pressStart2P = Press_Start_2P({
  variable: '--font-press-start-2p',
  subsets: ['latin'],
  weight: '400',
})

export const metadata = {
  title: 'Jumping island',
  description: 'Built by xuan150',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${pressStart2P.variable}`}>{children}</body>
    </html>
  )
}
