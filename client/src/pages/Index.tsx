import Header from "./home/Header";
import HeroSection from "./home/HeroSection";
import BenefitsSection from "./home/BenefitsSection";
import FeaturesSection from "./home/FeatureSection";
import ContactSection from "./home/ContactSection";
import FeedbackSection from "./home/FeedbackSection";
import Footer from "./home/Footer";
const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <FeedbackSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
