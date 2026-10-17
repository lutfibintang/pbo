import type { Metadata } from "next";
import "./globals.css";
import "./exam.css";

export const metadata: Metadata = {
  title: "JavaLab — UTS Praktikum PBO",
  description: "Ruang pengerjaan UTS PBO Java dengan 40 soal berurutan, editor kode, dan penilaian.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
