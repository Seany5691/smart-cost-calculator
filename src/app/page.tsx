'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';
import { Calculator, Settings, FileText, Users, TrendingUp, DollarSign, Target, ArrowRight, Clock, FolderOpen } from 'lucide-react';

export default function DashboardPage() {
  const { user, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!checkAuth()) {
      router.push('/login');
    }
  }, [checkAuth, router]);

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
    }
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
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600">
          Ready to calculate some deals? Here's what you can do today.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={index}
              href={action.href}
              className="card hover:shadow-lg transition-all duration-200 group"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${action.color} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className={`w-5 h-5 ${action.textColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            </Link>
          );
        })}
      </div>



      {/* Recent Activity Section */}
      <div className="mt-8">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        
        <div className="card">
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No recent activity to display</p>
          </div>
        </div>
      </div>
    </div>
  );
}
