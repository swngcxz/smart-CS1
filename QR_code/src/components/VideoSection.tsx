
import { Play } from "lucide-react";

const VideoSection = () => {
  return (
    <section id="video-section" className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            See How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover how our smart waste management system revolutionizes 
            waste collection and promotes environmental sustainability.
          </p>
        </div>

        {/* Video Container */}
        <div className="relative max-w-4xl mx-auto">
          <div className="relative aspect-video bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl overflow-hidden shadow-2xl">
            {/* Placeholder for embedded video */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mb-4 mx-auto hover:scale-110 transition-transform duration-300 cursor-pointer">
                  <Play size={32} className="text-white ml-1" />
                </div>
                <p className="text-green-700 font-medium">Click to play video</p>
              </div>
            </div>
            
            {/* You can replace this with an actual embedded video */}
            <iframe
              className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 transition-opacity duration-300"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="Smart Waste Management System"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          {/* Video Description */}
          <div className="mt-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Smart Technology for a Cleaner Tomorrow
            </h3>
            <p className="text-gray-600">
              Learn about our IoT sensors, route optimization, and real-time monitoring 
              that makes waste management 85% more efficient.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
