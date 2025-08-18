import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Utensils, Users, Store, DollarSign } from "lucide-react";
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
      icon: Users,
      value: stats?.activeStudents || 0,
      label: "Active Students",
      period: "This week",
      bgColor: "bg-green-100 dark:bg-green-900",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      icon: Store,
      value: stats?.partnerCanteens || 0,
      label: "Partner Canteens",
      period: "Campus wide",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: DollarSign,
      value: `$${Math.round(stats?.totalSavings || 0).toLocaleString()}`,
      label: "Student Savings",
      period: "Total saved",
      bgColor: "bg-orange-100 dark:bg-orange-900",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
  ];

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
          {statItems.map((stat, index) => (
            <Card key={index} className="bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`${stat.iconColor} w-6 h-6`} />
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {stat.label}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.period}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
