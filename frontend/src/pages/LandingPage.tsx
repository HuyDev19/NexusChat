import { Header, HeroSection, FeaturesSection, CtaBanner, Footer } from "@/components/landing";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col font-sans">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <CtaBanner />
      <Footer />
    </div>
  );
};

export default LandingPage;
