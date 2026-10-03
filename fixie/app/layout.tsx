import type { Metadata, Viewport } from "next";
import { Corben, Figtree } from "next/font/google";
import "./globals.css";

// Corben is the fairy's storybook voice (names, headings); Figtree carries the
// plain instructions, where legibility in sunlight matters more than charm.
const corben = Corben({
  variable: "--font-corben",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fixie",
  description:
    "Point your camera at junk. A fairy tells you what it is, how to recycle it, and how to give it a second life.",
};

export const viewport: Viewport = {
  themeColor: "#183322",
  width: "device-width",
  initialScale: 1,
  // Lets the camera run edge to edge under the notch; safe-area insets
  // keep the controls clear of it.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${corben.variable} ${figtree.variable} h-full antialiased`}
    >
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
