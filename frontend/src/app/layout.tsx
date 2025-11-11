import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lexsy - Legal partner on your hero's journey",
  description: "Welcome to Lexsy, a new-generation AI law firm for startups and their investors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
