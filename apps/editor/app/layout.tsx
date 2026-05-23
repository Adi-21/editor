import type { Viewport } from 'next'
import { Agentation } from 'agentation'
import { GeistPixelSquare } from 'geist/font/pixel'
import { Barlow } from 'next/font/google'
import localFont from 'next/font/local'
import { ClientBootstrap } from './client-bootstrap'
import './globals.css'

// viewport-fit=cover enables env(safe-area-inset-*) on iPad/iPhone for the
// editor canvas. Page zoom is intentionally NOT locked globally (keeps
// content pages accessible / pinch-zoomable).
export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2433' },
  ],
}

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
})

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
  display: 'swap',
})

const THEME_BOOTSTRAP = `(()=>{try{var t=localStorage.getItem('pascal.theme');var v=t==='studio-dusk'||t==='studio-ocean'||t==='studio-warm'?t:'studio-warm';document.documentElement.setAttribute('data-theme',v);}catch(e){document.documentElement.setAttribute('data-theme','studio-warm');}})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable} ${GeistPixelSquare.variable} ${barlow.variable}`}
      data-theme="studio-warm"
      lang="en"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        {process.env.NODE_ENV === 'development' && (
          <script async crossOrigin="anonymous" src="//unpkg.com/react-scan/dist/auto.global.js" />
        )}
      </head>
      <body className="font-sans">
        <ClientBootstrap>{children}</ClientBootstrap>
        {process.env.NODE_ENV === 'development' && <Agentation />}
      </body>
    </html>
  )
}
