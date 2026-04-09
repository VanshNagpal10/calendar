import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calendar",
  description:
    "An interactive wall calendar with custom artwork, range selection, monthly notes, reminders, birthdays, year overview, and theme switching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
