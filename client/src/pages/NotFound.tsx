import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-green-100 to-green-120 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center bg-white shadow-lg rounded-xl p-10 max-w-md"
      >
        <h1 className="text-6xl font-extrabold text-green-600 mb-4">404</h1>
        <p className="text-xl text-gray-700 mb-6">Oops! Page not found.</p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition-colors duration-300"
        >
          Return to Home
        </a>
      </motion.div>
    </div>
  );
};

export default NotFound;
