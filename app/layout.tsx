import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ReachOut – Global Messaging Platform",
  description:
    "One Message. A World of Possibilities. Connect across borders through simple, reliable, consent-based messaging with real-time tracking.",
  keywords: [
    "global messaging",
    "international sms",
    "twilio gateway",
    "sms tracking",
    "phone validation",
    "consent based messaging",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

