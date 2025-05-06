import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import path from 'path'

export default defineConfig(({ mode }) => {
  // 加载当前模式下的环境变量，mode 是 'development' 或 'production'
  const env = loadEnv(mode, process.cwd());

  console.log("Loaded env variables:", env);  // 用于调试，输出加载的环境变量

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')  // 这里将 @ 指向 src 目录
      }
    },
    css: {
      postcss: {
        plugins: [
          tailwindcss(),
          autoprefixer(),
        ],
      },
    },
    server: {
      port: env.VITE_APP_PORT || 3000,  // 使用 VITE_APP_PORT 环境变量
      proxy: {
        '/admin-api': {
          target: env.VITE_APP_BASE_API,  // 使用 VITE_APP_BACKEND_URL 环境变量
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
