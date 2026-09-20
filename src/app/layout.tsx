import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HDAP - Hybrid-Diagnostic Assessment Platform",
  description: "Website E-ASSESSMEN LITERASI DIGITAL berbasis IRT dan AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className="antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
