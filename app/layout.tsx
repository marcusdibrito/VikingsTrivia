import type { Metadata } from "next";
import "./globals.css";

const productionHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "norse-know-it-all.vercel.app";

export const metadata: Metadata = {
  title: "Norse Know-It-All — Daily Minnesota Football Trivia",
  description: "Five fresh Minnesota football questions every day. Same questions, one family champion.",
  metadataBase: new URL(`https://${productionHost}`),
  openGraph: {
    title: "Norse Know-It-All",
    description: "Five questions. One daily champion.",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
