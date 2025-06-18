
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Trash, 
  Recycle, 
  Truck, 
  Zap, 
  BarChart3, 
  Shield, 
  Mail, 
  Phone, 
  MapPin,
  Star,
  CheckCircle,
  Leaf,
  Globe,
  TrendingUp
} from "lucide-react";

const Index = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    feedback: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "Thank you for your interest. We'll get back to you soon.",
    });
    setFormData({ ...formData, name: "", email: "", message: "" });
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Feedback Submitted!",
      description: "Thank you for your valuable feedback.",
    });
    setFormData({ ...formData, feedback: "" });
  };

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

  const benefits = [
    { icon: <TrendingUp className="h-6 w-6" />, text: "40% reduction in operational costs" },
    { icon: <Leaf className="h-6 w-6" />, text: "60% decrease in carbon emissions" },
    { icon: <Globe className="h-6 w-6" />, text: "Improved community cleanliness" },
    { icon: <CheckCircle className="h-6 w-6" />, text: "99.9% system reliability" }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "City Manager",
      content: "EcoSmart has transformed our waste management operations. We've seen significant cost savings and improved efficiency.",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Environmental Director",
      content: "The real-time monitoring and analytics have helped us reduce waste overflow incidents by 80%.",
      rating: 5
    },
    {
      name: "Lisa Rodriguez",
      role: "Operations Manager",
      content: "Outstanding customer support and innovative technology. Highly recommend for any city looking to modernize.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-green-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Recycle className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">EcoSmart</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-700 hover:text-green-600 transition-colors">Features</a>
              <a href="#benefits" className="text-gray-700 hover:text-green-600 transition-colors">Benefits</a>
              <a href="#feedback" className="text-gray-700 hover:text-green-600 transition-colors">Feedback</a>
              <a href="#contact" className="text-gray-700 hover:text-green-600 transition-colors">Contact</a>
            </nav>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-green-100 text-green-800 hover:bg-green-200">
              🌱 Smart Waste Management Revolution
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
              Transform Your City with
              <span className="text-green-600 block">Smart Waste Solutions</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-fade-in">
              Revolutionize waste management with IoT sensors, AI-powered analytics, and sustainable practices. 
              Reduce costs, improve efficiency, and create cleaner communities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-bounce-in">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
                Schedule Demo
              </Button>
              <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                Learn More
              </Button>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-green-200 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-green-300 rounded-full opacity-30 animate-bounce delay-75"></div>
      </section>

      {/* Features Section */}
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

      {/* Benefits Section */}
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

      {/* Feedback Section */}
      <section id="feedback" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-800">Testimonials</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Clients Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hear from city leaders who have transformed their waste management operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-green-100 hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <CardDescription className="text-gray-700 italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feedback Form */}
          <div className="max-w-2xl mx-auto">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-gray-900">Share Your Feedback</CardTitle>
                <CardDescription className="text-center">
                  We value your opinion and would love to hear from you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <Textarea
                    name="feedback"
                    placeholder="Tell us about your experience or suggestions..."
                    value={formData.feedback}
                    onChange={handleInputChange}
                    className="min-h-32 border-green-200 focus:border-green-500"
                    required
                  />
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    Submit Feedback
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-green-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-800">Contact Us</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Contact our team today to learn how EcoSmart can transform your waste management operations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h3>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Email</div>
                    <div className="text-gray-600">contact@ecosmart.com</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Phone</div>
                    <div className="text-gray-600">+1 (555) 123-4567</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Address</div>
                    <div className="text-gray-600">123 Green Tech Ave<br />Sustainability City, SC 12345</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      name="name"
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="border-green-200 focus:border-green-500"
                      required
                    />
                    <Input
                      name="email"
                      type="email"
                      placeholder="Your Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="border-green-200 focus:border-green-500"
                      required
                    />
                  </div>
                  <Textarea
                    name="message"
                    placeholder="Your Message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="min-h-32 border-green-200 focus:border-green-500"
                    required
                  />
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Recycle className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">EcoSmart</span>
              </div>
              <p className="text-gray-400">
                Leading the future of smart waste management with innovative technology and sustainable solutions.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Solutions</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-green-400 transition-colors">Smart Bins</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Route Optimization</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Analytics</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Recycling</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-green-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-green-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">API</a></li>
                <li><a href="#" className="hover:text-green-400 transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 EcoSmart. All rights reserved. Building a sustainable future together.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
