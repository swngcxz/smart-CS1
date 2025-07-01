
import { Recycle, Leaf, DropletIcon, Lightbulb } from "lucide-react";

const TipsSection = () => {
  const tips = [
    {
      icon: Recycle,
      title: "Separate Your Waste",
      description: "Sort recyclables, organics, and general waste into separate bins to maximize recycling efficiency and reduce landfill impact."
    },
    {
      icon: Leaf,
      title: "Compost Organic Matter",
      description: "Turn kitchen scraps and yard waste into nutrient-rich compost. This reduces waste by 30% and creates valuable soil amendment."
    },
    {
      icon: DropletIcon,
      title: "Reduce Plastic Usage",
      description: "Choose reusable containers, water bottles, and shopping bags. Small changes in daily habits make a big environmental difference."
    },
    {
      icon: Lightbulb,
      title: "Smart Disposal Timing",
      description: "Use our app to schedule pickups only when bins are full, reducing unnecessary truck emissions and optimizing collection routes."
    }
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sustainable Waste Management Tips
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Simple practices that make a big difference for our environment and community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tips.map((tip, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-green-100"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <tip.icon size={24} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {tip.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {tip.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional CTA */}
        <div className="text-center mt-12">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Make a Difference?
            </h3>
            <p className="text-gray-600 mb-6">
              Join thousands of communities already using smart waste management 
              to create a cleaner, more sustainable future.
            </p>
            <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg">
              Get Started Today
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TipsSection;
