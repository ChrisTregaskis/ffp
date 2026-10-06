/**
 * ESLint configuration for @ffp/web package
 * Uses React configuration for frontend application
 */

// Atomic design levels, lowest first. A level may import only the levels below it.
const LEVELS = ['atoms', 'molecules', 'organisms', 'templates'];

// Domain component folders. Level folders never import these; pages and domains import anything.
const DOMAIN_FOLDERS = [
  'assessment',
  'assessment-flows',
  'AssessmentProgress',
  'auth',
  'programme',
  'programme-templates',
  'questions',
  'session',
  'video',
];

const COMPONENTS = './src/components';

// Zones resolve through the TypeScript resolver, so alias and relative imports are held alike.
const levelBoundaryZones = LEVELS.flatMap((level, index) => [
  {
    target: `${COMPONENTS}/${level}`,
    from: [
      ...LEVELS.slice(index + 1).map((higher) => `${COMPONENTS}/${higher}`),
      ...DOMAIN_FOLDERS.map((domain) => `${COMPONENTS}/${domain}`),
    ],
    message: `Imports point down: ${level} may import only lower levels, and never a domain folder.`,
  },
  {
    target: `${COMPONENTS}/${level}`,
    from: `${COMPONENTS}/${level}/index.ts`,
    message: `A component never imports its own level's barrel; import the sibling by its path (../Name).`,
  },
]);

module.exports = {
  extends: ['@ffp/eslint-config/react'],
  parserOptions: {
    project: ['./tsconfig.json', './tsconfig.node.json', './tsconfig.test.json'],
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['dist', 'node_modules', 'sst-env.d.ts', '*.tsbuildinfo'],
  settings: {
    // Resolve @web/* through this package's tsconfig wherever ESLint runs, so the level zones see aliases.
    'import/resolver': {
      typescript: { alwaysTryTypes: true, project: `${__dirname}/tsconfig.json` },
    },
  },
  rules: {
    // Prevent importing Node.js-only code into browser bundle
    // @ffp/database includes pg (PostgreSQL client) which uses process.env
    // Use @ffp/database/constants for browser-safe constants only
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@ffp/database',
            message:
              'Direct @ffp/database imports bundle Node.js code (pg) into the browser. Use @ffp/database/constants for browser-safe constants.',
          },
        ],
        patterns: [
          {
            group: LEVELS.map((level) => `@web/components/${level}/*`),
            message:
              'Import generic components from their level barrel, e.g. @web/components/atoms.',
          },
        ],
      },
    ],
    // basePath pins the zones to this package, so they hold whichever directory ESLint runs from.
    'import/no-restricted-paths': ['error', { basePath: __dirname, zones: levelBoundaryZones }],
  },
};
