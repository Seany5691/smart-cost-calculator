'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { 
  Calculator, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Home,
  FileText,
  BookOpen,
  Search,
  Users
} from 'lucide-react';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const handleLogout = () => {
    logout();
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Calculator', href: '/calculator', icon: Calculator },
    { name: 'My Deals', href: '/my-deals', icon: FileText },
    ...(user?.role === 'admin' || user?.role === 'manager' ? [
      { name: 'Smart Scraper', href: '/scraper', icon: Search },
    ] : []),
    { name: 'Leads Manager', href: '/leads', icon: Users },
    { name: 'Instructions', href: '/documentation', icon: BookOpen },
    ...(user?.role === 'admin' ? [
      { name: 'Admin', href: '/admin', icon: Settings },
    ] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Smart Cost Calculator</span>
            </Link>
          </div>

          {/* Enhanced Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 relative group transform hover:scale-105 whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 shadow-lg border border-blue-200 scale-105'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-md'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${
                    active ? 'scale-110 text-blue-600' : 'group-hover:scale-110 group-hover:rotate-3'
                  }`} />
                  <span className="relative text-sm">
                    {item.name}
                    {active && (
                      <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>
                    )}
                  </span>
                  
                  {/* Enhanced Active Indicator */}
                  {active && (
                    <>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-600 rounded-full animate-pulse shadow-lg"></div>
                      <div className="absolute inset-0 bg-blue-200 opacity-20 rounded-lg animate-pulse"></div>
                    </>
                  )}
                  
                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Logout from application"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Navigation */}
      {isMobileMenuOpen && (
        <div 
          id="mobile-menu" 
          className="md:hidden bg-white border-t border-gray-200 shadow-lg animate-slide-down"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="px-4 py-2 space-y-1">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 relative transform hover:scale-102 ${
                    active
                      ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 shadow-md border border-blue-200 scale-102'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:shadow-sm'
                  }`}
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animation: 'slideInFromLeft 0.3s ease-out forwards'
                  }}
                >
                  <Icon className={`w-5 h-5 transition-all duration-200 ${
                    active ? 'scale-110 text-blue-600' : 'group-hover:scale-105'
                  }`} />
                  <span className="flex-1">{item.name}</span>
                  
                  {/* Enhanced Active Indicator */}
                  {active && (
                    <>
                      <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse shadow-lg"></div>
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"></div>
                    </>
                  )}
                  
                  {/* Ripple Effect on Tap */}
                  <div className="absolute inset-0 bg-blue-200 opacity-0 rounded-lg transition-opacity duration-150 active:opacity-30"></div>
                </Link>
              );
            })}
            
            {/* Enhanced Mobile User Info */}
            <div className="border-t border-gray-200 pt-4 mt-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 mx-1">
              <div className="flex items-center space-x-3 px-3 py-2 bg-white rounded-lg shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-gray-500 capitalize text-sm flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    {user?.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-3 py-2 w-full text-left text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 mt-2 transform hover:scale-102 focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Logout from application"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
                <span>Logout</span>
                <div className="ml-auto text-xs text-gray-400" aria-hidden="true">→</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 