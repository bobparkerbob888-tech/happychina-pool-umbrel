# HappyChina Mining Pool

A full-featured multi-coin cryptocurrency mining pool with web dashboard, designed for Umbrel.

## Features

- **Multi-algorithm support**: SHA-256, Scrypt
- **11 coins**: Bitcoin, Namecoin, Litecoin, Dogecoin, Pepecoin, Bells, Luckycoin, Junkcoin, Dingocoin, Shibacoin, TrumPOW
- **Merge mining**: Namecoin merge-mined with Bitcoin (SHA-256); Dogecoin, Pepecoin, Bells, Luckycoin, Junkcoin, Dingocoin, Shibacoin, TrumPOW merge-mined with Litecoin (Scrypt)
- **Two stratum ports**: SHA-256 miners connect to one port, Scrypt miners to another — all merge-mined coins are found automatically
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

## Stratum Ports

| Port | Algorithm | Primary Coin | Merge-Mined Coins |
|------|-----------|-------------|-------------------|
| 3342 | SHA-256   | Bitcoin (BTC) | Namecoin (NMC) |
| 3333 | Scrypt    | Litecoin (LTC) | DOGE, PEPE, BELLS, LKY, JKC, DINGO, SHIC, TRMP |

Connect your miners:
- **SHA-256 ASICs**: `stratum+tcp://YOUR_UMBREL_IP:3342`
- **Scrypt ASICs**: `stratum+tcp://YOUR_UMBREL_IP:3333`

Use your wallet address as the username.

## Quick Start (Umbrel)

Install from the Umbrel app store or add the community app store repo.

## Quick Start (Standalone)

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
docker-compose up -d
```

Frontend: http://localhost:80, API: http://localhost:8080

## Architecture

```
happychina-pool/
├── backend/
│   └── src/
│       ├── index.js              # Main entry, Express + cron jobs
│       ├── config/
│       │   ├── index.js          # Server configuration
│       │   └── coins.js          # Coin definitions (algo, daemons, merge-mining)
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
│       │   └── server.js         # Stratum protocol server (multi-algo)
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
├── umbrel-app.yml
└── README.md
```

## Supported Coins

### SHA-256 (port 3342)
| Coin | Symbol | Type | Block Time |
|------|--------|------|-----------|
| Bitcoin | BTC | Primary | 10 min |
| Namecoin | NMC | Merge-mined with BTC | 10 min |

### Scrypt (port 3333)
| Coin | Symbol | Type | Block Time |
|------|--------|------|-----------|
| Litecoin | LTC | Primary | 2.5 min |
| Dogecoin | DOGE | Merge-mined with LTC | 1 min |
| Pepecoin | PEPE | Merge-mined with LTC | 1 min |
| Bells | BELLS | Merge-mined with LTC | 1 min |
| Luckycoin | LKY | Merge-mined with LTC | 1 min |
| Junkcoin | JKC | Merge-mined with LTC | 1 min |
| Dingocoin | DINGO | Merge-mined with LTC | 1 min |
| Shibacoin | SHIC | Merge-mined with LTC | 1 min |
| TrumPOW | TRMP | Merge-mined with LTC | 1 min |

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

## Disk Space Requirements

This pool runs 11 blockchain daemons. Full sync requires approximately:
- Bitcoin: ~850GB
- Litecoin: ~250GB
- Bells: ~400GB
- Dogecoin: ~220GB
- Other coins: ~30GB total

**Total: ~1.75TB**

## Other Versions

- **Ubuntu/Linux**: [happychina-pool-ubuntu](https://github.com/bobparkerbob888-tech/happychina-pool-ubuntu) — one-command CLI install
- **Windows**: [happychina-pool-windows](https://github.com/bobparkerbob888-tech/happychina-pool-windows) — one-click `.bat` launcher

## Production Notes

- Set a strong `JWT_SECRET` in `.env`
- Configure actual coin daemon RPC connections
- Set up SSL/TLS termination (nginx/caddy) in front
- Consider Redis for share storage at high volume
- Set up monitoring and alerting for daemon connectivity
