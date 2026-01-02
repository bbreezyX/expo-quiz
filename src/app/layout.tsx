import type { Metadata } from "next";
import { Bungee, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const bungee = Bungee({
  variable: "--font-bungee",
  subsets: ["latin"],
  weight: "400",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Expo Quiz",
  description: "Live quiz untuk acara dan pameran",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${spaceGrotesk.variable} ${bungee.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Toaster
          position="top-right"
          richColors
          closeButton={false}
          toastOptions={{
            style: {
              borderRadius: '16px',
            },
          }}
        />
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-28 -left-24 size-[420px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,94,98,0.65),transparent_60%)] blur-3xl animate-float" />
            <div className="absolute top-16 -right-24 size-[360px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(47,128,237,0.55),transparent_60%)] blur-3xl animate-float-slow" />
            <div className="absolute -bottom-28 left-1/3 size-[320px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,201,76,0.6),transparent_60%)] blur-3xl animate-float-slower" />
            <div className="absolute bottom-10 left-8 h-28 w-44 rotate-6 rounded-[48px] bg-[linear-gradient(135deg,rgba(39,174,96,0.35),rgba(255,159,28,0.45))] blur-2xl" />
          </div>
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  );
}
