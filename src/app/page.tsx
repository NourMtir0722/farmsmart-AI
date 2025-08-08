'use client';

import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Scan,
  Ruler,
  Cpu,
  TrendingUp,
  Activity,
  Clock,
  ArrowRight,
  Leaf,
  BarChart3,
  Target,
  AlertCircle,
  Sun,
  Moon,
  Trees
} from 'lucide-react';

// Dashboard data structure
const stats = [
  {
    label: 'Plants Scanned',
    value: '1,247',
    change: '+12%',
    changeType: 'positive',
    icon: Scan,
    color: 'bg-green-500'
  },
  {
    label: 'Measurements',
    value: '856',
    change: '+8%',
    changeType: 'positive',
    icon: Ruler,
    color: 'bg-blue-500'
  },
  {
    label: 'AI Detections',
    value: '2,341',
    change: '+15%',
    changeType: 'positive',
    icon: Cpu,
    color: 'bg-purple-500'
  },
  {
    label: 'Accuracy Rate',
    value: '94.2%',
    change: '+2.1%',
    changeType: 'positive',
    icon: Target,
    color: 'bg-orange-500'
  }
];

const enablePaidAI = process.env.NEXT_PUBLIC_ENABLE_PAID_AI === 'true';

const quickActions = [
  {
    title: 'Plant Scanner',
    description: 'Identify plants and detect diseases',
    icon: Scan,
    href: '/plant-scanner',
    color: 'from-green-500 to-emerald-600'
  },
  {
    title: 'Plant Measure',
    description: 'Measure plant dimensions manually',
    icon: Ruler,
    href: '/plant-measure',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    title: 'Tree Measure',
    description: 'Estimate tree height with your phone (offline)',
    icon: Trees,
    href: '/tree-measure',
    color: 'from-emerald-600 to-teal-600'
  },
  {
    title: 'AI Measure',
    description: 'AI-powered automatic measurement',
    icon: Cpu,
    href: '/ai-measure',
    color: 'from-purple-500 to-violet-600'
  },
  {
    title: 'View Reports',
    description: 'Analytics and insights',
    icon: BarChart3,
    href: '/reports',
    color: 'from-orange-500 to-red-600'
  }
];

const recentActivity = [
  {
    id: 1,
    type: 'scan',
    title: 'New plant identified',
    description: 'Durian Tree detected with 98% confidence',
    timestamp: '2 minutes ago',
    status: 'success',
    icon: Leaf
  },
  {
    id: 2,
    type: 'measure',
    title: 'Plant measured',
    description: 'Palm tree: 6.5m height, 2.1m width',
    timestamp: '15 minutes ago',
    status: 'success',
    icon: Ruler
  },
  {
    id: 3,
    type: 'ai',
    title: 'AI detection completed',
    description: 'Found 3 reference objects for measurement',
    timestamp: '1 hour ago',
    status: 'success',
    icon: Cpu
  },
  {
    id: 4,
    type: 'alert',
    title: 'Disease detected',
    description: 'Leaf spot detected in mango tree',
    timestamp: '2 hours ago',
    status: 'warning',
    icon: AlertCircle
  }
];

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();

  console.log(`🏠 Dashboard: current theme is ${theme}`);

  const handleQuickAction = (href: string) => {
    router.push(href);
  };

  return (
    <Layout>
      <div className="space-y-8">
                            {/* Welcome Banner */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8 text-white">
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <h1 className="text-3xl font-bold">
                            Welcome back, Farm Manager! 🌱
                          </h1>
                          <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                            {theme === 'dark' ? (
                              <Moon className="h-5 w-5 text-yellow-300" />
                            ) : (
                              <Sun className="h-5 w-5 text-yellow-300" />
                            )}
                            <span className="text-sm font-medium">
                              {theme === 'dark' ? 'Dark' : 'Light'} Mode
                            </span>
                          </div>
                        </div>
                        <p className="text-green-100 text-lg">
                          Your intelligent farm management system is ready to help you optimize your operations.
                        </p>
                      </div>
                      <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent"></div>
                      <div className="absolute bottom-0 right-0 p-6">
                        <Leaf className="h-24 w-24 text-white/20" />
                      </div>
                    </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color} text-white`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className={`h-4 w-4 mr-1 ${
                  stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                }`} />
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">from last month</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions
            .filter((action) => {
              if (!enablePaidAI && (action.href === '/plant-scanner' || action.href === '/ai-measure')) {
                return false;
              }
              return true;
            })
            .map((action, index) => (
            <div
              key={index}
              onClick={() => handleQuickAction(action.href)}
              className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r ${action.color} text-white mb-4`}>
                <action.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {action.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {action.description}
              </p>
              <div className="flex items-center text-green-600 dark:text-green-400 font-medium text-sm group-hover:translate-x-1 transition-transform duration-200">
                Get started
                <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </div>
            ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Activity className="h-4 w-4 mr-2" />
              Live updates
            </div>
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  activity.status === 'success' 
                    ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
                }`}>
                  <activity.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activity.description}
                  </p>
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {activity.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}