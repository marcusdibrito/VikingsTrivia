import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Norse Know-It-All — Daily Minnesota Football Trivia",
  description: "Five fresh Minnesota football questions every day. Same questions, one family champion.",
  metadataBase: new URL("https://norse-know-it-all.sites.openai.com"),
  openGraph: {
    title: "Norse Know-It-All",
    description: "Five questions. One daily champion.",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geist.variable} ${mono.variable}`}>{children}</body></html>;
}
