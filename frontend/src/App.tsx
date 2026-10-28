import { Routes, Route, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageTransition, SmoothScroll } from "@/components/Motion";
import { HomePage } from "@/pages/HomePage";
import { AboutPage, ContactPage, AdvertisePage, PrivacyPage, TermsPage } from "@/pages/InfoPages";
import { ArchivePage, CategoryPage, SearchPage } from "@/pages/ListingPages";
import { StoryPageWrapper } from "@/pages/StoryPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export function App() {
  const location = useLocation();

  return (
    <>
      <SmoothScroll />
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <PageTransition>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/advertise" element={<AdvertisePage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/news/:slug" element={<StoryPageWrapper />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </PageTransition>
      </main>
      <Footer />
    </>
  );
}
