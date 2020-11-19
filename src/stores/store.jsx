import config from "../config/config";
import async from 'async';
import {
  ERROR,
  CONNECTION_CONNECTED,
  CONNECTION_DISCONNECTED,
  GET_BALANCES,
  BALANCES_RETURNED,
  GET_BALANCES_LIGHT,
  BALANCES_LIGHT_RETURNED,
  GET_USD_PRICE,
  USD_PRICE_RETURNED,
  GET_BEST_PRICE,
  BEST_PRICE_RETURNED,
  SWAP,
  SWAP_RETURNED,
  GET_TOEKEN_DASHBOARD_SNAPSHOT,
  TOEKEN_DASHBOARD_SNAPSHOT_RETURNED
} from '../constants/constants';
import Web3 from 'web3';

import {
  injected,
  walletconnect,
  walletlink,
  ledger,
  trezor,
  frame,
  fortmatic,
  portis,
  squarelink,
  torus,
  authereum
} from "./connectors";

const rp = require('request-promise');
const ethers = require('ethers');
const bigNumberify = ethers.utils.bigNumberify;

const Dispatcher = require('flux').Dispatcher;
const Emitter = require('events').EventEmitter;

const dispatcher = new Dispatcher();
const emitter = new Emitter();

class Store {
  constructor() {

    this.store = {
      statisticsProvider: 'raw',
      statistics: [],
      universalGasPrice: '70',
      ethPrice: 0,
      usdPrices: null,
      account: {},
      web3: null,
      events: [],
      tokenDashboard: {
        tokenList: []
      },
      connectorsByName: {
        MetaMask: injected,
        TrustWallet: injected,
        WalletConnect: walletconnect,
        WalletLink: walletlink,
        Ledger: ledger,
        Trezor: trezor,
        Frame: frame,
        Fortmatic: fortmatic,
        Portis: portis,
        Squarelink: squarelink,
        Torus: torus,
        Authereum: authereum
      },
      builtWith: [
        {
          website: 'https://uniswap.org',
          logo: 'uniswap.png',
          name: 'Uniswap'
        },
        {
          website: 'https://www.ethereum.org',
          logo: 'ethereum.png',
          name: 'ethereum'
        },
        {
          website: 'https://etherscan.io',
          logo: 'etherscan.png',
          name: 'Etherscan'
        }
      ],
      web3context: null,
      languages: [
        {
          language: 'English',
          code: 'en'
        },
        {
          language: 'Japanese',
          code: 'ja'
        },
        {
          language: 'Chinese',
          code: 'zh'
        }
      ],
      ethBalance: 0
    }

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case GET_BALANCES:
            this.getERC20Balance(payload);
            break;
          case SWAP:
            this.mulitSwap(payload)
            break;
          case GET_BEST_PRICE:
            this.getExceptedReturn(payload)
            break;
          case GET_TOEKEN_DASHBOARD_SNAPSHOT:
            this.getloadTokenList(payload)
            break;
          // case CHECK_APPROVE:
          //   this._checkApproval(payload)
          default: {
          }
        }
      }.bind(this)
    );
  }

  getStore(index) {
    return(this.store[index]);
  };

  setStore(obj) {
    this.store = {...this.store, ...obj}
    return emitter.emit('StoreUpdated');
  };

  _checkApproval = async (asset, account, amount, contract, callback) => {

    if(asset.erc20address === 'Ethereum') {
      return callback()
    }
    const web3 = new Web3(store.getStore('web3context').library.provider);
    let erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.erc20address)
    console.log(amount)
    try {
      const allowance = await erc20Contract.methods.allowance(account.address, contract).call({ from: account.address })
      
      const ethAllowance = web3.utils.fromWei(allowance, "ether")

      if(parseFloat(ethAllowance) < parseFloat(amount)) {
        /*
          code to accomodate for "assert _value == 0 or self.allowances[msg.sender][_spender] == 0" in contract
          We check to see if the allowance is > 0. If > 0 set to 0 before we set it to the correct amount.
        */
        await erc20Contract.methods.approve(contract, web3.utils.toWei('999999999999', "ether")).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
        callback()
      } else {
        callback()
      }
    } catch(error) {
      if(error.message) {
        return callback(error.message)
      }
      callback(error)
    }
  }

  _checkApprovalWaitForConfirmation = async (asset, account, amount, contract, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);
    let erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.erc20address)
    const allowance = await erc20Contract.methods.allowance(account.address, contract).call({ from: account.address })

    const ethAllowance = web3.utils.fromWei(allowance, "ether")

    erc20Contract.methods.approve(contract, web3.utils.toWei(amount, "ether")).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
          .on('transactionHash', function(hash){
            callback()
          })
          .on('error', function(error) {
            if (!error.toString().includes("-32601")) {
              if(error.message) {
                return callback(error.message)
              }
              callback(error)
            }
      })
    }

  getERC20Balance = (asset, account) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);
    let erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.address)
    try {
      console.log(account)
      var balance = erc20Contract.methods.balanceOf(account).call({ from: account.address });
      console.log(balance)
      balance = parseFloat(balance)/10**asset.decimals
      return parseFloat(balance)
    } catch(ex) {
      console.log(ex)
    }
  }

  _getBalance = async (web3, asset, account, callback) => {

    if(asset.erc20address === 'Ethereum') {
      try {
        const eth_balance = web3.utils.fromWei(await web3.eth.getBalance(asset.iEarnContract), "ether");
        callback(null, parseFloat(eth_balance))
      } catch(ex) {
        console.log(ex)
        return callback(ex)
      }
    } else {
      let erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.erc20address)

      try {
        var balance = await erc20Contract.methods.balanceOf(asset.iEarnContract).call({ from: account.address });
        balance = parseFloat(balance)/10**asset.decimals
        callback(null, parseFloat(balance))
      } catch(ex) {
        console.log(ex)
        return callback(ex)
      }
    }
  }


  mulitSwap = (payload) => {
    const account = store.getStore('account')
    const { sendAsset, amount } = payload.content

    let yCurveZapSwapContract = config.yCurveZapSwapAddress
    if (sendAsset.id === 'crvV3') {
      yCurveZapSwapContract = config.yCurveZapSwapV4Address
    }

    this._checkApproval(sendAsset, account, amount, yCurveZapSwapContract, (err) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }

      this._callSwap(sendAsset, account, amount, (err, swapResult) => {
        if(err) {
          return emitter.emit(ERROR, err);
        }

        return emitter.emit(SWAP_RETURNED, swapResult)
      })
    })
  }

  _callSwap = async (sendAsset, account, amount, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);

    var amountToSend = web3.utils.toWei(amount, "ether")
    if (sendAsset.decimals !== 18) {
      amountToSend = amount*10**sendAsset.decimals;
    }

    let call = ''

    switch (sendAsset.id) {
      case 'crvV1':
        call = 'swapv1tov3'
        break;
      case 'crvV2':
        call = 'swapv2tov3'
        break;
      case 'crvV3':
        call = 'swapv3tov4'
        break;
      default:
    }

    let yCurveZapSwapContract = new web3.eth.Contract(config.yCurveZapSwapABI, config.yCurveZapSwapAddress)
    if (sendAsset.id === 'crvV3') {
      yCurveZapSwapContract = new web3.eth.Contract(config.yCurveZapSwapV4ABI, config.yCurveZapSwapV4Address)
    }
    yCurveZapSwapContract.methods[call](amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
      .on('transactionHash', function(hash){
        console.log(hash)
        callback(null, hash)
      })
      .on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt);
      })
      .on('receipt', function(receipt){
        console.log(receipt);
      })
      .on('error', function(error) {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
      .catch((error) => {
        if (!error.toString().includes("-32601")) {
          if(error.message) {
            return callback(error.message)
          }
          callback(error)
        }
      })
  }

  _getERC20Balance = (payload) => {
    const account = store.getStore('account')
    const { sendAsset, receiveAsset, amount } = payload.content

    this._getExceptedReturn(sendAsset, receiveAsset, amount, config.OneSplitcontract, (err, {returnAmount, distribution}) => {
      if(err) {
        return emitter.emit(ERROR, err);
      }
      return emitter.emit(BEST_PRICE_RETURNED, {returnAmount, distribution})
    })
  }

  _getExceptedReturn = () => {

  }

  _getUSDPrices = async () => {
    try {
      const url = 'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin,dai,true-usd,tether,usd-coin,chainlink,yearn-finance,binance-usd,wrapped-bitcoin,ethereum,nusd,chainlink,aave-link,lp-sbtc-curve,lp-bcurve,curve-fi-ydai-yusdc-yusdt-ytusd&vs_currencies=usd,eth'
      const priceString = await rp(url);
      const priceJSON = JSON.parse(priceString)

      return priceJSON
    } catch(e) {
      console.log(e)
      return null
    }
  }

  _getAssetUSDPrices = async (web3, asset, account, usdPrices, callback) => {
    try {
      const vaultContract = new web3.eth.Contract(asset.vaultContractABI, asset.vaultContractAddress)
      const pricePerFullShare = await vaultContract.methods.getPricePerFullShare().call({ from: account.address })

      const usdPrice = usdPrices[asset.price_id]

      const returnObj = {
        pricePerFullShare: pricePerFullShare/1e18,
        usdPrice: usdPrice.usd
      }

      callback(null, returnObj)

    } catch (ex) {
      callback(null, {})
    }
  }

  _checkApproval = async (asset, account, amount, contract, callback) => {

    if(asset.erc20address === 'Ethereum') {
      return callback()
    }

    const web3 = new Web3(store.getStore('web3context').library.provider);
    let erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.erc20address)
    try {
      const allowance = await erc20Contract.methods.allowance(account.address, contract).call({ from: account.address })

      let ethAllowance = web3.utils.fromWei(allowance, "ether")
      if (asset.decimals !== 18) {
        ethAllowance = (allowance*10**asset.decimals).toFixed(0);
      }

      var amountToSend = web3.utils.toWei('999999999', "ether")
      if (asset.decimals !== 18) {
        amountToSend = (999999999*10**asset.decimals).toFixed(0);
      }

      if(parseFloat(ethAllowance) < parseFloat(amount)) {
        /*
          code to accomodate for "assert _value == 0 or self.allowances[msg.sender][_spender] == 0" in contract
          We check to see if the allowance is > 0. If > 0 set to 0 before we set it to the correct amount.
        */
        if(ethAllowance > 0) {
          await erc20Contract.methods.approve(contract, web3.utils.toWei('0', "ether")).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
        }

        await erc20Contract.methods.approve(contract, amountToSend).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
        callback()
      } else {
        callback()
      }
    } catch(error) {
      if(error.message) {
        return callback(error.message)
      }
      callback(error)
    }
  }

  _checkIfApprovalIsNeeded = async (asset, account, amount, contract, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);
    let erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.erc20address)
    const allowance = await erc20Contract.methods.allowance(account.address, contract).call({ from: account.address })

    const ethAllowance = web3.utils.fromWei(allowance, "ether")
    if(parseFloat(ethAllowance) < parseFloat(amount)) {
      asset.amount = amount
      callback(null, asset)
    } else {
      callback(null, false)
    }
  }

  _callApproval = async (asset, account, amount, contract, last, callback) => {
    const web3 = new Web3(store.getStore('web3context').library.provider);
    let erc20Contract = new web3.eth.Contract(config.erc20ABI, asset.erc20address)
    try {
      const allowance = await erc20Contract.methods.allowance(account.address, contract).call({ from: account.address })
      const ethAllowance = web3.utils.fromWei(allowance, "ether")
      if(ethAllowance > 0) {
        erc20Contract.methods.approve(contract, web3.utils.toWei('0', "ether")).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
          .on('transactionHash', function(hash){
            //success...
          })
          .on('error', function(error) {
            if (!error.toString().includes("-32601")) {
              if(error.message) {
                return callback(error.message)
              }
              callback(error)
            }
          })
      }
      

      if(last) {
        await erc20Contract.methods.approve(contract, web3.utils.toWei(amount, "ether")).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
        callback()
      } else {
        erc20Contract.methods.approve(contract, web3.utils.toWei(amount, "ether")).send({ from: account.address, gasPrice: web3.utils.toWei(await this._getGasPrice(), 'gwei') })
          .on('transactionHash', function(hash){
            callback()
          })
          .on('error', function(error) {
            if (!error.toString().includes("-32601")) {
              if(error.message) {
                return callback(error.message)
              }
              callback(error)
            }
          })
      }
    } catch(error) {
      if(error.message) {
        return callback(error.message)
      }
      callback(error)
    }
  }

  getUSDPrices = async () => {
    try {
      const priceJSON = await this._getUSDPrices()
      store.setStore({ usdPrices: priceJSON })
      return emitter.emit(USD_PRICE_RETURNED, priceJSON)

    } catch(e) {
      console.log(e)
    }
  }

  _getUSDPrices = async () => {
    try {
      const url = 'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin,dai,true-usd,tether,usd-coin,chainlink,yearn-finance,binance-usd,wrapped-bitcoin,ethereum,nusd,chainlink,aave-link,lp-sbtc-curve,lp-bcurve,curve-fi-ydai-yusdc-yusdt-ytusd&vs_currencies=usd,eth'
      const priceString = await rp(url);
      const priceJSON = JSON.parse(priceString)

      return priceJSON
    } catch(e) {
      console.log(e)
      return null
    }
  }

  _getGasPrice = async () => {
    try {
      const url = 'https://gasprice.poa.network/'
      const priceString = await rp(url);
      const priceJSON = JSON.parse(priceString)
      if(priceJSON) {
        return priceJSON.fast.toFixed(0)
      }
      return store.getStore('universalGasPrice')
    } catch(e) {
      console.log(e)
      return store.getStore('universalGasPrice')
    }
  }

  _getWeb3Provider = async () => {
    const web3context = store.getStore('web3context')
    if(!web3context) {
      return null
    }
    const provider = web3context.library.provider
    if(!provider) {
      return null
    }

    const web3 = new Web3(provider);

    // const web3 = createAlchemyWeb3(config.infuraProvider, { writeProvider: provider });

    return web3
  }

  getWeightOfBalances = async (payload) => {
    const account = store.getStore('account')

    const assets = store.getStore('assets')

    if(!account || !account.address) {
      return false
    }

    const web3 = await this._getWeb3Provider();


  }

  getloadTokenList = async (payload) => {
    const url = "https://wispy-bird-88a7.uniswap.workers.dev/?url=http://tokens.1inch.eth.link"
    const res = await rp(url);
    const jsonRes = await JSON.parse(res)
    var tokens = Array.from(jsonRes.tokens)
    var tokens = tokens.map(item => {
      const container = {}
      container.address = item.address
      container.decimals = item.decimals
      container.symbol = item.symbol
      container.iconUrl = item.logoURI
      return container
    })
    // console.log(tokens)
    
    var eth = {
      address: "0x0000000000000000000000000000000000000000",
      symbol: "ETH",
      decimals: 18,
      iconUrl: "https://tokens.1inch.exchange/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png"
    }
    
    tokens.push(eth)
    let dashboard = {
      tokenList: tokens
    }
    store.setStore({ tokenDashboard: dashboard })
    emitter.emit(TOEKEN_DASHBOARD_SNAPSHOT_RETURNED, dashboard)
  }
}

var store = new Store();

export default {
  store: store,
  dispatcher: dispatcher,
  emitter: emitter
};
