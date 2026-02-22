# Mining Pool

A full-featured multi-coin cryptocurrency mining pool with web dashboard.

## Features

- **Multi-algorithm support**: SHA-256, Scrypt
- **12 coins**: Bitcoin, Litecoin, Dogecoin, Namecoin, Pepecoin, Bells, Luckycoin, Junkcoin, Dingocoin, Shibacoin, TrumPOW, eGulden
- **Stratum server**: One port per coin, handles mining connections with real PoW validation
- **PPLNS rewards**: Pay Per Last N Shares payment system
- **Automatic payouts**: Hourly payment processing
- **Web dashboard**: Real-time hashrate charts, worker management, payment history
- **User system**: Registration, login, API keys, configurable payout settings
- **Pool statistics**: Per-coin stats, blocks found, top miners, network info
- **Admin panel**: User management, payment processing, pool overview
- **REST API**: Full API access for programmatic monitoring
- **Docker support**: Easy deployment with docker-compose
- **Variable difficulty**: Automatic per-client difficulty adjustment
- **mining.configure**: Version rolling support for ASICs (BIP320)

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Development Setup

```bash
# Backend
cd backend
cp .env.example .env    # Edit with your settings
npm install
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm start
```

Backend runs on http://localhost:8080, frontend on http://localhost:3000.

### Docker Deployment

```bash
cp backend/.env.example backend/.env  # Edit with your settings
docker-compose up -d
```

Frontend: http://localhost:3000, API: http://localhost:8080

## Architecture

```
mining-pool/
├── backend/
│   └── src/
│       ├── index.js              # Main entry, Express + cron jobs
│       ├── config/
│       │   ├── index.js          # Server configuration
│       │   └── coins.js          # Coin definitions (algo, ports, daemons)
│       ├── api/routes/
│       │   ├── auth.js           # Register, login, profile
│       │   ├── pool.js           # Pool stats, blocks, coins, daemon status
│       │   ├── miner.js          # Dashboard, workers, payments, earnings
│       │   └── admin.js          # Admin panel endpoints
│       ├── middleware/
│       │   └── auth.js           # JWT + API key authentication
│       ├── models/
│       │   └── database.js       # SQLite schema + connection
│       ├── stratum/
│       │   └── server.js         # Stratum protocol server (multi-port)
│       └── services/
│           ├── shareProcessor.js  # PPLNS reward calculation
│           ├── paymentProcessor.js # Automatic payments
│           ├── blockMonitor.js    # Block confirmation + daemon health tracking
│           └── daemonRPC.js       # Coin daemon RPC client
├── frontend/
│   └── src/
│       ├── App.js                # Router + auth provider
│       ├── components/           # Navbar, Footer, HashrateChart
│       ├── pages/                # Home, Dashboard, Workers, Payments, etc.
│       ├── services/api.js       # API client
│       ├── hooks/useAuth.js      # Auth context
│       └── utils/format.js       # Formatters (hashrate, dates, etc.)
├── docker-compose.yml
└── README.md
```

## Stratum Ports

| Coin             | Symbol | Algorithm | Port |
|-----------------|--------|-----------|------|
| Bitcoin         | BTC    | SHA-256   | 3333 |
| Litecoin        | LTC    | Scrypt    | 3334 |
| Dogecoin        | DOGE   | Scrypt    | 3335 |
| Namecoin        | NMC    | SHA-256   | 3336 |
| Pepecoin        | PEPE   | SHA-256   | 3337 |
| Bells           | BELLS  | Scrypt    | 3338 |
| Luckycoin       | LKY    | Scrypt    | 3339 |
| Junkcoin        | JKC    | Scrypt    | 3340 |
| Dingocoin       | DINGO  | Scrypt    | 3341 |
| Shibacoin       | SHIC   | Scrypt    | 3342 |
| TrumPOW         | TRMP   | Scrypt    | 3343 |
| eGulden         | EFL    | Scrypt    | 3344 |

## API Endpoints

### Public
- `GET /api/pool/info` - Pool overview
- `GET /api/pool/coins` - All supported coins
- `GET /api/pool/stats/:coin` - Coin-specific stats
- `GET /api/pool/blocks` - Found blocks (paginated)
- `GET /api/pool/hashrate/:coin` - Pool hashrate history
- `GET /api/pool/daemon-status` - Daemon sync status for all coins

### Authenticated (Bearer token or X-API-Key)
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile
- `GET /api/miner/dashboard` - Mining dashboard
- `GET /api/miner/workers` - Worker list
- `GET /api/miner/hashrate` - Hashrate history
- `GET /api/miner/payments` - Payment history
- `GET /api/miner/balances` - Current balances
- `GET /api/miner/earnings` - Earnings estimates

## Adding a New Coin

Edit `backend/src/config/coins.js` and add a new entry with:
- Algorithm, stratum port, block reward, block time
- Daemon RPC connection details
- Confirmation count
- Address prefixes for auto-registration

The stratum server automatically starts a listener for each configured coin.

## Production Notes

- Set a strong `JWT_SECRET` in `.env`
- Configure actual coin daemon RPC connections
- Set up SSL/TLS termination (nginx/caddy) in front
- Consider Redis for share storage at high volume
- Set up monitoring and alerting for daemon connectivity
