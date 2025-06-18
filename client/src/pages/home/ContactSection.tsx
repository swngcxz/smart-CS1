import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Mail, Phone, MapPin } from "lucide-react";

const ContactSection = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const { ref, isVisible } = useScrollAnimation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent!",
      description: "Thank you for your interest. We'll get back to you soon.",
    });
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <section
      id="contact"
      ref={ref}
      className="py-20 bg-gradient-to-br from-green-50 to-white dark:from-slate-900 dark:to-slate-900 transition-colors duration-500"
    >
      <div className="container mx-auto px-4">
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Contact Us</Badge>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Contact our team today to learn how EcoSmart can transform your waste management operations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div
            className={`transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Get in Touch</h3>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Email</div>
                  <div className="text-gray-600 dark:text-gray-300">contact@ecosmart.com</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                  <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Phone</div>
                  <div className="text-gray-600 dark:text-gray-300">+1 (555) 123-4567</div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Address</div>
                  <div className="text-gray-600 dark:text-gray-300">
                    123 Green Tech Ave
                    <br />
                    Sustainability City, SC 12345
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <Card
            className={`border-green-200 dark:border-slate-700 dark:bg-slate-800 transition-all duration-700 delay-500 ${
              isVisible ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-10 scale-95"
            }`}
          >
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">Send us a Message</CardTitle>
              <CardDescription className="dark:text-gray-300">
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
                    className="border-green-200 focus:border-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
                    required
                  />
                  <Input
                    name="email"
                    type="email"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="border-green-200 focus:border-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
                    required
                  />
                </div>
                <Textarea
                  name="message"
                  placeholder="Your Message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="min-h-32 border-green-200 focus:border-green-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
                  required
                />
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
