import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Hero from "../components/landing/Hero";
import Statistics from "../components/landing/Statistics";
import HowItWorks from "../components/landing/HowItWorks";
import RideTypes from "../components/landing/RideTypes";
import AISection from "../components/landing/AISection";
import Universities from "../components/landing/Universities";
import Sustainability from "../components/landing/Sustainability";
import Testimonials from "../components/landing/Testimonials";
import AppPreview from "../components/landing/AppPreview";
import Footer from "../components/landing/Footer";

export default function LandingPage() {
  return (
    <>
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border px-5 py-3">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-text">
          <ArrowLeft size={16} /> Back
        </Link>
      </div>
      <Hero />
      <Statistics />
      <HowItWorks />
      <RideTypes />
      <AISection />
      <Universities />
      <Sustainability />
      <Testimonials />
      <AppPreview />
      <Footer />
    </>
  );
}
