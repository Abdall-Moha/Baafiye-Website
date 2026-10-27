import Hero from "../components/Home/Hero.jsx";
import BrowseSection from "../components/Home/BrowseSection.jsx";
import HowItWorks from "../components/Home/HowItWorks.jsx";
import Testimonials from "../components/Home/Testimonials.jsx";
import CTA from "../components/Home/CTA.jsx";

export default function Home() {
  return (
    <>
      <Hero />
      <BrowseSection />
      <HowItWorks />
      <Testimonials />
      <CTA />
    </>
  );
}
