import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ACTech Dashboard",
    template: "%s · ACTech",
  },
  description:
    "Gestão de clientes e ordens de serviço — assistência técnica ACTech",
  applicationName: "ACTech Dashboard",
  keywords: [
    "ACTech",
    "ordens de serviço",
    "assistência técnica",
    "computadores",
  ],
  authors: [{ name: "ACTech" }],
  creator: "ACTech",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "ACTech Dashboard",
    description:
      "Gestão de clientes e ordens de serviço — assistência técnica ACTech",
    locale: "pt_BR",
    type: "website",
  },
};

const themeBootScript = `
(function () {
  try {
    var t = localStorage.getItem('actech-theme');
    document.documentElement.dataset.theme = (t === 'light' || t === 'dark') ? t : 'dark';
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
