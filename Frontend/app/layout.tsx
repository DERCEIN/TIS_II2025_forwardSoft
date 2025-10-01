import type React from "react"
import type { Metadata } from "next"
import { Montserrat, Open_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/contexts/AuthContext"
import { NotificationProvider } from "@/components/NotificationProvider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
})

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Olimpiada Oh! SanSi - Sistema de Gestión",
  description: "Sistema de gestión para la Olimpiada en Ciencias y Tecnología San Simón",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${openSans.variable} ${montserrat.variable} font-sans antialiased`}>
        <AuthProvider>
          <NotificationProvider>
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
