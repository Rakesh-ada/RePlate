import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Utensils } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CampusStats {
  totalMealsSaved: number;
  activeStudents: number;
  partnerCanteens: number;
  totalSavings: number;
}

export function StatsSection() {
  const { data: stats, isLoading } = useQuery<CampusStats>({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <section className="bg-surface dark:bg-gray-800 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Campus Meal Stats
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              See how students are accessing campus meals through RePlate
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-white dark:bg-gray-900">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const statItems = [
    {
      icon: Utensils,
      value: stats?.totalMealsSaved || 0,
      label: "Meals Saved",
      period: "This month",
      bgColor: "bg-forest/10",
      iconColor: "text-forest",
    },
    {
      icon: Utensils,
      value: stats?.activeStudents || 0,
      label: "Active Students",
      period: "This week",
      bgColor: "bg-forest/10",
      iconColor: "text-forest",
    },
    {
      icon: Utensils,
      value: stats?.partnerCanteens || 0,
      label: "Partner Canteens",
      period: "Campus wide",
      bgColor: "bg-forest/10",
      iconColor: "text-forest",
    },
    {
      icon: Utensils,
      value: `${Math.round(stats?.totalSavings || 0).toLocaleString()}`,
      label: "Student Savings",
      period: "Total saved",
      bgColor: "bg-forest/10",
      iconColor: "text-forest",
    },
  ];

  return (
    <section className="relative bg-gradient-to-br from-forest/5 via-white to-forest/10 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 py-20 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-forest/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-forest/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-forest/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block">
            <span className="inline-block px-4 py-2 bg-forest/10 text-forest dark:bg-forest/20 dark:text-forest-light text-sm font-medium rounded-full mb-4">
              Live Impact Dashboard
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-forest to-gray-900 dark:from-white dark:via-forest-light dark:to-white bg-clip-text text-transparent mb-6">
            Campus Meal Stats
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Real-time insights into how students are reducing food waste and saving money through RePlate
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {statItems.map((stat, index) => (
            <Card key={index} className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-xl border border-gray-100/50 dark:border-gray-600/30 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
              {/* Animated gradient border */}
              <div className="absolute inset-0 bg-gradient-to-r from-forest/30 via-forest/10 to-forest/30 dark:from-forest/40 dark:via-forest/20 dark:to-forest/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <CardContent className="relative p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-16 h-16 ${stat.bgColor} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`${stat.iconColor} w-8 h-8`} />
                  </div>
                  <div className="text-right">
                    <span className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-forest dark:from-white dark:to-forest-light bg-clip-text text-transparent block">
                      {stat.value}
                    </span>
                    <div className="w-8 h-1 bg-gradient-to-r from-forest to-forest-dark ml-auto mt-2 rounded-full"></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-forest dark:group-hover:text-forest-light transition-colors duration-300">
                    {stat.label}
                  </h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {stat.period}
                  </p>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-forest/8 to-forest/3 dark:from-forest/15 dark:to-forest/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom decorative text */}
        <div className="text-center mt-16">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Updated in real-time • Powered by student participation
          </p>
        </div>
      </div>
    </section>
  );
}
