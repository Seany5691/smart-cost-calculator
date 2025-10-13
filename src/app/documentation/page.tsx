'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BookOpen, Calculator, Settings, Users, FileText, HelpCircle } from 'lucide-react';

export default function DocumentationPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

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

  type Section = {
    title: string;
    icon: typeof BookOpen;
    content: ContentItem[];
  };

  const sections: Section[] = [
    {
      title: 'Getting Started',
      icon: BookOpen,
      content: [
        {
          subtitle: 'How to Use the Calculator',
          text: 'The Smart Cost Calculator is a comprehensive tool for calculating deal costs from start to finish. Follow these steps to create a new deal calculation:',
          steps: [
            '1. Navigate to the Calculator page from the dashboard',
            '2. Fill in the Deal Details including customer name, term, and escalation',
            '3. Select hardware items and quantities',
            '4. Choose connectivity services',
            '5. Add licensing requirements',
            '6. Calculate settlement amounts if applicable',
            '7. Review the total costs summary',
            '8. Generate PDF reports or proposals'
          ]
        }
      ]
    },
    {
      title: 'Calculator Sections',
      icon: Calculator,
      content: [
        {
          subtitle: 'Deal Details',
          text: 'Enter basic information about the deal including customer name, contract term, escalation rate, distance to install, and additional gross profit.'
        },
        {
          subtitle: 'Hardware Selection',
          text: 'Select hardware items and quantities. Items marked as "Extension" are counted separately for extension point calculations. You can also add temporary custom items.'
        },
        {
          subtitle: 'Connectivity',
          text: 'Choose connectivity services and their monthly costs. These are recurring monthly charges that will be included in the total MRC calculation.'
        },
        {
          subtitle: 'Licensing',
          text: 'Select software licenses and their quantities. These are also recurring monthly costs included in the MRC calculation.'
        },
        {
          subtitle: 'Settlement Calculator',
          text: 'Calculate settlement amounts for existing rental contracts. Enter the start date, rental amount, escalation rate, and term to calculate the remaining settlement value.'
        },
        {
          subtitle: 'Total Costs',
          text: 'Review the complete cost breakdown including hardware costs, installation, gross profit, finance fees, and monthly recurring costs with VAT calculations.'
        }
      ]
    },
    {
      title: 'User Roles & Pricing',
      icon: Users,
      content: [
        {
          subtitle: 'Role-Based Pricing',
          text: 'The system supports three user roles with different pricing structures:',
          items: [
            'Admin: Full access to all features and admin pricing',
            'Manager: Access to manager pricing and most features',
            'User: Standard user pricing and basic features'
          ]
        },
        {
          subtitle: 'Pricing Differences',
          text: 'Manager and User roles may see different pricing for hardware, licensing, and connectivity items. This allows for flexible pricing strategies based on user permissions.'
        }
      ]
    },
    {
      title: 'Admin Features',
      icon: Settings,
      content: [
        {
          subtitle: 'Hardware Configuration',
          text: 'Admins can configure hardware items with different pricing for managers and users. Items can be marked as extensions and locked to prevent changes.'
        },
        {
          subtitle: 'Factor Sheet Management',
          text: 'Configure financing factors based on term, escalation, and finance amount ranges. These factors determine the monthly hardware rental calculations.'
        },
        {
          subtitle: 'Scales Configuration',
          text: 'Set up distance bands and additional costs including cost per extension point with different pricing for different user roles.'
        },
        {
          subtitle: 'User Management',
          text: 'Add, edit, and remove users. Assign roles and manage user permissions. The default admin user (Camryn) cannot be modified.'
        }
      ]
    },
    {
      title: 'Reports & Outputs',
      icon: FileText,
      content: [
        {
          subtitle: 'PDF Generation',
          text: 'Generate detailed PDF reports of the complete cost breakdown for presentation to customers or internal review.'
        },
        {
          subtitle: 'Proposal Generation',
          text: 'Create professional proposals with all deal details, costs, and terms formatted for customer presentation.'
        },
        {
          subtitle: 'Deal Pack Generation',
          text: 'Generate comprehensive deal packs including all documentation, pricing, and terms for complete deal documentation.'
        }
      ]
    },
    {
      title: 'Tips & Best Practices',
      icon: HelpCircle,
      content: [
        {
          subtitle: 'Accurate Calculations',
          text: 'Always double-check your inputs, especially dates and amounts. The settlement calculator is particularly sensitive to accurate start dates.'
        },
        {
          subtitle: 'Extension Points',
          text: 'Make sure to mark hardware items as extensions if they represent extension points. This affects the extension cost calculations.'
        },
        {
          subtitle: 'Settlement Calculations',
          text: 'When calculating settlements, ensure you use the correct rental type (starting vs current) and that all dates are accurate.'
        },
        {
          subtitle: 'Pricing Updates',
          text: 'Admins should regularly review and update pricing to ensure accuracy. Changes to factors and scales affect all future calculations.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Documentation & Help
          </h1>
          <p className="text-gray-600 text-lg">
            Complete guide to using the Smart Cost Calculator
          </p>
        </div>

        {/* Documentation Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className="card-gradient">
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {section.content.map((item, itemIndex) => (
                      <div key={itemIndex} className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.subtitle}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {item.text}
                        </p>
                        {item.steps && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <ul className="space-y-2">
                              {item.steps.map((step, stepIndex) => (
                                <li key={stepIndex} className="text-gray-700">
                                  {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {item.items && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <ul className="space-y-2">
                              {item.items.map((listItem, listIndex) => (
                                <li key={listIndex} className="text-gray-700">
                                  • {listItem}
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
            );
          })}
        </div>

        {/* Contact Information */}
        <div className="card-gradient mt-8">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900">Need More Help?</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Support Contact</h3>
                <p className="text-gray-700 mb-2">
                  If you need additional help or have questions about the calculator, please contact:
                </p>
                <div className="space-y-1 text-gray-700">
                  <p><strong>Email:</strong> support@smartcostcalculator.com</p>
                  <p><strong>Phone:</strong> +27 11 123 4567</p>
                  <p><strong>Hours:</strong> Monday - Friday, 8:00 AM - 5:00 PM SAST</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Tips</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Save your work frequently by navigating between sections</li>
                  <li>• Use the temporary item feature for custom requirements</li>
                  <li>• Review all calculations before generating final reports</li>
                  <li>• Check your user role to ensure correct pricing is applied</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 