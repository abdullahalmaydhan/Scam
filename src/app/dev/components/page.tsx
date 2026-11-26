import type { Metadata } from "next";
import { Gallery } from "./Gallery";

export const metadata: Metadata = {
  title: "Components",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Gallery />;
}
