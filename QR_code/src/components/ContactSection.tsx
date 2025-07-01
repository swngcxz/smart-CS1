
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, ExternalLink } from "lucide-react";

const ContactSection = () => {
  const handleContactClick = () => {
    // This could open a contact form modal or navigate to a contact page
    window.location.href = "mailto:info@smartwaste.com";
  };

  const handleSocialShare = (platform: string) => {
    const url = window.location.href;
    const text = "Check out this Smart Waste Management System!";
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text} ${url}`
    };
    
    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-green-600 to-emerald-700 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Get Started?
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Contact us today to learn more about implementing Smart Waste Management in your community.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Button
            onClick={handleContactClick}
            variant="outline"
            size="lg"
            className="bg-white text-green-600 border-white hover:bg-green-50 py-4 text-lg font-medium rounded-full transition-all duration-300 hover:scale-105"
          >
            <Mail className="mr-2" size={20} />
            Contact Our Team
            <ExternalLink className="ml-2" size={16} />
          </Button>

          <Button
            onClick={() => handleSocialShare('whatsapp')}
            variant="outline"
            size="lg"
            className="bg-white text-green-600 border-white hover:bg-green-50 py-4 text-lg font-medium rounded-full transition-all duration-300 hover:scale-105"
          >
            <Phone className="mr-2" size={20} />
            Share via WhatsApp
            <ExternalLink className="ml-2" size={16} />
          </Button>
        </div>

        {/* Quick Contact Info */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-sm opacity-80">
          <div className="flex items-center gap-2">
            <Phone size={16} />
            <span>+1 (555) 123-4567</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={16} />
            <span>info@smartwaste.com</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>Available Nationwide</span>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="mt-8 pt-8 border-t border-green-500 border-opacity-30">
          <p className="mb-4 text-sm opacity-80">Share this page:</p>
          <div className="flex justify-center gap-4">
            {['facebook', 'twitter', 'linkedin', 'whatsapp'].map((platform) => (
              <button
                key={platform}
                onClick={() => handleSocialShare(platform)}
                className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all duration-300 hover:scale-110"
                aria-label={`Share on ${platform}`}
              >
                <ExternalLink size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;