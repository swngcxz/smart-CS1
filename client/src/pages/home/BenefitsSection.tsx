import { Badge } from "@/components/ui/badge";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { BarChart3, CheckCircle, Leaf, Globe, TrendingUp } from "lucide-react";

const BenefitsSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  const benefits = [
    { icon: <TrendingUp className="h-6 w-6" />, text: "40% reduction in operational costs" },
    { icon: <Leaf className="h-6 w-6" />, text: "60% decrease in carbon emissions" },
    { icon: <Globe className="h-6 w-6" />, text: "Improved community cleanliness" },
    { icon: <CheckCircle className="h-6 w-6" />, text: "99.9% system reliability" },
  ];

  return (
    <section id="benefits" ref={ref} className="py-20 bg-green-50 dark:bg-slate-900 transition-colors duration-500">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Benefits</Badge>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Measurable Impact on Your Community
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Join hundreds of cities worldwide that have transformed their waste management operations with our smart
              solutions.
            </p>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-3 transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-5"
                  }`}
                  style={{ transitionDelay: `${index * 150 + 400}ms` }}
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                    <div className="text-green-600 dark:text-green-400">{benefit.icon}</div>
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`relative transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-10 scale-95"
            }`}
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Real Results</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">40%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Cost Reduction</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">60%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Less Emissions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">99.9%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">500+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Cities Served</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
