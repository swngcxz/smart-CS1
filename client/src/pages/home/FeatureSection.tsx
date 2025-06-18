
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trash, 
  Recycle, 
  Truck, 
  Zap, 
  BarChart3, 
  Shield
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: <Trash className="h-8 w-8 text-green-600" />,
      title: "Smart Bin Monitoring",
      description: "Real-time monitoring of waste levels with IoT sensors to optimize collection schedules."
    },
    {
      icon: <Truck className="h-8 w-8 text-green-600" />,
      title: "Route Optimization",
      description: "AI-powered route planning reduces fuel consumption and collection time by up to 40%."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-green-600" />,
      title: "Analytics Dashboard",
      description: "Comprehensive insights and reporting to track waste patterns and operational efficiency."
    },
    {
      icon: <Recycle className="h-8 w-8 text-green-600" />,
      title: "Recycling Optimization",
      description: "Automated sorting recommendations and recycling rate improvement strategies."
    },
    {
      icon: <Zap className="h-8 w-8 text-green-600" />,
      title: "Energy Efficient",
      description: "Solar-powered sensors and energy-efficient operations reduce carbon footprint."
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security and 99.9% uptime guarantee for continuous operations."
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-green-100 text-green-800">Features</Badge>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Cutting-Edge Technology for Modern Cities
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our comprehensive smart waste management platform combines IoT, AI, and sustainability.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-green-100 hover:border-green-300 transition-all duration-300 hover:shadow-lg group">
              <CardHeader>
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
