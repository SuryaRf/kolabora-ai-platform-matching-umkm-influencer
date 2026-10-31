/**
 * Konfigurasi proses Kolabora di VPS memakai PM2.
 * Jalankan: pm2 startOrReload ecosystem.config.js --env production
 */
module.exports = {
  apps: [
    {
      name: "kolabora",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      // Next.js mengelola sendiri worker-nya; 1 proses lebih aman untuk Prisma + pooling.
      max_memory_restart: "700M",
      kill_timeout: 5000,
      wait_ready: false,
      autorestart: true,
      restart_delay: 2000,
      env: {
        NODE_ENV: "production",
        NEXT_TELEMETRY_DISABLED: "1",
        // Default dijanggalkan ke localhost.
        PORT: process.env.APP_PORT || "3000",
        HOSTNAME: process.env.APP_HOST || "127.0.0.1",
        // Wajib diisi di .env (atau di sini bila ingin tanpa file env)
        AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || "true",
      },
      error_file: "/var/log/kolabora/error.log",
      out_file: "/var/log/kolabora/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
