import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code, Star, Users, BookOpen, Zap, CheckCircle, Sparkles, Target, Rocket } from "lucide-react";

const Landing = () => {
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Smart Idea Enhancement",
      description: "Transform your raw app concept into detailed specifications that AI tools can execute perfectly."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Professional AI Prompts",
      description: "Get battle-tested prompts for Lovable and Cursor that create production-quality code."
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: "Complete AI Workflow",
      description: "Seamless integration from idea to deployed app using the latest AI development tools."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
            <Code className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
            Companai
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <a
            href="https://github.com/ByteBenderSA/companai"
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="ghost" className="text-gray-600 hover:text-purple-600 transition-colors">
              GitHub
            </Button>
          </a>
          <Link to="/login">
            <Button variant="ghost" className="text-gray-600 hover:text-purple-600 transition-colors">
              Login
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 shadow-lg">
              Start Building
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-5xl mx-auto">
          <Badge className="mb-8 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200 px-6 py-3 text-sm font-medium rounded-full">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Development Accelerator
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Turn Any App Idea Into 
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Working App in 24 Hours
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-4xl mx-auto">
            Skip months of learning. Get professional-quality prompts for Lovable and Cursor AI. 
            Transform your app ideas into deployed applications using cutting-edge AI development tools.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-lg px-12 py-6 h-auto rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                Build Your App Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-12 py-6 h-auto rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-purple-300 transition-all duration-300">
              See How It Works
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="font-medium">Idea to app in hours, not months</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span className="font-medium">No coding experience required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="font-medium">Professional-quality results</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            The Complete AI Development Workflow
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From raw idea to deployed app using professional AI development tools
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className={`p-8 transition-all duration-500 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 ${
              index === 0 ? 'bg-gradient-to-br from-purple-50 to-purple-100' :
              index === 1 ? 'bg-gradient-to-br from-blue-50 to-blue-100' :
              'bg-gradient-to-br from-green-50 to-green-100'
            }`}>
            <CardContent className="p-0 text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg ${
                  index === 0 ? 'bg-gradient-to-r from-purple-600 to-purple-700' :
                  index === 1 ? 'bg-gradient-to-r from-blue-600 to-blue-700' :
                  'bg-gradient-to-r from-green-600 to-green-700'
                } text-white`}>
                  {feature.icon}
              </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </CardContent>
          </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Your App in 4 Simple Steps
            </h2>
            <p className="text-xl text-gray-600">
              No coding required. No months of learning. Just results.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Describe Your App Idea</h3>
                  <p className="text-gray-600">Tell us your vision. Our AI enhances it into detailed specifications with features, design, and technical requirements.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Get Professional Prompts</h3>
                  <p className="text-gray-600">Receive battle-tested prompts for Lovable.dev that create professional frontend code and Cursor prompts for backend development.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Build with AI Tools</h3>
                  <p className="text-gray-600">Use our prompts in Lovable for frontend, sync to GitHub, then enhance with Cursor AI for backend features. We guide every step.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Deploy & Launch</h3>
                  <p className="text-gray-600">Your app is ready for the world. Deploy to production and start getting users with our deployment guidance.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Story */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-8 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 px-6 py-3 text-sm font-medium rounded-full">
              <Rocket className="w-4 h-4 mr-2" />
              Success Story
            </Badge>
            
            <Card className="p-12 border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=96&h=96&fit=crop&crop=face"
                    alt="Sarah Chen"
                    className="w-24 h-24 rounded-full object-cover border-4 border-purple-100 shadow-lg"
                  />
                  <div className="flex-1 text-center md:text-left">
                    <blockquote className="text-2xl font-medium mb-6 text-gray-800 leading-relaxed">
                      "I had an idea for a fitness tracking app but zero coding skills. Companai gave me the exact prompts I needed. My app was live in 3 days!"
                    </blockquote>
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div>
                        <p className="text-xl font-bold text-gray-900">Sarah Chen</p>
                        <p className="text-purple-600 font-medium">Built FitTrack Pro - 1,000+ Users</p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-gray-500 mb-1">Before</p>
                          <p className="font-medium text-gray-800">Just an idea</p>
                        </div>
                        <ArrowRight className="w-6 h-6 text-purple-600" />
                        <div className="text-center">
                          <p className="text-gray-500 mb-1">After</p>
                          <p className="font-medium text-green-600">Live app with users</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 rounded-3xl p-16 text-white shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Build Your App?
            </h2>
            <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
              Stop waiting. Stop learning. Start building. Transform your app idea into reality with professional AI development tools.
            </p>
            
            <Link to="/signup">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-12 py-6 h-auto font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                Start Building Today <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            
            <div className="flex flex-wrap items-center justify-center gap-8 mt-10 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>No coding required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>Professional results</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>24-hour turnaround</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <Code className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold">Companai</span>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md">
                Turn any app idea into working code in 24 hours. The AI development accelerator that actually works.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link to="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link to="/idea-workshop" className="text-gray-400 hover:text-white transition-colors">Idea Workshop</Link></li>
                <li><Link to="/lessons" className="text-gray-400 hover:text-white transition-colors">Lessons</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Open Source</h3>
              <ul className="space-y-2">
                <li><a href="https://github.com/ByteBenderSA/companai" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">GitHub</a></li>
                <li><a href="https://github.com/ByteBenderSA/companai/blob/main/CONTRIBUTING.md" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">Contributing</a></li>
                <li><a href="https://github.com/ByteBenderSA/companai/blob/main/LICENSE" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">License (AGPL-3.0)</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; CompanAI contributors. Released under the AGPL-3.0 license.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
