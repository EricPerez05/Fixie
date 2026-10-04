import type { MetadataRoute } from "next";

// The manifest is plain JSON, so it can't read the CSS tokens. This is
// --moss-deep, the colour of the start screen, so launching from the home
// screen opens on the same green as the app.
const MOSS_DEEP = "#1f553b";

/**
 * Makes Fixie installable: "Add to Home Screen" gives it the jar-and-firefly
 * icon and opens it full screen. Icons are drawn from public/brand/app-icon*.svg.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Fixie",
    short_name: "Fixie",
    description:
      "Point your camera at junk. A fairy tells you what it is, how to recycle it, and how to give it a second life.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: MOSS_DEEP,
    theme_color: MOSS_DEEP,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Extra padding so Android's circle and squircle masks never clip the jar or firefly.
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
