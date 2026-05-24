
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Welcome to CompanAI
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your journey from idea to app starts here
        </p>
        <Link 
          to="/signup" 
          className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
};

export default Index;
