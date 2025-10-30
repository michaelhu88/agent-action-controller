/**
 * PM2 Process Manager Configuration
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 stop action-controller
 *   pm2 restart action-controller
 *   pm2 logs action-controller
 */

module.exports = {
  apps: [{
    name: 'action-controller',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
