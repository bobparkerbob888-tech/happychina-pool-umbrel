/**
 * Coin configurations.
 * Each coin specifies its algorithm, daemon RPC settings, stratum port, and reward info.
 * Daemon credentials are loaded from environment variables (.env file).
 * To add a coin: copy an existing entry, set the env var prefix (e.g., MYCOIN_RPC_*), and add to .env
 * To remove a coin: delete or comment out its entry below and from .env
 */
const coins = {
  bitcoin: {
    name: 'Bitcoin',
    symbol: 'BTC',
    algorithm: 'sha256',
    stratumPort: 3333,
    reward: 3.125,
    blockTime: 600,
    confirmations: 100,
    segwit: true,
    daemon: {
      host: process.env.BTC_RPC_HOST || '127.0.0.1',
      port: parseInt(process.env.BTC_RPC_PORT) || 8332,
      user: process.env.BTC_RPC_USER || 'rpcuser',
      pass: process.env.BTC_RPC_PASS || 'rpcuser'
    },
    explorer: 'https://blockchair.com/bitcoin/transaction/',
    addressPrefixes: ['1', '3', 'bc1']
  },
  litecoin: {
    name: 'Litecoin',
    symbol: 'LTC',
    algorithm: 'scrypt',
    stratumPort: 3334,
    reward: 6.25,
    blockTime: 150,
    confirmations: 60,
    segwit: true,
    mweb: true,
    daemon: {
      host: process.env.LTC_RPC_HOST || '127.0.0.1',
      port: parseInt(process.env.LTC_RPC_PORT) || 9332,
      user: process.env.LTC_RPC_USER || 'rpcuser',
      pass: process.env.LTC_RPC_PASS || 'rpcuser'
    },
    explorer: 'https://blockchair.com/litecoin/transaction/',
    addressPrefixes: ['L', 'M', 'ltc1']
  },
  dogecoin: {
    name: 'Dogecoin',
    symbol: 'DOGE',
    algorithm: 'scrypt',
    stratumPort: 3335,
    reward: 10000,
    blockTime: 60,
    confirmations: 40,
    mergeMinedWith: 'litecoin',
    chainId: 98,
    auxpowApi: 'getauxblock',
    daemon: {
      host: process.env.DOGE_RPC_HOST || '127.0.0.1',
      port: parseInt(process.env.DOGE_RPC_PORT) || 22555,
      user: process.env.DOGE_RPC_USER || 'rpcuser',
      pass: process.env.DOGE_RPC_PASS || 'rpcuser'
    },
    explorer: 'https://blockchair.com/dogecoin/transaction/',
    addressPrefixes: ['D']
  },
  namecoin: {
    name: 'Namecoin',
    symbol: 'NMC',
    algorithm: 'sha256',
    stratumPort: 3336,
    reward: 6.25,
    blockTime: 600,
    confirmations: 100,
    segwit: true,
    mergeMinedWith: 'bitcoin',
    chainId: 1,
    auxpowApi: 'createauxblock',
    daemon: {
      host: process.env.NMC_RPC_HOST || '127.0.0.1',
      port: parseInt(process.env.NMC_RPC_PORT) || 8336,
      user: process.env.NMC_RPC_USER || 'rpcuser',
      pass: process.env.NMC_RPC_PASS || 'rpcuser'
    },
    explorer: 'https://namecoin.info/tx/',
    addressPrefixes: ['N', 'M']
  },
  pepecoin: {
    name: 'Pepecoin',
    symbol: 'PEPE',
    algorithm: 'scrypt',
    stratumPort: 3337,
    reward: 0, // varies
    blockTime: 60,
    confirmations: 100,
    mergeMinedWith: 'litecoin',
    chainId: 63,
    auxpowApi: 'createauxblock',
    daemon: {
      host: process.env.PEPE_RPC_HOST || '127.0.0.1',
      port: parseInt(process.env.PEPE_RPC_PORT) || 29373,
      user: process.env.PEPE_RPC_USER || 'rpcuser',
      pass: process.env.PEPE_RPC_PASS || 'rpcuser'
    },
    explorer: '',
    addressPrefixes: ['P']
  },
  bells: {
    name: 'Bells',
    symbol: 'BELLS',
    algorithm: 'scrypt',
    stratumPort: 3338,
    reward: 0, // varies
    blockTime: 60,
    confirmations: 100,
    segwit: true,
    mergeMinedWith: 'litecoin',
    chainId: 16,
    auxpowApi: 'createauxblock',
    daemon: {
      host: process.env.BELLS_RPC_HOST || '127.0.0.1',
      port: parseInt(process.env.BELLS_RPC_PORT) || 19918,
      user: process.env.BELLS_RPC_USER || 'rpcuser',
      pass: process.env.BELLS_RPC_PASS || 'rpcuser'
    },
    explorer: '',
    addressPrefixes: ['B']
  },
  luckycoin: {
    name: 'Luckycoin',
    symbol: 'LKY',
    algorithm: 'scrypt',
    stratumPort: 3339,
    reward: 0, // varies
    blockTime: 60,
    confirmations: 100,
    mergeMinedWith: 'litecoin',
    chainId: 0, // detected at runtime via createauxblock
    auxpowApi: 'createauxblock',
    daemon: {
      host: process.env.LKY_RPC_HOST || '127.0.0.1',
      port: parseInt(process.env.LKY_RPC_PORT) || 9918,
      user: process.env.LKY_RPC_USER || 'rpcuser',
      pass: process.env.LKY_RPC_PASS || 'rpcuser'
    },
    explorer: '',
    addressPrefixes: ['L']
  },
  junkcoin: {
    name: 'Junkcoin',
    symbol: 'JKC',
    algorithm: 'scrypt',
    stratumPort: 3340,
    reward: 0, // varies
    blockTime: 60,
    confirmations: 100,
    mergeMinedWith: 'litecoin',
    chainId: 8224,
    auxpowApi: 'createauxblock',
    payoutAddress: process.env.JKC_PAYOUT_ADDRESS || '', // Required: JKC daemon can't generate addresses
    daemon: {
      host: process.env.JKC_RPC_HOST || '127.0.0.1',
      port: parseInt(process.env.JKC_RPC_PORT) || 9772,
      user: process.env.JKC_RPC_USER || 'rpcuser',
      pass: process.env.JKC_RPC_PASS || 'rpcuser'
    },
    explorer: '',
    addressPrefixes: ['J', '7']
  },
  dingocoin: {
    name: 'Dingocoin',
    symbol: 'DINGO',
    algorithm: 'scrypt',
    stratumPort: 3341,
    reward: 0, // varies
    blockTime: 60,
    confirmations: 40,
    mergeMinedWith: 'litecoin',
    chainId: 50,
    auxpowApi: 'getauxblock',
    daemon: {
      host: process.env.DINGO_RPC_HOST || '127.0.0.1',
      port: parseInt(process.env.DINGO_RPC_PORT) || 34646,
      user: process.env.DINGO_RPC_USER || 'rpcuser',
      pass: process.env.DINGO_RPC_PASS || 'rpcuser'
    },
    explorer: '',
    addressPrefixes: ['D']
  },
  shibacoin: {
    name: 'Shibacoin',
    symbol: 'SHIC',
    algorithm: 'scrypt',
    stratumPort: 3342,
    reward: 0, // varies
    blockTime: 60,
    confirmations: 40,
    mergeMinedWith: 'litecoin',
    chainId: 74,
    auxpowApi: 'createauxblock',
    daemon: {
      host: process.env.SHIC_RPC_HOST || '127.0.0.1',
      port: parseInt(process.env.SHIC_RPC_PORT) || 33863,
      user: process.env.SHIC_RPC_USER || 'rpcuser',
      pass: process.env.SHIC_RPC_PASS || 'rpcuser'
    },
    explorer: '',
    addressPrefixes: ['S']
  },
  trumpow: {
    name: 'TrumPOW',
    symbol: 'TRMP',
    algorithm: 'scrypt',
    stratumPort: 3343,
    reward: 0, // varies
    blockTime: 60,
    confirmations: 40,
    mergeMinedWith: 'litecoin',
    chainId: 168,
    auxpowApi: 'createauxblock',
    daemon: {
      host: process.env.TRMP_RPC_HOST || '127.0.0.1',
      port: parseInt(process.env.TRMP_RPC_PORT) || 33883,
      user: process.env.TRMP_RPC_USER || 'rpcuser',
      pass: process.env.TRMP_RPC_PASS || 'rpcuser'
    },
    explorer: '',
    addressPrefixes: ['T']
  }
};

// Map algorithms to their display names and supported coins
const algorithms = {};
for (const [coinId, coin] of Object.entries(coins)) {
  if (!algorithms[coin.algorithm]) {
    algorithms[coin.algorithm] = {
      name: coin.algorithm.toUpperCase(),
      coins: []
    };
  }
  algorithms[coin.algorithm].coins.push(coinId);
}

module.exports = { coins, algorithms };
