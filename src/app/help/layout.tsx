import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cómo integrar ZoneMapper en tu web | Documentación",
  description:
    "Aprende a importar tus zonas en HTML o React. Guías con ejemplos interactivos en vivo para integrar ZoneMapper en cualquier proyecto web.",
  alternates: {
    canonical: "https://zonemapper.kaanmkt.com/help",
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
