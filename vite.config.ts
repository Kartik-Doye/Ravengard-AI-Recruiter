import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(async () => {
  const plugins: any[] = [react()];

  // Gracefully load @tailwindcss/vite plugin; if native oxide binding is missing in CI, PostCSS handles it
  try {
    const tailwindModule = await import('@tailwindcss/vite');
    if (tailwindModule?.default) {
      plugins.push(tailwindModule.default());
    }
  } catch (err: any) {
    console.warn(
      '[@tailwindcss/vite] Notice: Native oxide binary missing in environment. Using PostCSS pipeline instead.',
      err?.message || err
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
              if (id.includes('jspdf') || id.includes('canvg') || id.includes('html2canvas') || id.includes('dompurify')) {
                return 'vendor-pdf';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('unpdf') || id.includes('mammoth') || id.includes('pdfjs')) {
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
