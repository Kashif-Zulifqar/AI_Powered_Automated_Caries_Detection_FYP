import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/AI_Powered_Automated_Caries_Detection_FYP/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy all /auth requests to Flask backend
      // This eliminates CORS entirely — browser sees same-origin requests
      "/auth": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
