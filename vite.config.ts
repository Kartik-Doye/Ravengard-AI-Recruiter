import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(async () => {
  const plugins: any[] = [react()];

  /**
   * @tailwindcss/vite relies on @tailwindcss/oxide, which requires a
   * platform-specific native binary (.node file). In CI / Docker environments
   * that binary may not be present (npm optional-dep resolution bug).
   *
   * Strategy:
   *   1. SKIP_TAILWIND_VITE=true → skip entirely; PostCSS handles Tailwind.
   *   2. Otherwise try to load @tailwindcss/vite; if the native binding
   *      is missing the catch block silently falls through to PostCSS.
   */
  const skipTailwindVite =
    process.env.SKIP_TAILWIND_VITE === 'true' ||
    process.env.CI === 'true';

  if (!skipTailwindVite) {
    try {
      // Probe the oxide binding first — if it throws, abort before importing
      // the vite plugin (which would let the error bubble past our catch).
      const oxideProbe = await import('@tailwindcss/oxide').catch(() => null);
      if (oxideProbe) {
        const tailwindModule = await import('@tailwindcss/vite');
        if (tailwindModule?.default) {
          plugins.push(tailwindModule.default());
        }
      } else {
        console.warn(
          '[@tailwindcss/vite] Oxide native binding unavailable. Falling through to PostCSS pipeline.'
        );
      }
    } catch (err: any) {
      console.warn(
        '[@tailwindcss/vite] Failed to load Tailwind Vite plugin. Using PostCSS pipeline instead.',
        err?.message || err
      );
    }
  } else {
    console.info(
      '[@tailwindcss/vite] Skipped (CI=true or SKIP_TAILWIND_VITE=true). PostCSS pipeline active.'
    );
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: false,
      watch: null,
    },
    build: {
      outDir: 'build',
      emptyOutDir: false,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('recharts') || id.includes('d3-') || id.includes('d3/')) {
                return 'vendor-charts';
              }
              if (
                id.includes('jspdf') ||
                id.includes('canvg') ||
                id.includes('html2canvas') ||
                id.includes('dompurify')
              ) {
                return 'vendor-pdf';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (
                id.includes('unpdf') ||
                id.includes('mammoth') ||
                id.includes('pdfjs')
              ) {
                return 'vendor-docs';
              }
              return 'vendor-core';
            }
          },
        },
      },
    },
  };
});
