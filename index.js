const Web3 = require('web3');
const axios = require('axios');
const express = require('express');
const app = express();

// Connect to Ethereum network via Infura
const web3 = new Web3.default('https://mainnet.infura.io/v3/fb9c0e584ef64ce9a2f2c2685f47afeb');

// Uniswap V2 Pair ABI
const uniswapPairAbi = [{"constant":true,"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"_reserve0","type":"uint112"},{"internalType":"uint112","name":"_reserve1","type":"uint112"},{"internalType":"uint32","name":"_blockTimestampLast","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"}];

app.get('/price/:pairAddress', (req, res) => {
  // Create new contract instance with provided pair address
  const pairContract = new web3.eth.Contract(uniswapPairAbi, req.params.pairAddress);

  // Fetch ETH/USD and BTC/USD from CoinGecko API
  axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd').then(response => {
    let ethUsd = response.data.ethereum.usd;
    let btcUsd = response.data.bitcoin.usd;

    pairContract.methods.getReserves().call().then(reserves => {
      // Convert BigInts to regular numbers. Note the precision may be lost.
      let uniReserve = Number(reserves._reserve0);
      let ethReserve = Number(reserves._reserve1);

      // Calculate the price of UNI in ETH
      let uniPriceInEth = ethReserve / uniReserve;
      
      // Convert ETH price to USD and BTC
      let uniPriceInUsd = uniPriceInEth * ethUsd;
      let uniPriceInBtc = uniPriceInUsd / btcUsd;

      res.json({
        priceInEth: uniPriceInEth,
        priceInUsd: uniPriceInUsd,
        priceInBtc: uniPriceInBtc
      });
    }).catch(error => {
      console.error(error);
      res.status(500).send('Error fetching reserves.');
    });
  }).catch(error => {
    console.error(error);
    res.status(500).send('Error fetching exchange rates.');
  });
});

app.listen(3000, () => console.log('Server running on port 3000'));
