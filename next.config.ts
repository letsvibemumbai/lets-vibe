import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/firestore",
    "@google-cloud/storage",
    "google-auth-library",
    "gaxios",
    "google-gax",
    "farmhash-modern",
    "nodemailer",
    "exceljs",
    "pdfkit",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
  async headers() {
    return [
      {
        // Let Firebase `signInWithPopup` reliably detect when the user closes
        // the Google popup (so the "Opening Google…" state resets) and silence
        // the COOP `window.closed` warning. This is the popup-friendly value —
        // do NOT use plain `same-origin`, which would break popup auth.
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
