import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuthState } from "@/hooks/useAuthState";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, Shield } from "lucide-react";
import opianLogo from "@assets/opian-rewards-logo-Recovered_1755772691086.png";

export default function Navbar() {
  const [location] = useLocation();
  const { isAuthenticated, user, logout } = useAuthState();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-sm border-b border-slate-200/60 shadow-sm' 
        : 'bg-transparent border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src={opianLogo} 
                alt="Opian Lifestyle" 
                className={`h-10 w-auto transition-all duration-300 ${
                  isScrolled ? 'filter-none' : 'brightness-0 invert'
                }`}
                data-testid="navbar-logo"
              />
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/dashboard" className={`hover:text-brand-600 transition-colors duration-200 font-medium ${
              isScrolled ? 'text-slate-600' : 'text-white/90'
            }`}>
              Plans & Pricing
            </Link>
            <a href="#features" className={`hover:text-brand-600 transition-colors duration-200 font-medium ${
              isScrolled ? 'text-slate-600' : 'text-white/90'
            }`}>
              Features
            </a>
            <a href="#about" className={`hover:text-brand-600 transition-colors duration-200 font-medium ${
              isScrolled ? 'text-slate-600' : 'text-white/90'
            }`}>
              About
            </a>
          </div>
          
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2" data-testid="user-menu-trigger">
                    <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="hidden md:block text-slate-700">{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center space-x-2" data-testid="nav-dashboard">
                      <User className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === 'ADMIN' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center space-x-2" data-testid="nav-admin">
                        <Shield className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center space-x-2 text-red-600" data-testid="button-logout">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="ghost" className={`hover:text-brand-600 transition-colors duration-200 font-medium ${
                    isScrolled ? 'text-slate-600' : 'text-white/90'
                  }`} data-testid="button-signin">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button className={`font-medium transition-all duration-200 ${
                    isScrolled 
                      ? 'btn-primary' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600'
                  }`} data-testid="button-getstarted">
                    Get Started Today
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
