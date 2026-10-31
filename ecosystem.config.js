module.exports = {
  apps: [
    {
      name: 'cloth-shop-backend',
      script: 'server.js',
      instances: 'max', // Scale to all available CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,
      listen_timeout: 8000,
      kill_timeout: 5000,
    },
  ],
};
