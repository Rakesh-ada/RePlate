import { Leaf } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-forest rounded-full flex items-center justify-center">
                <Leaf className="text-white w-4 h-4" />
              </div>
              <span className="text-xl font-semibold">RePlate Campus</span>
            </div>
            <p className="text-gray-400">
              Reducing food waste and helping students save money on campus meals.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">For Students</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/student" className="hover:text-white transition-colors">
                  Browse Meals
                </Link>
              </li>
              <li>
                <Link href="/student" className="hover:text-white transition-colors">
                  My Claims
                </Link>
              </li>
              <li>
                <Link href="/student" className="hover:text-white transition-colors">
                  Savings Tracker
                </Link>
              </li>
              <li>
                <Link href="/student" className="hover:text-white transition-colors">
                  QR Codes
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">For Staff</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/staff" className="hover:text-white transition-colors">
                  Add Items
                </Link>
              </li>
              <li>
                <Link href="/staff" className="hover:text-white transition-colors">
                  Analytics
                </Link>
              </li>
              <li>
                <Link href="/staff" className="hover:text-white transition-colors">
                  Manage Canteen
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
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

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 RePlate Campus. All rights reserved. Built for sustainable campus dining.</p>
        </div>
      </div>
    </footer>
  );
}
