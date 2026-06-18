import {defineConfig} from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Pure-logic unit suite. These are all synchronous, dependency-free functions
// (JSON-LD escaping, link/SEO resolvers, CSV serialisation, brief parsing), so
// we run in the lightweight `node` environment — no jsdom needed.
//
// `vite-tsconfig-paths` wires up the `@/*` alias from frontend/tsconfig.json so
// imports like `@/sanity/lib/utils` resolve identically to the app build.
//
// `sanity/lib/api.ts` asserts these two env vars at module load and throws if
// they're missing; `utils.ts` (and transitively `seo.ts`) import it, so we seed
// dummy values here to let those modules load under test.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    env: {
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project',
      NEXT_PUBLIC_SANITY_DATASET: 'test-dataset',
    },
  },
})
