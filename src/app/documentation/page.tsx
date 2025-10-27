'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { BookOpen, Calculator, FileText, HelpCircle, Search } from 'lucide-react';

export default function DocumentationPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  type ContentItem = {
    subtitle: string;
    text: string;
    steps?: string[];
    items?: string[];
  };

  type Tab = {
    name: string;
    icon: typeof BookOpen;
    content: ContentItem[];
  };

  const hasScraperAccess = user?.role === 'admin' || user?.role === 'manager';

  const tabs: Tab[] = [
    {
      name: 'Getting Started',
      icon: BookOpen,
      content: [
        {
          subtitle: 'Welcome',
          text: 'The Smart Cost Calculator helps you create accurate cost calculations for smart technology deals. From the dashboard, you can access the calculator, view your saved deals, and use other features.'
        },
        {
          subtitle: 'Quick Navigation',
          text: 'Use the dashboard cards to quickly access:',
          items: [
            '• Calculator - Create new deal calculations',
            '• My Deal Calculations - View and load your saved deals',
            hasScraperAccess ? '• Smart Scraper - Find business contact information' : '',
            '• Instructions - This help page'
          ].filter(Boolean)
        },
        {
          subtitle: 'First Time Using the App?',
          text: 'Start by exploring the Calculator tab to learn how to create a deal calculation step by step.'
        }
      ]
    },
    {
      name: 'Calculator',
      icon: Calculator,
      content: [
        {
          subtitle: 'Step 1: Deal Details',
          text: 'Enter basic information about your deal:',
          items: [
            '• Customer Name - Required field',
            '• Deal Name - Give your calculation a reference name',
            '• Contract Term - Select 36, 48, or 60 months',
            '• Escalation Rate - Choose 0%, 10%, or 15%',
            '• Distance - Travel distance for installation',
            '• Settlement Amount - Any existing contract settlement'
          ]
        },
        {
          subtitle: 'Step 2: Hardware',
          text: 'Select the devices and equipment needed:',
          items: [
            '• Browse available hardware items',
            '• Enter quantities for each item',
            '• Items marked "Extension" are counted separately',
            '• Total hardware cost updates automatically'
          ]
        },
        {
          subtitle: 'Step 3: Connectivity',
          text: 'Choose internet and connectivity services:',
          items: [
            '• Select connectivity packages (fiber, LTE, etc.)',
            '• Set quantities for each service',
            '• These are monthly recurring costs'
          ]
        },
        {
          subtitle: 'Step 4: Licensing',
          text: 'Add software licenses:',
          items: [
            '• Choose required licensing packages',
            '• Set quantities needed',
            '• These are monthly recurring costs'
          ]
        },
        {
          subtitle: 'Step 5: Settlement',
          text: 'Review automatically calculated costs:',
          items: [
            '• Installation costs based on number of points',
            '• Extension costs for extension items',
            '• Fuel costs based on distance',
            '• Finance fees',
            '• Settlement comparison'
          ]
        },
        {
          subtitle: 'Step 6: Total Costs',
          text: 'Review and export:',
          items: [
            '• See complete cost summary',
            '• Generate PDF proposal',
            '• Save deal for later',
            '• Load previously saved deals'
          ]
        }
      ]
    },
    ...(hasScraperAccess ? [{
      name: 'Smart Scraper',
      icon: Search,
      content: [
        {
          subtitle: 'What is Smart Scraper?',
          text: 'Smart Scraper finds business contact information from Google Maps. Search multiple towns and industries at once, then export results to Excel.'
        },
        {
          subtitle: 'How to Use',
          text: 'Follow these steps:',
          steps: [
            '1. Enter town names (one per line)',
            '2. Select industries from the list or add custom ones',
            '3. Adjust concurrency settings if needed',
            '4. Click "Start Scraping"',
            '5. Watch the progress bar',
            '6. Export results to Excel when complete'
          ]
        },
        {
          subtitle: 'Lookup Tools',
          text: 'Quick lookup options:',
          items: [
            '• Number Lookup - Find business by phone number',
            '• Business Lookup - Search by business name'
          ]
        },
        {
          subtitle: 'Managing Results',
          text: 'After scraping:',
          items: [
            '• View all results in the table',
            '• Export by provider (Vodacom, MTN, Cell C, Telkom)',
            '• Export all results to Excel',
            '• Save sessions to resume later',
            '• Clear data to start fresh'
          ]
        },
        {
          subtitle: 'Tips',
          text: 'Best practices:',
          items: [
            '• Test with 1-2 towns first',
            '• Select specific industries',
            '• Lower concurrency if you have issues',
            '• Save sessions for large jobs',
            '• Export results immediately'
          ]
        }
      ] as ContentItem[]
    }] : []),
    {
      name: 'Saving & Loading',
      icon: FileText,
      content: [
        {
          subtitle: 'Saving Your Work',
          text: 'Save deals to access them later:',
          steps: [
            '1. Complete your deal calculation',
            '2. Go to the Total Costs section',
            '3. Click "Save Deal"',
            '4. Your deal is saved to the database',
            '5. Access it from "My Deal Calculations"'
          ]
        },
        {
          subtitle: 'Loading Saved Deals',
          text: 'Retrieve previous calculations:',
          steps: [
            '1. Go to "My Deal Calculations"',
            '2. Browse your saved deals',
            '3. Click "Load" on any deal',
            '4. Calculator opens with data pre-filled',
            '5. Make changes and save again if needed'
          ]
        },
        {
          subtitle: 'Deal Management',
          text: 'Your saved deals include all calculation details, hardware selections, connectivity, licensing, and final costs. You can load any deal to review or create a similar calculation.'
        }
      ]
    },
    {
      name: 'Help & Tips',
      icon: HelpCircle,
      content: [
        {
          subtitle: 'Mobile Usage',
          text: 'The app works great on phones and tablets:',
          items: [
            '• Card layouts on small screens',
            '• Touch-friendly buttons',
            '• No horizontal scrolling',
            '• Use the menu (☰) to navigate'
          ]
        },
        {
          subtitle: 'Common Questions',
          text: 'How do I reset my password?',
          items: [
            '• Contact your system administrator'
          ]
        },
        {
          subtitle: '',
          text: 'Can I delete a saved deal?',
          items: [
            '• Contact your admin to remove deals'
          ]
        },
        {
          subtitle: '',
          text: 'What if I lose internet connection?',
          items: [
            '• Calculator stores work locally',
            '• You need internet to save/load deals'
          ]
        },
        {
          subtitle: 'Best Practices',
          text: 'Tips for success:',
          items: [
            '• Save your work frequently',
            '• Review calculations before sending to customers',
            '• Try features on test deals first',
            '• Check this help page if you\'re stuck'
          ]
        },
        {
          subtitle: 'Getting Support',
          text: 'If you need help, contact your system administrator.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2 sm:mb-3">
            Instructions
          </h1>
          <p className="text-gray-600 text-sm sm:text-base px-4">
            Learn how to use the Smart Cost Calculator
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="card-gradient mb-6">
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex min-w-max sm:min-w-0">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === index;
                return (
                  <button
                    key={index}
                    onClick={() => setActiveTab(index)}
                    className={`
                      flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm sm:text-base
                      transition-all duration-200 border-b-2 whitespace-nowrap
                      ${isActive
                        ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="space-y-6">
              {tabs[activeTab].content.map((item, itemIndex) => (
                <div key={itemIndex} className="space-y-3">
                  {item.subtitle && (
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      {item.subtitle}
                    </h3>
                  )}
                  {item.text && (
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      {item.text}
                    </p>
                  )}
                  {item.steps && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 border border-blue-100">
                      <ul className="space-y-2">
                        {item.steps.map((step, stepIndex) => (
                          <li key={stepIndex} className="text-sm sm:text-base text-gray-700 leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {item.items && (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 sm:p-4 border border-gray-200">
                      <ul className="space-y-2">
                        {item.items.filter(Boolean).map((listItem, listIndex) => (
                          <li key={listIndex} className="text-sm sm:text-base text-gray-700 leading-relaxed">
                            {listItem}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Support Footer */}
        <div className="card-gradient">
          <div className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
            <p className="text-sm sm:text-base text-gray-700">
              If you have questions or need assistance, contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 