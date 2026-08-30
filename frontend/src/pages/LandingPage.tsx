import { useState, useCallback } from "react";
import { Header } from "@/components/landing/Header";
import { LoaderOverlay } from "@/components/landing/LoaderOverlay";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { AppUISection } from "@/components/landing/AppUISection";
import { StatsSection } from "@/components/landing/StatsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { Footer } from "@/components/landing/Footer";
import { ContactModal } from "@/components/landing/ContactModal";
import { MenuOverlay } from "@/components/landing/MenuOverlay";

const LandingPage = () => {
  const [loaderDone, setLoaderDone] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLoaderDone = useCallback(() => setLoaderDone(true), []);
  const openContact = useCallback(() => { setContactOpen(true); setMenuOpen(false); }, []);
  const closeContact = useCallback(() => setContactOpen(false), []);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <div
      className="min-h-screen bg-white dark:bg-background text-foreground font-sans"
      style={{ scrollBehavior: "smooth" }}
    >
      {/* Loader curtain — always mounts, removes itself after exit */}
      <LoaderOverlay onDone={handleLoaderDone} />

      {/* Portaled overlays */}
      <ContactModal open={contactOpen} onClose={closeContact} />
      <MenuOverlay open={menuOpen} onClose={closeMenu} onOpenContact={openContact} />

      {/* Sticky header — overlays hero */}
      <Header onOpenContact={openContact} onOpenMenu={openMenu} />

      {/* Page body — p-2 sm:p-3 inset against white bg */}
      <main className="px-2 sm:px-3 pb-2 sm:pb-3 overflow-x-clip -mt-16">
        {/* Hero: full-viewport, rounded card */}
        <HeroSection loaderDone={loaderDone} onOpenContact={openContact} />

        {/* Trust section — mt-3 gap */}
        <div className="mt-3">
          <TrustSection />
        </div>

        {/* Features — off-white surface bg */}
        <FeaturesSection />

        {/* App UI — overlaps features with -mt-10 */}
        <AppUISection />

        {/* Stats — navy band, mt-3 */}
        <StatsSection />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Footer — navy, mt-3 */}
        <Footer onOpenContact={openContact} />
      </main>
    </div>
  );
};

export default LandingPage;
