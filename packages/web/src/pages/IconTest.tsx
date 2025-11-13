import React from 'react';

import { Icon, Icons } from '@web/components/Icon';

export const IconTest: React.FC = () => {
  // Get all icon names from enum
  const iconNames = Object.values(Icons);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Icon System Test</h1>

        {/* Size variations */}
        <section className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Size Variations</h2>
          {iconNames.length > 0 && (
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <Icon name={iconNames[0]} styleProps={{ size: 'xs' }} />
                <span className="text-xs mt-1">xs</span>
              </div>
              <div className="flex flex-col items-center">
                <Icon name={iconNames[0]} styleProps={{ size: 'sm' }} />
                <span className="text-xs mt-1">sm</span>
              </div>
              <div className="flex flex-col items-center">
                <Icon name={iconNames[0]} styleProps={{ size: 'md' }} />
                <span className="text-xs mt-1">md</span>
              </div>
              <div className="flex flex-col items-center">
                <Icon name={iconNames[0]} styleProps={{ size: 'lg' }} />
                <span className="text-xs mt-1">lg</span>
              </div>
              <div className="flex flex-col items-center">
                <Icon name={iconNames[0]} styleProps={{ size: 'xl' }} />
                <span className="text-xs mt-1">xl</span>
              </div>
            </div>
          )}
        </section>

        {/* Colour variations */}
        <section className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Colour Variations (FFP Brand Colours)</h2>
          {iconNames.length > 0 && (
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <Icon
                  name={iconNames[0]}
                  styleProps={{ size: 'lg', colour: 'var(--color-ffp-primary-blue)' }}
                />
                <span className="text-xs mt-1">Primary Blue</span>
              </div>
              <div className="flex flex-col items-center">
                <Icon
                  name={iconNames[0]}
                  styleProps={{ size: 'lg', colour: 'var(--color-ffp-dark-blue)' }}
                />
                <span className="text-xs mt-1">Dark Blue</span>
              </div>
              <div className="flex flex-col items-center">
                <Icon
                  name={iconNames[0]}
                  styleProps={{ size: 'lg', colour: 'var(--color-ffp-green)' }}
                />
                <span className="text-xs mt-1">Green</span>
              </div>
              <div className="flex flex-col items-center">
                <Icon
                  name={iconNames[0]}
                  styleProps={{ size: 'lg', colour: 'var(--color-ffp-light-purple)' }}
                />
                <span className="text-xs mt-1">Light Purple</span>
              </div>
            </div>
          )}
        </section>

        {/* All icons grid */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">All Icons ({iconNames.length} total)</h2>
          <div className="grid grid-cols-8 gap-4">
            {iconNames.map((name) => (
              <div key={name} className="flex flex-col items-center p-2 hover:bg-gray-50 rounded">
                <Icon name={name} styleProps={{ size: 'lg' }} />
                <span className="text-xs mt-2 text-center break-all">{name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Placeholder message if no icons */}
        {iconNames.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
            <p className="text-yellow-800">
              No icons found. Add Icomoon assets and run &apos;pnpm icon:generate&apos; to populate
              icons.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
