'use client';

import { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-slate-700/50 mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200
                ${
                  activeTab === tab.id
                    ? 'border-pink-400 text-pink-400 bg-gradient-to-r from-pink-400/10 to-purple-400/10'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-slate-600'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>{activeTabContent}</div>
    </div>
  );
}

