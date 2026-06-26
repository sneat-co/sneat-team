import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [
            '^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$',
            // Interim: the team wire contract is consumed from the sibling
            // sneat-team-ext repo as a linked package (resolves outside the
            // workspace), so it is not part of the Nx project graph.
            '@sneat/extension-team-contract',
          ],
          depConstraints: [
            {
              sourceTag: 'scope:team',
              onlyDependOnLibsWithTags: ['scope:team'],
            },
            {
              sourceTag: 'type:internal',
              onlyDependOnLibsWithTags: [
                'type:internal',
                'scope:foundation',
                'scope:team',
              ],
            },
            {
              // The app is the composition root: it may consume every tier,
              // including type:internal (to wire provider factories at bootstrap).
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:lib', 'type:internal'],
            },
            {
              sourceTag: 'type:e2e',
              onlyDependOnLibsWithTags: ['type:app', 'type:lib'],
            },
            {
              sourceTag: 'type:lib',
              onlyDependOnLibsWithTags: ['type:lib'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
