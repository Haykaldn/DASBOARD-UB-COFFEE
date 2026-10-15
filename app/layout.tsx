import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: { default: "Panel Konten Admin", template: "%s · Panel Konten Admin" },
  description: "Dashboard admin UB Coffee & BREWi JAYA",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
