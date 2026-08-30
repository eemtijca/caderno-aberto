import type { Metadata, Viewport } from "next"
import { Sora, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google"
import "katex/dist/katex.min.css"
import "@rod2ik/tikzjax/dist/fonts.min.css"
import "./globals.css"
import Script from "next/script"
import { headers } from "next/headers"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as ToasterSonner } from "@/components/ui/sonner"
import { Provedores } from "@/components/provedores"
import { ThemeProvider } from "next-themes"

export const dynamic = "force-dynamic"

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
})

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-corpo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const mono = JetBrains_Mono({
  variable: "--font-mono-latex",
  subsets: ["latin"],
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: {
    default: "Caderno Aberto",
    template: "%s · Caderno Aberto",
  },
  description:
    "Escreva notas de aula de qualquer disciplina e gere automaticamente a versão web responsiva, o PDF de impressão e os arquivos de impressão e de texto . E compartilhe com os alunos por links únicos e gerenciáveis.",
  applicationName: "Caderno Aberto",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1c1a" },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const nonce = (await headers()).get("x-nonce") ?? ""
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${sora.variable} ${jakarta.variable} ${mono.variable} bg-background text-foreground font-[family-name:var(--font-corpo)] antialiased`}
      >
        <Script id="tikzjax-config" strategy="beforeInteractive" nonce={nonce}>
          {`window.TikzJaxOptions={assetBaseUrl:"/vendor/tikzjax",workerMode:"direct",renderTimeout:30000,maxRetries:1,restartWorkerOnFail:true,workerPool:{enabled:true,maxWorkers:3},tex:{tikzLibraries:"arrows.meta,positioning,calc,decorations.markings"}}`}
        </Script>
        <Script src="/vendor/tikzjax/tikzjax.min.js" strategy="afterInteractive" nonce={nonce} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Provedores>
            {children}
            <Toaster />
            <ToasterSonner position="top-center" richColors />
          </Provedores>
        </ThemeProvider>
      </body>
    </html>
  )
}
