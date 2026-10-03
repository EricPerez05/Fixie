import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { DeviceFrame } from "@/components/ui/device-frame";
import "./globals.css";

// Fraunces is the fairy's storybook voice (names, headings); DM Sans carries
// the plain instructions, where legibility in sunlight matters more than charm.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fixie",
  description:
    "Point your camera at junk. A fairy tells you what it is, how to recycle it, and how to give it a second life.",
};

export const viewport: Viewport = {
  themeColor: "#1f553b",
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
      className={`${fraunces.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="h-full font-sans">
        <DeviceFrame>{children}</DeviceFrame>
      </body>
    </html>
  );
}
