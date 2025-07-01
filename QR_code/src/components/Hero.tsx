
import { Button } from "@/components/ui/button";
import { ArrowRight, Recycle } from "lucide-react";

const Hero = () => {
  const scrollToVideo = () => {
    document.getElementById('video-section')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 text-green-600">
          <Recycle size={80} />
        </div>
        <div className="absolute top-32 right-16 w-16 h-16 text-green-400">
          <Recycle size={64} />
        </div>
        <div className="absolute bottom-32 left-20 w-12 h-12 text-green-500">
          <Recycle size={48} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
          <Recycle size={16} />
          Sustainable Future
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in">
          Welcome to
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
            Smart Waste Management
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in">
          Transform your community with intelligent waste management solutions. 
          Reduce environmental impact, optimize collection routes, and create 
          a cleaner, more sustainable future for everyone.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
          <Button 
            onClick={scrollToVideo}
            size="lg" 
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-medium rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Learn More
            <ArrowRight className="ml-2" size={20} />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-8 py-4 text-lg font-medium rounded-full transition-all duration-300"
          >
            Contact Us
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 pt-16 border-t border-green-200">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">85%</div>
            <div className="text-gray-600">Waste Reduction</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">50+</div>
            <div className="text-gray-600">Cities Served</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">24/7</div>
            <div className="text-gray-600">Smart Monitoring</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
