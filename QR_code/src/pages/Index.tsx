import Hero from "@/components/Hero";
import VideoSection from "@/components/VideoSection";
import TipsSection from "@/components/TipsSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import QRCodeSection from "@/components/QR_code/QRCodeSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <Hero />
      <VideoSection />
      <TipsSection />
      <WhatsAppButton />
      <QRCodeSection />
      <Footer />
    </div>
  );
};

export default Index;
