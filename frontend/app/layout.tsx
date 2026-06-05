import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oxymis Vision",
  description: "Analyse d'environnement par IA pour la domotique et la sécurité",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased bg-zinc-950 text-zinc-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}