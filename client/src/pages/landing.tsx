import { Button } from "@/components/ui/button";
import { StatsSection } from "@/components/stats-section";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface dark:bg-gray-900">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-white dark:bg-gray-900 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-forest/10 text-forest dark:bg-forest/20 dark:text-forest-light text-sm font-medium rounded-full">
              Student Food Claiming System
            </span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Claim Your <br />
            <span className="text-forest">Campus Meals</span>
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Access available campus meals through our digital claiming system. Show your 
            QR code to claim your reserved food items from participating canteens.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-forest hover:bg-forest-dark text-white px-8 py-3"
              onClick={async () => {
                // Seed demo data first
                await fetch('/api/seed-demo-data', { method: 'POST' });
                // Then login as student
                const response = await fetch('/api/demo-login/student');
                if (response.ok) {
                  window.location.reload();
                }
              }}
            >
              Student Demo Login
            </Button>
            <Button 
              variant="outline"
              className="border-gray-300 text-gray-700 hover:border-forest hover:text-forest dark:border-gray-600 dark:text-gray-300 dark:hover:border-forest dark:hover:text-forest px-8 py-3"
              onClick={async () => {
                // Seed demo data first
                await fetch('/api/seed-demo-data', { method: 'POST' });
                // Then login as staff
                const response = await fetch('/api/demo-login/staff');
                if (response.ok) {
                  window.location.reload();
                }
              }}
            >
              Staff Demo Login
            </Button>
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
                description: "Discover discounted meals from campus canteens with real-time availability updates and detailed nutritional information.",
                icon: "🍽️"
              },
              {
                number: "02", 
                title: "Claim Your Meal",
                description: "Reserve your meal instantly and receive a unique QR code with a secure 2-hour pickup window for maximum freshness.",
                icon: "📱"
              },
              {
                number: "03",
                title: "Show & Collect", 
                description: "Present your QR code at the canteen to collect your discounted meal and contribute to campus sustainability.",
                icon: "✨"
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
                      <div className="text-4xl opacity-70 group-hover:scale-110 transition-transform duration-300">
                        {step.icon}
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
