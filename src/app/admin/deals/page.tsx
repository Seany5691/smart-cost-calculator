'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Calendar, User, DollarSign, ArrowRight, Users, FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Deal {
  id: string;
  userId: string;
  username: string;
  userRole: string;
  customerName: string;
  term: number;
  escalation: number;
  distanceToInstall: number;
  additionalGrossProfit: number;
  settlement: number;
  sections: Record<string, unknown>[];
  factors: Record<string, unknown>;
  scales: Record<string, unknown>;
  totals: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface UserDeals {
  userId: string;
  username: string;
  userRole: string;
  deals: Deal[];
}

export default function AdminDealsPage() {
  const [userDeals, setUserDeals] = useState<UserDeals[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const { user, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!checkAuth() || user?.role !== 'admin') {
      router.push('/login');
      return;
    }

    loadAllDeals();
  }, [user, checkAuth, router, loadAllDeals]);

  const loadAllDeals = async () => {
    try {
      const response = await fetch(`/api/deals?userId=${user?.id}&userRole=${user?.role}`);
      if (response.ok) {
        const deals: Deal[] = await response.json();
        
        // Group deals by user
        const groupedDeals = deals.reduce((acc: UserDeals[], deal) => {
          const existingUser = acc.find(u => u.userId === deal.userId);
          if (existingUser) {
            existingUser.deals.push(deal);
          } else {
            acc.push({
              userId: deal.userId,
              username: deal.username,
              userRole: deal.userRole,
              deals: [deal]
            });
          }
          return acc;
        }, []);
        
        setUserDeals(groupedDeals);
      }
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">All Deal Calculations</h1>
        <p className="text-gray-600">View all deal calculations across all users</p>
      </div>

      <div className="flex items-center space-x-2 mb-6">
        <Users className="w-5 h-5 text-gray-400" />
        <span className="text-sm text-gray-500">
          {userDeals.length} user{userDeals.length !== 1 ? 's' : ''} • 
          {userDeals.reduce((total, user) => total + user.deals.length, 0)} total deals
        </span>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading all deals...</p>
        </div>
      ) : userDeals.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
          <p className="text-gray-500">No users have calculated any deals yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {userDeals.map((userDeal) => (
            <div key={userDeal.userId} className="card">
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                onClick={() => toggleUserExpanded(userDeal.userId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{userDeal.username}</h3>
                      <p className="text-sm text-gray-500 capitalize">{userDeal.userRole}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{userDeal.deals.length}</p>
                      <p className="text-xs text-gray-500">deals</p>
                    </div>
                    <ChevronRight 
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                        expandedUsers.has(userDeal.userId) ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                </div>
              </div>

              {expandedUsers.has(userDeal.userId) && (
                <div className="border-t border-gray-200 p-4">
                  {userDeal.deals.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No deals for this user</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userDeal.deals.map((deal) => (
                        <div key={deal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">
                                {deal.customerName || 'Unnamed Deal'}
                              </h4>
                              <p className="text-xs text-gray-500">Deal #{deal.id.slice(-6)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(deal.totals?.totalPayout || 0)}
                              </p>
                              <p className="text-xs text-gray-500">Total</p>
                            </div>
                          </div>

                          <div className="space-y-1 mb-3">
                            <div className="flex items-center text-xs text-gray-600">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span>{deal.term} months</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <DollarSign className="w-3 h-3 mr-1" />
                              <span>{deal.escalation}% escalation</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600">
                              <User className="w-3 h-3 mr-1" />
                              <span>{deal.totals?.extensionCount || 0} extensions</span>
                            </div>
                          </div>

                          <div className="text-xs text-gray-500 mb-3">
                            {formatDate(deal.createdAt)}
                          </div>

                          <Link 
                            href={`/calculator?dealId=${deal.id}`}
                            className="btn btn-outline btn-sm w-full flex items-center justify-center space-x-1"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span>Continue</span>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 