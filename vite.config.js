import { defineConfig } from 'vite';

const configuredPort = Number(process.env.PORT);
const configuredPreviewPort = Number(process.env.PREVIEW_PORT);

export default defineConfig({
  server: {
    port: Number.isInteger(configuredPort) && configuredPort > 0 ? configuredPort : 5173,
    strictPort: true,
  },
  preview: {
    port: Number.isInteger(configuredPreviewPort) && configuredPreviewPort > 0
      ? configuredPreviewPort
      : 4173,
    strictPort: true,
  },
});
