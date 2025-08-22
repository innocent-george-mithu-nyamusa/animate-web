"use client";
import React, { useState, useEffect } from "react";
import {
  Play,
  Download,
  Sparkles,
  Palette,
  Zap,
  Star,
  ArrowRight,
  Check,
  Menu,
  X,
} from "lucide-react";

const AnimateLandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeStyle, setActiveStyle] = useState(0);

  const styles = [
    { name: "Anime", color: "from-pink-500 to-purple-600", emoji: "🌸" },
    { name: "Studio Ghibli", color: "from-green-500 to-blue-500", emoji: "🏰" },
    { name: "Cartoon", color: "from-yellow-500 to-orange-500", emoji: "🎪" },
    { name: "Oil Painting", color: "from-red-500 to-pink-500", emoji: "🖼️" },
    { name: "Sketch", color: "from-gray-600 to-gray-800", emoji: "✏️" },
    { name: "Psychedelic", color: "from-purple-500 to-pink-500", emoji: "🌈" },
  ];

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      desc: "Transform images in under 30 seconds",
    },
    {
      icon: Palette,
      title: "6 Art Styles",
      desc: "From anime to oil painting effects",
    },
    {
      icon: Sparkles,
      title: "AI Powered",
      desc: "Advanced Flux AI technology",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStyle((prev) => (prev + 1) % styles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/prod-logo.png"
              alt="Animate Logo"
              className="w-10 h-10 rounded-xl object-contain"
            />
            <span className="text-2xl font-bold">Animate</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="hover:text-pink-300 transition-colors"
            >
              Features
            </a>
            <a href="#styles" className="hover:text-pink-300 transition-colors">
              Styles
            </a>
            <a
              href="#pricing"
              className="hover:text-pink-300 transition-colors"
            >
              Pricing
            </a>
            <button className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all transform hover:scale-105">
              Download Now
            </button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-purple-900/95 backdrop-blur-md p-6 md:hidden">
            <div className="flex flex-col space-y-4">
              <a
                href="#features"
                className="hover:text-pink-300 transition-colors"
              >
                Features
              </a>
              <a
                href="#styles"
                className="hover:text-pink-300 transition-colors"
              >
                Styles
              </a>
              <a
                href="#pricing"
                className="hover:text-pink-300 transition-colors"
              >
                Pricing
              </a>
              <button className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-2 rounded-full font-semibold">
                Download Now
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span>AI-Powered Image Transformation</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  Transform Your Photos into
                  <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                    {" "}
                    Art
                  </span>
                </h1>
                <p className="text-xl text-gray-300 max-w-lg">
                  Turn ordinary photos into stunning artwork with AI. Choose
                  from 6 amazing styles and watch the magic happen in seconds.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>Download Free</span>
                </button>
                <button className="border-2 border-white/20 px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all flex items-center justify-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Watch Demo</span>
                </button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full border-2 border-purple-900"
                      ></div>
                    ))}
                  </div>
                  <span>10k+ users</span>
                </div>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-400 fill-current"
                    />
                  ))}
                  <span className="ml-2">4.8 rating</span>
                </div>
              </div>
            </div>

            {/* Interactive Demo */}
            <div className="relative">
              <div className="relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">
                    Try Different Styles
                  </h3>
                  <p className="text-gray-300">See how your photos transform</p>
                </div>

                {/* Style Selector */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {styles.map((style, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveStyle(index)}
                      className={`p-3 rounded-xl transition-all transform hover:scale-105 ${
                        activeStyle === index
                          ? `bg-gradient-to-r ${style.color} shadow-lg`
                          : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      <div className="text-2xl mb-1">{style.emoji}</div>
                      <div className="text-xs font-medium">{style.name}</div>
                    </button>
                  ))}
                </div>

                {/* Mock Image Transformation */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-4 mb-4">
                  <div className="text-center text-gray-400 py-12">
                    <Palette className="w-12 h-12 mx-auto mb-4" />
                    <p>Upload your photo to see the magic</p>
                  </div>
                </div>

                <div className="text-center">
                  <div
                    className={`inline-flex items-center space-x-2 bg-gradient-to-r ${styles[activeStyle].color} px-4 py-2 rounded-full text-sm font-semibold`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{styles[activeStyle].name} Style Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-pink-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the future of photo editing with cutting-edge
              artificial intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-pink-500/50 transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Styles Showcase */}
      <section id="styles" className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              6 Amazing Art Styles
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              From anime to oil paintings, transform your photos into any
              artistic style
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {styles.map((style, index) => (
              <div key={index} className="group cursor-pointer">
                <div
                  className={`bg-gradient-to-r ${style.color} rounded-2xl p-8 text-center transform group-hover:scale-105 transition-all`}
                >
                  <div className="text-4xl mb-4">{style.emoji}</div>
                  <h3 className="text-2xl font-bold mb-2">{style.name}</h3>
                  <p className="text-white/80">
                    Perfect for creating stunning {style.name.toLowerCase()}{" "}
                    artwork
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-6 py-20 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-gray-300">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="text-4xl font-bold mb-4">$0</div>
                <p className="text-gray-300">Perfect for trying out Animate</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>5 transformations per day</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>3 art styles</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Standard resolution</span>
                </li>
              </ul>
              <button className="w-full border-2 border-white/20 py-3 rounded-full font-semibold hover:bg-white/10 transition-all">
                Download Free
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-r from-pink-500/10 to-purple-600/10 backdrop-blur-sm rounded-2xl p-8 border-2 border-pink-500/50 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-2 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <div className="text-4xl font-bold mb-4">
                  $9.99<span className="text-lg text-gray-300">/mo</span>
                </div>
                <p className="text-gray-300">Unlimited creative freedom</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Unlimited transformations</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>All 6 art styles</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>High-resolution exports</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>No watermarks</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Priority processing</span>
                </li>
              </ul>
              <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 py-3 rounded-full font-semibold hover:shadow-lg transition-all transform hover:scale-105">
                Start Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your Photos?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of users creating amazing art with AI. Download
            Animate today and start your creative journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Download on Google Play</span>
            </button>
            <button className="border-2 border-white/20 px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all flex items-center justify-center space-x-2">
              <span>View Gallery</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-black/40 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <span className="text-xl font-bold">Animate</span>
              </div>
              <p className="text-gray-300 text-sm">
                Transform your photos into stunning artwork with the power of
                AI.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Gallery
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Data Deletion
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Animate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AnimateLandingPage;
