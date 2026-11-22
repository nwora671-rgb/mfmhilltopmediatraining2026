import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "MFM Hilltop Media Training 2026",
  description: "Free registration portal for MFM Hilltop Zonal Headquarters Media Training.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
