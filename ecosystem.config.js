module.exports = {
  apps: [{
    name: 'haibao-server',
    script: 'src/plugins/haibao/server/production.cjs',
    instances: 1,       // sharp 不支持 cluster 模式
    exec_mode: 'fork',
    env_production: {
      NODE_ENV: 'production',
    },
    max_memory_restart: '512M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true,
  }],
};
