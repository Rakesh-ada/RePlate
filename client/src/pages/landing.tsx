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
      <section className="bg-white dark:bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              How RePlate Works
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Simple steps to reduce food waste and save money on campus meals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-forest text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Browse Available Meals
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Discover discounted meals from campus canteens with real-time availability updates.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-forest text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Claim Your Meal
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Reserve your meal and receive a unique QR code with a 2-hour pickup window.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-forest text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Show & Collect
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Present your QR code at the canteen to collect your discounted meal.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
