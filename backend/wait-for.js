// wait-for.js
const net = require('net');

function waitFor(host, port, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryOnce = () => {
      const socket = new net.Socket();
      socket.setTimeout(3000);
      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.on('error', () => retry());
      socket.on('timeout', () => retry());
      socket.connect(port, host);
      function retry() {
        socket.destroy();
        if (Date.now() - start > timeoutMs)
          reject(new Error(`Timeout waiting for ${host}:${port}`));
        else setTimeout(tryOnce, 500);
      }
    };
    tryOnce();
  });
}

(async () => {
  const targets = [
    {
      host: process.env.PG_HOST || 'postgres',
      port: +(process.env.PG_PORT || 5432),
    },
    {
      host: process.env.REDIS_HOST || 'redis',
      port: +(process.env.REDIS_PORT || 6379),
    },
  ];
  for (const t of targets) {
    console.log(`[wait] ${t.host}:${t.port}`);
    await waitFor(t.host, t.port);
  }
  console.log('[wait] all deps ready');
})();
