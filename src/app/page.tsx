'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';
import { Calculator, Settings, FileText, Users, ArrowRight, Clock, FolderOpen, Sparkles, TrendingUp, Search } from 'lucide-react';
import { AnimatedBackground, GlassCard, GradientText, StatCard } from '@/components/ui/modern';
import ActivityTimeline from '@/components/dashboard/ActivityTimeline';
import { getTotalDeals, getActiveProjects, getTotalCalculations } from '@/lib/dashboardStats';

export default function DashboardPage() {
  const { user, checkAuth } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalDeals: 0,
    activeProjects: 0,
    calculations: 0
  });

  useEffect(() => {
    if (!checkAuth()) {
      router.push('/login');
    }
  }, [checkAuth, router]);

  useEffect(() => {
    if (user) {
      const isAdmin = user.role === 'admin';
      setStats({
        totalDeals: getTotalDeals(user.id, isAdmin),
        activeProjects: getActiveProjects(user.id, isAdmin),
        calculations: getTotalCalculations(user.id, isAdmin)
      });
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const quickActions = [
    {
      title: 'Calculator',
      description: 'Start a new deal calculation',
      icon: Calculator,
      href: '/calculator',
      color: 'bg-blue-500',
      textColor: 'text-blue-500'
    },
    {
      title: 'Documentation',
      description: 'View user guides and help',
      icon: FileText,
      href: '/documentation',
      color: 'bg-green-500',
      textColor: 'text-green-500'
    },
    {
      title: user?.role === 'admin' ? 'All Deal Calculations' : 'My Deal Calculations',
      description: user?.role === 'admin' ? 'View all user deal calculations' : 'View and continue your saved calculations',
      icon: FolderOpen,
      href: user?.role === 'admin' ? '/admin/deals' : '/deals',
      color: 'bg-indigo-500',
      textColor: 'text-indigo-500'
    },
    ...(user.role === 'admin' || user.role === 'manager' ? [{
      title: 'Smart Scraper',
      description: 'Scrape business data from Google Maps',
      icon: Search,
      href: '/scraper',
      color: 'bg-teal-500',
      textColor: 'text-teal-500'
    }] : [])
  ];

  // Add admin-specific actions
  if (user.role === 'admin') {
    quickActions.push(
      {
        title: 'Admin Panel',
        description: 'Manage system configuration',
        icon: Settings,
        href: '/admin',
        color: 'bg-purple-500',
        textColor: 'text-purple-500'
      },
      {
        title: 'User Management',
        description: 'Manage users and roles',
        icon: Users,
        href: '/admin?tab=users',
        color: 'bg-orange-500',
        textColor: 'text-orange-500'
      }
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Welcome Section */}
      <div className="mb-8 animate-fade-in-up relative z-10">
        <div className="flex items-center space-x-3 mb-2">
          <h1 className="text-4xl font-bold">
            <GradientText animated gradient="rainbow">
              Welcome back, {user.name}!
            </GradientText>
          </h1>
          <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
        </div>
        <p className="text-gray-600 text-lg">
          Ready to calculate some deals? Here's what you can do today.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 relative z-10">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={index}
              href={action.href}
              className="block animate-fade-in-up"
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <GlassCard className="h-full p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${action.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                      {action.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className={`w-5 h-5 ${action.textColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300`} />
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
        <StatCard
          label="Total Deals"
          value={stats.totalDeals}
          icon={FileText}
          trend={0}
          animated
          className="animate-fade-in-up"
          style={{ animationDelay: '0.7s' } as React.CSSProperties}
        />
        <StatCard
          label="Active Projects"
          value={stats.activeProjects}
          icon={TrendingUp}
          trend={0}
          animated
          className="animate-fade-in-up"
          style={{ animationDelay: '0.8s' } as React.CSSProperties}
        />
        <StatCard
          label="Calculations"
          value={stats.calculations}
          icon={Calculator}
          trend={0}
          animated
          className="animate-fade-in-up"
          style={{ animationDelay: '0.9s' } as React.CSSProperties}
        />
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8 relative z-10 animate-fade-in-up" style={{ animationDelay: '1.0s' }}>
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-purple-500 animate-pulse" />
          <h2 className="text-2xl font-semibold">
            <GradientText>Recent Activity</GradientText>
          </h2>
        </div>
        
        <GlassCard className="p-6">
          <ActivityTimeline 
            userRole={user.role as 'admin' | 'manager' | 'user'} 
            currentUserId={user.id} 
          />
        </GlassCard>
      </div>
    </div>
  );
}
