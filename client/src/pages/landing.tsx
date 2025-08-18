import { Button } from "@/components/ui/button";
import { StatsSection } from "@/components/stats-section";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Search, QrCode, CheckCircle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface dark:bg-gray-900">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] bg-gradient-to-br from-white via-forest/3 to-forest/8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 overflow-hidden flex items-center">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-20 left-20 w-64 h-64 bg-forest/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-32 w-96 h-96 bg-forest/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-forest/5 via-transparent to-forest/10 rounded-full blur-3xl"></div>
        </div>

        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-forest rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
          <div className="absolute top-3/4 left-1/4 w-2 h-2 bg-forest/60 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
          <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-forest/40 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="max-w-4xl mx-auto">
            {/* Badge */}
            <div className="mb-8 animate-fade-in">
              <span className="inline-flex items-center px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-forest dark:text-forest-light text-sm font-semibold rounded-full shadow-lg border border-forest/20 dark:border-forest-light/20">
                <span className="w-2 h-2 bg-forest rounded-full mr-3 animate-pulse"></span>
                Student Food Claiming System
                <span className="w-2 h-2 bg-forest rounded-full ml-3 animate-pulse"></span>
              </span>
            </div>
            
            {/* Main heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent leading-tight">
                Claim Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-forest via-forest-dark to-forest bg-clip-text text-transparent">
                Campus Meals
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              Transform campus dining with our innovative digital platform. 
              <span className="font-semibold text-forest dark:text-forest-light"> Reduce waste, save money, </span>
              and enjoy fresh meals with just a QR code.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <Button 
                className="group relative bg-gradient-to-r from-forest to-forest-dark hover:from-forest-dark hover:to-forest text-white px-10 py-4 text-lg font-semibold rounded-2xl shadow-2xl hover:shadow-forest/25 transition-all duration-300 hover:scale-105 border-0"
                onClick={async () => {
                  await fetch('/api/seed-demo-data', { method: 'POST' });
                  const response = await fetch('/api/demo-login/student');
                  if (response.ok) {
                    window.location.reload();
                  }
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center">
                  <span className="mr-2">🎓</span>
                  Student Demo Login
                  <span className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
              </Button>
              
              <Button 
                className="group relative bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border-2 border-forest/30 hover:border-forest text-forest dark:text-forest-light hover:bg-forest/5 dark:hover:bg-forest/10 px-10 py-4 text-lg font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                onClick={async () => {
                  await fetch('/api/seed-demo-data', { method: 'POST' });
                  const response = await fetch('/api/demo-login/staff');
                  if (response.ok) {
                    window.location.reload();
                  }
                }}
              >
                <span className="relative flex items-center">
                  <span className="mr-2">👨‍🍳</span>
                  Staff Demo Login
                  <span className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
              </Button>
            </div>

            {/* Feature highlights */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-gray-600 dark:text-gray-400 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-forest rounded-full"></div>
                <span className="text-sm font-medium">Real-time Availability</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-forest rounded-full"></div>
                <span className="text-sm font-medium">QR Code Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-forest rounded-full"></div>
                <span className="text-sm font-medium">Instant Notifications</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Features Section */}
      <section className="relative bg-gradient-to-br from-white via-forest/2 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-24 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-20 right-20 w-40 h-40 bg-forest/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-56 h-56 bg-forest/8 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block mb-6">
              <span className="inline-block px-4 py-2 bg-forest/10 text-forest dark:bg-forest/20 dark:text-forest-light text-sm font-medium rounded-full">
                Simple & Effective
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-forest to-gray-900 dark:from-white dark:via-forest-light dark:to-white bg-clip-text text-transparent mb-6">
              How RePlate Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Simple steps to reduce food waste and save money on campus meals through our innovative platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {[
              {
                number: "01",
                title: "Browse Available Meals",
                description: "Discover discounted meals from campus canteens with real-time availability updates and detailed nutritional information for smart dining choices.",
                icon: Search,
                bgColor: "bg-blue-100 dark:bg-blue-900/30",
                iconColor: "text-blue-600 dark:text-blue-400"
              },
              {
                number: "02", 
                title: "Claim Your Meal",
                description: "Reserve your meal instantly and receive a unique QR code with a secure 2-hour pickup window for maximum freshness and convenience.",
                icon: QrCode,
                bgColor: "bg-green-100 dark:bg-green-900/30",
                iconColor: "text-green-600 dark:text-green-400"
              },
              {
                number: "03",
                title: "Show & Collect", 
                description: "Present your QR code at the canteen to collect your discounted meal and contribute to campus sustainability and waste reduction.",
                icon: CheckCircle,
                bgColor: "bg-purple-100 dark:bg-purple-900/30",
                iconColor: "text-purple-600 dark:text-purple-400"
              }
            ].map((step, index) => (
              <div key={index} className="group relative">
                {/* Connection line for desktop */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-20 left-full w-16 lg:w-24 h-0.5 bg-gradient-to-r from-forest/30 to-forest/10 transform translate-x-4 lg:translate-x-8"></div>
                )}
                
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 lg:p-10 shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group">
                  {/* Hover gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-forest/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                  
                  <div className="relative z-10">
                    {/* Number badge */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-forest to-forest-dark rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white text-2xl font-bold">{step.number}</span>
                      </div>
                      <div className={`w-16 h-16 ${step.bgColor} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <step.icon className={`${step.iconColor} w-8 h-8`} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-forest dark:group-hover:text-forest-light transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                        {step.description}
                      </p>
                    </div>

                    {/* Bottom accent line */}
                    <div className="mt-8 w-0 group-hover:w-full h-1 bg-gradient-to-r from-forest to-forest-dark rounded-full transition-all duration-500"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA section */}
          <div className="text-center mt-20">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
              <div className="w-2 h-2 bg-forest rounded-full animate-pulse"></div>
              <span>Ready to start saving meals and money?</span>
              <div className="w-2 h-2 bg-forest rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
