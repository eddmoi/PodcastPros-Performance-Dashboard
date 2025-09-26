import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/dashboard", label: "📊 Dashboard" },
  { path: "/champions", label: "🏆 Champions" },
  { path: "/under-achievers", label: "📈 Under Achievers" },
  { path: "/productive-hours", label: "⏰ Productive Hours" },
  { path: "/tracking", label: "📋 Tracking" },
  { path: "/data-upload", label: "📤 Data Upload" },
  { path: "/roster", label: "👥 Roster" },
  { path: "/login", label: "🔐 Admin Login" },
];

export default function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path || (path === "/dashboard" && location === "/");

  return (
    <nav className="gradient-header shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-8 min-w-0 flex-1">
            <Link href="/dashboard" data-testid="link-home">
              <div className="flex flex-col">
                <h1 className="text-sm font-bold text-white">PodcastPros</h1>
                <span className="text-white opacity-90 text-xs">Contractor Team Management</span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-2">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path} data-testid={`link-${item.label.toLowerCase().replace(' ', '-')}`}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg ${
                    isActive(item.path) 
                      ? "bg-white text-electric-blue shadow-md transform scale-105" 
                      : "text-white hover:bg-white hover:bg-opacity-20 hover:transform hover:scale-102"
                  }`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path} data-testid={`link-mobile-${item.label.toLowerCase().replace(' ', '-')}`}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className={`w-full justify-start px-5 py-2.5 text-base font-medium transition-all duration-300 rounded-lg ${
                      isActive(item.path) 
                        ? "bg-white text-electric-blue shadow-md" 
                        : "text-white hover:bg-white hover:bg-opacity-20"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
