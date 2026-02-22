const axios = require('axios');

class DaemonRPC {
  constructor(config) {
    this.host = config.host;
    this.port = config.port;
    this.user = config.user;
    this.pass = config.pass;
    this.url = `http://${this.host}:${this.port}`;
    this.requestId = 0;
  }

  async call(method, params = []) {
    this.requestId++;
    try {
      const response = await axios.post(this.url, {
        jsonrpc: '2.0',
        id: this.requestId,
        method,
        params
      }, {
        auth: this.user ? { username: this.user, password: this.pass } : undefined,
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.error) {
        throw new Error(response.data.error.message || 'RPC Error');
      }

      return response.data.result;
    } catch (err) {
      if (err.response) {
        throw new Error(`RPC Error ${err.response.status}: ${err.response.data?.error?.message || 'Unknown'}`);
      }
      throw err;
    }
  }

  async getBlockTemplate(rules = []) {
    const params = { capabilities: ['coinbasetxn', 'workid', 'coinbase/append'] };
    if (rules.length > 0) {
      params.rules = rules;
    }
    return this.call('getblocktemplate', [params]);
  }

  async submitBlock(blockHex) {
    return this.call('submitblock', [blockHex]);
  }

  async getBlockCount() {
    return this.call('getblockcount');
  }

  async getBlockHash(height) {
    return this.call('getblockhash', [height]);
  }

  async getBlock(hash) {
    return this.call('getblock', [hash]);
  }

  async getNetworkHashPS() {
    return this.call('getnetworkhashps');
  }

  async getDifficulty() {
    return this.call('getdifficulty');
  }

  async getMiningInfo() {
    return this.call('getmininginfo');
  }

  async getBalance() {
    return this.call('getbalance');
  }

  async sendToAddress(address, amount) {
    return this.call('sendtoaddress', [address, amount]);
  }

  async validateAddress(address) {
    return this.call('validateaddress', [address]);
  }

  async getAddressInfo(address) {
    try {
      return await this.call('getaddressinfo', [address]);
    } catch {
      return await this.call('validateaddress', [address]);
    }
  }

  async getTransaction(txid) {
    return this.call('gettransaction', [txid]);
  }

  // Merge mining RPC methods
  async createAuxBlock(address) {
    return this.call('createauxblock', [address]);
  }

  async submitAuxBlock(hash, auxpow) {
    return this.call('submitauxblock', [hash, auxpow]);
  }

  async getAuxBlock(hash, auxpow) {
    if (hash && auxpow) {
      return this.call('getauxblock', [hash, auxpow]);
    }
    return this.call('getauxblock', []);
  }

  async getNewAddress() {
    return this.call('getnewaddress', []);
  }

  async ensureWalletLoaded() {
    try {
      // Check if a wallet is already loaded
      const wallets = await this.call('listwallets', []);
      if (wallets && wallets.length > 0) return;
      // Try loading common wallet names
      const walletDir = await this.call('listwalletdir', []).catch(() => ({ wallets: [] }));
      const names = walletDir.wallets?.map(w => w.name) || [];
      for (const name of names) {
        try {
          await this.call('loadwallet', [name]);
          return;
        } catch { /* try next */ }
      }
      // Last resort: create a new wallet
      await this.call('createwallet', ['pool']);
    } catch { /* older daemons may not support wallet RPCs */ }
  }

  async getBlockchainInfo() {
    return this.call('getblockchaininfo');
  }

  async getInfo() {
    try {
      return await this.call('getblockchaininfo');
    } catch {
      return await this.call('getinfo');
    }
  }
}

module.exports = DaemonRPC;
