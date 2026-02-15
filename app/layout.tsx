import type React from "react"
import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { ConfiguracionProvider } from "@/hooks/use-configuracion"


const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

export const metadata: Metadata = {
  title: "Sistema de Gestión de Lotificaciones",
  description: "Sistema completo para administrar lotes disponibles, financiados, reservados y pagados",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${dmSans.variable} antialiased`}>
      <body className="font-sans">
        <AuthProvider>
          <ConfiguracionProvider>
            {children}
          </ConfiguracionProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
