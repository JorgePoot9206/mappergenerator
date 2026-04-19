import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://zonemapper.kaanmkt.com"),
  title: {
    default: "ZoneMapper — Mapea cualquier imagen con IA",
    template: "%s | ZoneMapper",
  },
  description:
    "Sube una imagen de tu casa, oficina o estacionamiento y marca automáticamente cada zona con IA. Usa Anthropic o Gemini, o mapea manualmente. Gratis y sin registro.",
  keywords: [
    "zonas interactivas en imágenes",
    "mapear imagen con IA",
    "plano interactivo IA",
    "marcar zonas en foto",
    "generador de zonas interactivas",
    "floor plan mapper IA",
    "image zone detector",
    "mapeo automático de espacios",
  ],
  authors: [{ name: "ZoneMapper" }],
  creator: "ZoneMapper",
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://zonemapper.kaanmkt.com",
    siteName: "ZoneMapper",
    title: "ZoneMapper — Mapea cualquier imagen con IA",
    description:
      "Marca zonas en fotos de casas, oficinas o estacionamientos usando Anthropic o Gemini. También puedes hacerlo manualmente.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZoneMapper — Mapea cualquier imagen con IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZoneMapper — Mapea cualquier imagen con IA",
    description:
      "Marca zonas en fotos de casas, oficinas o estacionamientos usando IA.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: "https://zonemapper.kaanmkt.com",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "ZoneMapper",
              url: "https://zonemapper.kaanmkt.com",
              description:
                "Herramienta para mapear zonas interactivas en imágenes usando IA (Anthropic y Gemini) o de forma manual.",
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "Web",
              inLanguage: "es",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "MXN",
              },
              featureList: [
                "Detección automática de zonas con IA",
                "Compatible con Anthropic Claude y Google Gemini",
                "Mapeo manual de zonas",
                "Exportación en JSON, HTML y React",
                "Sin registro requerido",
              ],
            }),
          }}
        />

        {/* Top navigation bar */}
        <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
            <a href="/" className="flex items-center gap-2 font-bold text-lg text-white">
              <span className="text-indigo-400">◈</span>
              ZoneMapper
            </a>
            <div className="flex items-center gap-6 text-sm">
              <a href="/" className="text-slate-300 hover:text-white transition-colors">
                App
              </a>
              <a href="/help" className="text-slate-300 hover:text-white transition-colors">
                Docs
              </a>
              <div className="flex items-center gap-2">
                <a
                  href="https://anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-200 transition-colors text-xs"
                >
                  Claude ↗
                </a>
                <span className="text-slate-600 text-xs">+</span>
                <a
                  href="https://gemini.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-200 transition-colors text-xs"
                >
                  Gemini ↗
                </a>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
