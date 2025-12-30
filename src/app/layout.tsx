import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
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
        className={`${spaceGrotesk.variable} ${fraunces.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -left-24 size-[420px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,186,120,0.7),transparent_60%)] blur-3xl animate-float" />
            <div className="absolute top-24 -right-20 size-[360px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(120,214,255,0.7),transparent_60%)] blur-3xl animate-float-slow" />
            <div className="absolute -bottom-32 left-1/4 size-[320px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,236,180,0.8),transparent_60%)] blur-3xl animate-float-slower" />
          </div>
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  );
}
