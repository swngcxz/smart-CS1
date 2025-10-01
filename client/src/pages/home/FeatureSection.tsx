import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Trash, Recycle, Truck, Zap, BarChart3, Shield } from "lucide-react";

const FeaturesSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  const features = [
    {
      icon: <Trash className="h-8 w-8 text-green-600 dark:text-green-400" />,
      title: "Smart Bin Monitoring",
      description: "Real-time monitoring of waste levels with IoT sensors to optimize collection schedules.",
    },
    {
      icon: <Truck className="h-8 w-8 text-green-600 dark:text-green-400" />,
      title: "Route Optimization",
      description: "AI-powered route planning reduces fuel consumption and collection time by up to 40%.",
    },

    {
      icon: <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security and 99.9% uptime guarantee for continuous operations.",
    },
  ];

  return (
    <section id="features" ref={ref} className="py-20 bg-white dark:bg-slate-900 transition-colors duration-500">
      <div className="container mx-auto px-4">
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Features</Badge>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Cutting-Edge Technology for Modern Cities
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Our comprehensive smart waste management platform combines IoT, AI, and sustainability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`border-green-100 hover:border-green-300 dark:border-slate-700 dark:hover:border-green-500 bg-white dark:bg-slate-800 transition-all duration-700 hover:shadow-lg group ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100 + 300}ms` }}
            >
              <CardHeader>
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 dark:text-gray-300">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
