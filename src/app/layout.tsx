import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ariquo — The Operating System for Animal Life",
  description:
    "Ariquo gives every pet a lifelong digital identity, longitudinal health record, AI observation and triage, and a connected marketplace of veterinarians and caregivers. Working name — not a final brand.",
  keywords: [
    "Ariquo",
    "Pet OS",
    "Animal Operating System",
    "Pet Health",
    "AI Pet Care",
    "Veterinary",
    "Pet Identity",
  ],
  authors: [{ name: "Ariquo (working name)" }],
  openGraph: {
    title: "Ariquo — The Operating System for Animal Life",
    description:
      "Lifelong pet identity, longitudinal health record, AI observation/triage and a connected service marketplace.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ariquo — The Operating System for Animal Life",
    description:
      "Lifelong pet identity, longitudinal health record, AI observation/triage and a connected service marketplace.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
