import "./globals.css";
import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WoW Classic MoP Character Viewer",
  description: "MVP Character dashboard with BiS comparison",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Use relative path so it works under GitHub Pages basePath */}
        <link rel="icon" href="assets/icon.png" type="image/png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `const whTooltips = {colorLinks: true, iconizeLinks: true, renameLinks: true};`,
          }}
        />
        <script src="https://wow.zamimg.com/js/tooltips.js"></script>
      </head>
      <body className="min-h-full bg-gray-900 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
