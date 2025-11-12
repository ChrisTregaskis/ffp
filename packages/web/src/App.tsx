import { APP_NAME, APP_VERSION } from '@ffp/core';

import { PathAliasTest } from '@web/components/PathAliasTest';

function App(): JSX.Element {
  // Test for showing FormTest page for FFP-115b verification
  // return <FormTest />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-4xl">
        <div className="rounded-lg bg-card p-8 shadow-md">
          <h1 className="mb-2 text-4xl font-bold text-foreground">{APP_NAME}</h1>
          <p className="mb-4 text-sm text-muted-foreground">Version: {APP_VERSION}</p>
          <p className="mb-6 text-foreground">
            Multi-tenant physiotherapy SaaS platform - Dynamic assessments, personalised programmes,
            video workouts.
          </p>

          <div className="mb-8 border-l-4 border-primary bg-primary/10 p-4">
            <div className="flex">
              <div className="shrink-0">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-foreground">
                  <strong>Phase:</strong> Sprint 1 - Application Setup & Foundation
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>✅ FFP-17: Turborepo Initialised</li>
                  <li>✅ FFP-18: Package Structure Created</li>
                  <li>✅ FFP-19: Workspace Dependencies Configured</li>
                  <li>✅ FFP-20: TypeScript Paths & Configuration</li>
                  <li>✅ FFP-21: ESLint & Prettier Configured</li>
                  <li>✅ FFP-115a: Tailwind CSS v4 Configured</li>
                </ul>
              </div>
            </div>
          </div>

          <hr className="my-8 border-border" />

          {/* Test component demonstrating path aliases */}
          <PathAliasTest />
        </div>
      </div>
    </div>
  );
}

export default App;
