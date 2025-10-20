import { APP_NAME, APP_VERSION } from '@ffp/core';

import { PathAliasTest } from '@web/components/PathAliasTest';

function App(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{APP_NAME}</h1>
          <p className="text-sm text-gray-500 mb-4">Version: {APP_VERSION}</p>
          <p className="text-gray-700 mb-6">
            Multi-tenant physiotherapy SaaS platform - Dynamic assessments, personalised programmes,
            video workouts.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Phase:</strong> Sprint 1 - Application Setup & Foundation
                </p>
                <ul className="mt-2 text-sm text-blue-600 space-y-1">
                  <li>✅ FFP-17: Turborepo Initialised</li>
                  <li>✅ FFP-18: Package Structure Created</li>
                  <li>✅ FFP-19: Workspace Dependencies Configured</li>
                  <li>✅ FFP-20: TypeScript Paths & Configuration</li>
                  <li>✅ FFP-21: ESLint & Prettier Configured</li>
                  <li>🎨 TailwindCSS: Configured & Working</li>
                </ul>
              </div>
            </div>
          </div>

          <hr className="my-8 border-gray-200" />

          {/* Test component demonstrating path aliases */}
          <PathAliasTest />
        </div>
      </div>
    </div>
  );
}

export default App;
