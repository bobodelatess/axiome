import type { Metadata, Viewport } from "next";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "AXIOME — Cockpit PSP",
  description:
    "Système de pilotage académique adaptatif pour la L2 Parcours Spécial Physique.",
  applicationName: "AXIOME",
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AXIOME",
  },
  icons: {
    icon: `${basePath}/axiome-icon.svg`,
    apple: `${basePath}/axiome-icon.svg`,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0d12",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
