require('dotenv').config();
const net = require('net');

function portAvailable(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.unref();
    probe.once('error', () => resolve(false));
    probe.listen(port, () => probe.close(() => resolve(true)));
  });
}

(async () => {
  const preferred = Number(process.env.PORT) || 9999;
  let selected = preferred;
  while (selected < preferred + 50 && !(await portAvailable(selected))) selected += 1;
  if (selected >= preferred + 50) throw new Error(`No free development port in ${preferred}-${preferred + 49}`);
  process.env.PORT = String(selected);
  if (selected !== preferred) console.warn(`[dev] Port ${preferred} is busy; using ${selected}. Update Postman base_url.`);
  console.log(`[dev] Starting on http://localhost:${selected}`);
  require('../server');
})().catch((error) => {
  console.error(`[dev] Startup failed: ${error.message}`);
  process.exit(1);
});
