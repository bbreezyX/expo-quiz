import type { Metadata } from "next";
import { DM_Sans, Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
        className={`${inter.variable} ${plusJakarta.variable} ${dmSans.variable} antialiased`}
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
            <div className="absolute -top-28 -left-24 size-[420px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,199,0,0.5),transparent_60%)] blur-3xl animate-float" />
            <div className="absolute top-16 -right-24 size-[360px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(17,17,17,0.12),transparent_60%)] blur-3xl animate-float-slow" />
            <div className="absolute -bottom-28 left-1/3 size-[320px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,199,0,0.35),transparent_60%)] blur-3xl animate-float-slower" />
            <div className="absolute bottom-10 left-8 h-28 w-44 rotate-6 rounded-[48px] bg-[linear-gradient(135deg,rgba(255,199,0,0.35),rgba(17,17,17,0.08))] blur-2xl" />
          </div>
          <div className="relative z-10">
            <Providers>{children}</Providers>
          </div>
        </div>
      </body>
    </html>
  );
}
