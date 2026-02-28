/**
 * Docker Control - Start/stop coin daemon containers via Docker socket
 * Uses the Docker Engine API directly (no external dependencies)
 */
const http = require('http');

const PROJECT = process.env.DOCKER_PROJECT || 'happychina-pool';

// Map coin IDs to their docker-compose service names
const COIN_SERVICE_MAP = {
  litecoin: 'litecoind',
  dogecoin: 'dogecoind',
  pepecoin: 'pepecoind',
  bells: 'bellsd',
  luckycoin: 'luckycoind',
  junkcoin: 'junkcoind',
  dingocoin: 'dingocoind',
  shibacoin: 'shibacoind',
  trumpow: 'trumpowd'
};

function dockerRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      socketPath: '/var/run/docker.sock',
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: data ? JSON.parse(data) : null });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Find container by service name (handles both _1 and -1 suffixes)
async function findContainer(serviceName) {
  try {
    const filters = JSON.stringify({ label: [`com.docker.compose.service=${serviceName}`] });
    const res = await dockerRequest('GET', `/containers/json?all=true&filters=${encodeURIComponent(filters)}`);
    if (res.statusCode === 200 && res.data && res.data.length > 0) {
      return res.data[0];
    }
    // Fallback: search by name pattern
    const nameFilters = JSON.stringify({ name: [`${PROJECT}_${serviceName}_1`] });
    const res2 = await dockerRequest('GET', `/containers/json?all=true&filters=${encodeURIComponent(nameFilters)}`);
    if (res2.statusCode === 200 && res2.data && res2.data.length > 0) {
      return res2.data[0];
    }
    return null;
  } catch (err) {
    console.error(`[Docker] Error finding container ${serviceName}:`, err.message);
    return null;
  }
}

async function startCoinDaemon(coinId) {
  const serviceName = COIN_SERVICE_MAP[coinId];
  if (!serviceName) throw new Error(`Unknown coin: ${coinId}`);

  const container = await findContainer(serviceName);
  if (!container) {
    // Container doesn't exist yet - need to create it via compose
    // Use docker compose up for this specific service
    const { execSync } = require('child_process');
    try {
      // Try docker compose (v2) first, then docker-compose (v1)
      execSync(`docker compose --project-name ${PROJECT} --profile coins up -d ${serviceName} 2>&1`, {
        timeout: 120000
      });
      console.log(`[Docker] Created and started ${serviceName} via compose`);
      return { success: true, action: 'created', service: serviceName };
    } catch (e) {
      try {
        execSync(`docker-compose --project-name ${PROJECT} --profile coins up -d ${serviceName} 2>&1`, {
          timeout: 120000
        });
        console.log(`[Docker] Created and started ${serviceName} via compose (v1)`);
        return { success: true, action: 'created', service: serviceName };
      } catch (e2) {
        console.error(`[Docker] Failed to create ${serviceName}:`, e2.message);
        throw new Error(`Failed to create ${serviceName}: ${e2.message}`);
      }
    }
  }

  // Container exists - start it
  const state = container.State;
  if (state === 'running') {
    return { success: true, action: 'already_running', service: serviceName };
  }

  const res = await dockerRequest('POST', `/containers/${container.Id}/start`);
  if (res.statusCode === 204 || res.statusCode === 304) {
    console.log(`[Docker] Started ${serviceName}`);
    return { success: true, action: 'started', service: serviceName };
  } else {
    throw new Error(`Failed to start ${serviceName}: ${JSON.stringify(res.data)}`);
  }
}

async function stopCoinDaemon(coinId) {
  const serviceName = COIN_SERVICE_MAP[coinId];
  if (!serviceName) throw new Error(`Unknown coin: ${coinId}`);

  const container = await findContainer(serviceName);
  if (!container) {
    return { success: true, action: 'not_found', service: serviceName };
  }

  if (container.State !== 'running') {
    return { success: true, action: 'already_stopped', service: serviceName };
  }

  const res = await dockerRequest('POST', `/containers/${container.Id}/stop?t=30`);
  if (res.statusCode === 204 || res.statusCode === 304) {
    console.log(`[Docker] Stopped ${serviceName}`);
    return { success: true, action: 'stopped', service: serviceName };
  } else {
    throw new Error(`Failed to stop ${serviceName}: ${JSON.stringify(res.data)}`);
  }
}

async function getCoinDaemonStatus(coinId) {
  const serviceName = COIN_SERVICE_MAP[coinId];
  if (!serviceName) return { running: false, exists: false };

  const container = await findContainer(serviceName);
  if (!container) return { running: false, exists: false };

  return {
    running: container.State === 'running',
    exists: true,
    state: container.State,
    status: container.Status
  };
}

module.exports = { startCoinDaemon, stopCoinDaemon, getCoinDaemonStatus, COIN_SERVICE_MAP };
