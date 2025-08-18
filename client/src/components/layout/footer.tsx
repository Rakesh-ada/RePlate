import { Leaf } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-gray-500 dark:text-gray-400">
          <p>&copy; 2024 RePlate Campus. All rights reserved. Built for sustainable campus dining.</p>
        </div>
      </div>
    </footer>
  );
}