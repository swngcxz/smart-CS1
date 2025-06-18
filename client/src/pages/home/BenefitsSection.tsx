
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  CheckCircle,
  Leaf,
  Globe,
  TrendingUp
} from "lucide-react";

const BenefitsSection = () => {
  const benefits = [
    { icon: <TrendingUp className="h-6 w-6" />, text: "40% reduction in operational costs" },
    { icon: <Leaf className="h-6 w-6" />, text: "60% decrease in carbon emissions" },
    { icon: <Globe className="h-6 w-6" />, text: "Improved community cleanliness" },
    { icon: <CheckCircle className="h-6 w-6" />, text: "99.9% system reliability" }
  ];

  return (
    <section id="benefits" className="py-20 bg-green-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-4 bg-green-100 text-green-800">Benefits</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Measurable Impact on Your Community
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join hundreds of cities worldwide that have transformed their waste management 
              operations with our smart solutions.
            </p>
            
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="text-green-600">{benefit.icon}</div>
                  </div>
                  <span className="text-gray-700 font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Real Results</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">40%</div>
                  <div className="text-sm text-gray-600">Cost Reduction</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">60%</div>
                  <div className="text-sm text-gray-600">Less Emissions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">500+</div>
                  <div className="text-sm text-gray-600">Cities Served</div>
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
