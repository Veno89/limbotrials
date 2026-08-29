import { createVvfxCatalog } from './VvfxCatalog';

const discoveredRuntimeFiles = import.meta.glob<unknown>(
  './effects/**/*.vvfx-runtime.json',
  {
    eager: true,
    import: 'default',
  },
);

export const discoveredVvfxCatalog = createVvfxCatalog(discoveredRuntimeFiles);
