
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const navigate = useNavigate();



  const handleLearnMore = () => {
    // Scroll to features section
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section 
      ref={ref}
      className={`relative py-20 bg-gradient-to-br from-green-50 via-white to-green-50 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className={`mb-6 bg-green-100 text-green-800 hover:bg-green-200 transition-all duration-700 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}>
            🌱 Smart Waste Management Revolution
          </Badge>
          <h1 className={`text-5xl md:text-6xl font-bold text-gray-900 mb-6 transition-all duration-700 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            Transform Your City with
            <span className="text-green-600 block">Smart Waste Solutions</span>
          </h1>
          <p className={`text-xl text-gray-600 mb-8 max-w-2xl mx-auto transition-all duration-700 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            Revolutionize waste management with IoT sensors, AI-powered analytics, and sustainable practices. 
            Reduce costs, improve efficiency, and create cleaner communities.
          </p>
          <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-700 ${
            isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
          }`}>
            <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
              
            >
              Schedule Demo
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-green-600 text-green-600 hover:bg-green-50"
              onClick={handleLearnMore}
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-green-200 rounded-full opacity-20 animate-bounce"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-green-300 rounded-full opacity-30 animate-bounce delay-75"></div>
    </section>
  );
};

export default HeroSection;