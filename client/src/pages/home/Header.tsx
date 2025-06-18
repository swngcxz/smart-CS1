import { Button } from "@/components/ui/button";
import { Recycle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Header = () => {
    const navigate = useNavigate();



  return (
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
            <div className="flex items-center space-x-4">
  <Button
    className="bg-white text-green-600 border border-green-600 hover:bg-green-50 px-5 py-2"
    onClick={() => navigate("/login")}
  >
    Login
  </Button>
  <Button
    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2"
   onClick={() => navigate("/register")}
  >
    Register
  </Button>
</div>

        </div>
      </div>
    </header>
  );
};

export default Header;
