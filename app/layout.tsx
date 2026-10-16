import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "De Vie — Tasks",
  description: "De Vie team tasks and to-dos.",
  manifest: "/manifest.webmanifest",
  applicationName: "De Vie",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "De Vie Tasks" },
  icons: {
    icon: [{ url: "/icon-512.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1115",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeScript = `(function(){try{if(localStorage.getItem("theme")==="dark")document.documentElement.setAttribute("data-theme","dark");}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
