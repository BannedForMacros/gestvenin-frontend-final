import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner"; // 1. Importar Sonner
import { ConfirmProvider } from "@/providers/ConfirmProvider"; // 2. Importar el Provider
import { UIConfigProvider } from "@/providers/UIConfigProvider";
import { AuthProvider } from "@/providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GestVenin",
  description: "Sistema de gestión",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <AuthProvider>
            <UIConfigProvider>
              <ConfirmProvider>
                {children}
                <Toaster position="top-right" richColors closeButton />
              </ConfirmProvider>
            </UIConfigProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}