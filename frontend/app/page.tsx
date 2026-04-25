/**
 * Landing page
 * -----------------------------------------------------------
 * Pure composition layer: assembles each independent block.
 * To re-order the page, change the component order here.
 */

import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { FileUploadBox } from "@/components/landing/FileUploadBox";
import { FeatureHighlights } from "@/components/landing/FeatureHighlights";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-landing-gradient">
      <Header />

      <div className="px-6 md:px-10">
        <div className="max-w-7xl mx-auto pt-20 md:pt-28 pb-16">
          <Hero />
          <FileUploadBox />
          <FeatureHighlights />
        </div>
      </div>

      <Footer />
    </main>
  );
}
