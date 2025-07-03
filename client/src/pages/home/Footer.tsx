import { Recycle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="../public/logo-final2.png" alt="EcoBin Logo" className="w-8 h-8 align-middle" />
              <span className="text-2xl font-bold">Ecobin</span>
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
          <p>&copy; 2024 Ecobin. All rights reserved. Building a sustainable future together.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;