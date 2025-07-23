module.exports = {
  apps: [
    {
      name: 'neighborly-backend',
      cwd: '/var/www/neighborly/backend',
      script: 'server-express.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/var/log/neighborly-backend-error.log',
      out_file: '/var/log/neighborly-backend-out.log',
      log_file: '/var/log/neighborly-backend-combined.log',
      time: true
    },
  ]
};
