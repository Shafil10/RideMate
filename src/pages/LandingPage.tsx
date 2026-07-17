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
