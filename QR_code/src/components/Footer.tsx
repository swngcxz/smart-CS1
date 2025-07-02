
import { Recycle, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white relative">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Recycle size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold">Smart Waste Management</h3>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Leading the way in sustainable waste management solutions. 
              Our smart technology helps communities reduce waste, optimize 
              collection routes, and build a cleaner future.
            </p>
            
            {/* Social Media */}
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors duration-300">
                <Facebook size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors duration-300">
                <Twitter size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors duration-300">
                <Instagram size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors duration-300">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-green-400 transition-colors duration-300">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-green-400 transition-colors duration-300">Our Services</a></li>
              <li><a href="#" className="text-gray-400 hover:text-green-400 transition-colors duration-300">Sustainability</a></li>
              <li><a href="#" className="text-gray-400 hover:text-green-400 transition-colors duration-300">Case Studies</a></li>
              <li><a href="#" className="text-gray-400 hover:text-green-400 transition-colors duration-300">Blog</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-green-400" />
                <span className="text-gray-400">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-green-400" />
                <span className="text-gray-400">info@smartwaste.com</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-green-400 mt-1" />
                <span className="text-gray-400">
                  123 Green Street<br />
                  Eco City, EC 12345
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2024 Smart Waste Management. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-green-400 transition-colors duration-300">Privacy Policy</a>
            <a href="#" className="hover:text-green-400 transition-colors duration-300">Terms of Service</a>
            <a href="#" className="hover:text-green-400 transition-colors duration-300">Cookie Policy</a>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-300"></div>
    </footer>
  );
};

export default Footer;
