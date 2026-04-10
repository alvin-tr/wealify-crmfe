export default defineNuxtConfig({
  app: {
    head: {
      title: 'Customer Relationship Management',
      titleTemplate: '%s - Customer Relationship Management',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Customer Relationship Management System' },
      ],
    },
  },

  modules: [
    '@nuxt/ui',
    '@nuxt/icon'             // BẮT BUỘC để có _nuxt_icon
  ],

  // Tắt sourcemap khi build để giảm kích thước và tăng tốc độ build
  sourcemap: {
    server: false,
    client: false,
  },

  // Tối ưu Nitro config
  nitro: {
    serveStatic: true,
    // Tắt các tính năng không cần thiết để giảm cấu hình
    experimental: {
      // wasm: true, // Tắt nếu không cần WebAssembly
    },
    // Tối ưu build output
    minify: true,
    compressPublicAssets: true,
  },

  // Tối ưu Vite build
  vite: {
    build: {
      sourcemap: false, // Tắt sourcemap trong Vite build
      // minify: 'terser',
      // terserOptions: {
      //   compress: {
      //     drop_console: false, // Giữ console.log trong production nếu cần debug
      //     drop_debugger: true,
      //   },
      // },
    },
  },

  icon: {
    mode: 'svg',
    serverBundle: {
      collections: ['heroicons', 'lucide'] // Bundle sẫn cho server/SSR
    },
    clientBundle: {
      scan: true,              // Scan code để tạo bundle cho client
      sizeLimitKb: 5120,       // Tăng limit lên 5MB để chứa đủ icon
    },
    // Fallback: nếu client thiếu icon, nó sẽ gọi API
    // Đảm bảo API endpoint hoạt động bằng cách không disable clientBundle hoàn toàn
  },

  css: [
    '~/assets/css/main.css',
    '~/assets/css/slds-icons.css',
    '~/assets/css/social-icons.css'
  ],

  devtools: { enabled: false },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:4000',
      pusherKey: process.env.NUXT_PUBLIC_PUSHER_KEY || '',
      pusherCluster: process.env.NUXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
    },
  },

  // Tối ưu Tailwind CSS scanning (nếu cần)
  // Nuxt UI sử dụng Tailwind v4, có thể tối ưu bằng cách chỉ định content paths
  // tailwindcss: {
  //   // Tắt auto-scanning nếu quá nặng, chỉ scan các thư mục cần thiết
  //   // exposeConfig: false, // Tắt expose config nếu không cần
  //   // viewer: false, // Tắt Tailwind viewer trong dev nếu không cần
  // },
})
