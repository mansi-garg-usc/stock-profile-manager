class ApiKeyRotator {
  private apiKeys: string[];
  private currentIndex: number = 0;

  constructor(apiKeys: string[]) {
    if (apiKeys.length === 0) {
      throw new Error('ApiKeyRotator requires at least one API key');
    }
    this.apiKeys = apiKeys;
  }

  // Get the next API key in the rotation
  getNextKey(): string {
    const key = this.apiKeys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.apiKeys.length;
    return key;
  }
}

import cors from 'cors';
import express, { Request, Response } from 'express';
import path from 'path';
import axios from 'axios';
// const axios = require('axios');
import { MongoClient, ServerApiVersion } from 'mongodb';
// const { MongoClient, ServerApiVersion } = require('mongodb');
// Replace the placeholder with your Atlas connection string

const uri =
  'mongodb+srv://mansi:zkHDQ2TIRLMdPZlY@firstcluster.ard0ayc.mongodb.net/';
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    // useUnifiedTopology: true,
  },
});

// const db = client.db('stockprofilemanager');
// const watchlist = db.collection('watchlist');
// const portfolio = db.collection('portfolio');
let db;
let watchlist: any;
let portfolio: any;
let wallet: any;

const app = express();
const finnhub_api_key = 'cnih581r01qj1g5q4jlgcnih581r01qj1g5q4jm0';
const polygon_api_key = 'fP1uPp6FRhYiEw1L7u9Z_XcgMoQDkuFc';
const port = process.env['PORT'] || 8000;
app.set('trust proxy', true);

let dateToday = formatDate(new Date());

let previousDate = new Date();
previousDate.setMonth(previousDate.getMonth() - 6);
previousDate.setDate(previousDate.getDate() - 1);

let previousYear = new Date();
previousYear.setMonth(previousYear.getMonth() - 24);
previousYear.setDate(previousYear.getDate() - 1);

let previousDateValue = formatDate(previousDate);
let previousYearValue = formatDate(previousYear);

function formatDate(dateToBeFormatted: Date) {
  const year = dateToBeFormatted.getFullYear();
  const month = (dateToBeFormatted.getMonth() + 1).toString().padStart(2, '0');
  const day = dateToBeFormatted.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function startServer() {
  const apiKeys = [
    'fP1uPp6FRhYiEw1L7u9Z_XcgMoQDkuFc',
    'PWkaPl2Z5G3CNFVY9qr7sivNGZyEKEAY',
    'AnjpX_saVqazmlRPU7qYBGJCSJuuwNb8',
  ]; // Replace these with your actual API keys
  const apiKeyRotator = new ApiKeyRotator(apiKeys);
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');

    // Initialize your DB and collections
    db = client.db('stockprofilemanager');
    watchlist = db.collection('watchlist');
    portfolio = db.collection('portfolio');
    wallet = db.collection('wallet');

    // Middleware
    app.use(cors());
    // app.use(
    //   express.static(path.join(__dirname, '../dist/stock-portfolio-manager'))
    // );
    app.use(
      express.static(
        path.join(__dirname, 'dist/stock-portfolio-manager/browser')
      )
    );
    app.get('/', (req, res) => {
      res.sendFile(
        path.join(__dirname, 'dist/stock-portfolio-manager/browser/index.html')
      );
    });
    app.get('/api', (req, res) => {
      res.json({ message: 'API Response' });
    });

    // Company profile
    app.get('/api/company', async (req, res) => {
      const tickerSymbol = req.query['symbol'];
      const apiKey = finnhub_api_key;

      try {
        const finnhubResponse = await axios.get(
          `https://finnhub.io/api/v1/stock/profile2`,
          {
            params: {
              symbol: tickerSymbol,
              token: apiKey,
            },
          }
        );
        res.json(finnhubResponse.data);
      } catch (error) {
        res.status(500).send(`Error retrieving company profile - ${error}`);
      }
    });
    // Company's latest stock price
    app.get('/api/latestPrice', async (req, res) => {
      const tickerSymbol = req.query['symbol'];
      const apiKey = finnhub_api_key;

      try {
        const finnhubResponse = await axios.get(
          `https://finnhub.io/api/v1/quote`,
          {
            params: {
              symbol: tickerSymbol,
              token: apiKey,
            },
          }
        );
        res.json(finnhubResponse.data);
      } catch (error) {
        res.status(500).send(`Error retrieving latest price - ${error}`);
      }
    });

    app.get('/api/history', async (req, res) => {
      let fromDate = req.query['fromDate'];
      let toDate = req.query['toDate'];
      let tickerSymbol = String(req.query['symbol']).toUpperCase();
      let api_key = apiKeyRotator.getNextKey();
      const url = `https://api.polygon.io/v2/aggs/ticker/${tickerSymbol}/range/1/day/${fromDate}/${toDate}?adjusted=true&sort=asc&apiKey=${api_key}`;

      console.log('Requesting URL:', url); // Log the URL being requested

      await axios
        .get(url)
        .then((response: any) => {
          res.json(response.data);
          console.log('fromDate:', fromDate);
          console.log('toDate:', toDate);
          console.log('History Data:', response.data);
        })
        .catch((error: any) => {
          console.error('Axios Error:', error.message); // Log detailed error message
          res.status(500).send(`Error retrieving history - ${error.message}`);
        });
    });

    // Company's hourly highcharts
    app.get('/api/highchartsHourly', async (req, res) => {
      const stockTicker = req.query['symbol'];
      const fromDate = req.query['fromDate'];
      const toDate = req.query['toDate'];
      const highchartsAPI = polygon_api_key;

      let api_key = apiKeyRotator.getNextKey();
      try {
        const url = `https://api.polygon.io/v2/aggs/ticker/${stockTicker}/range/1/hour/${fromDate}/${toDate}?adjusted=true&sort=asc&apiKey=${api_key}`;
        const polygonResponse = await axios.get(url);
        console.log('Stock Ticker:', stockTicker);
        console.log('polygonkey:', highchartsAPI);
        console.log('fromDate:', fromDate);
        console.log('toDate:', toDate);
        console.log('History Data:', polygonResponse.data);
        res.json(polygonResponse.data);
      } catch (error) {
        console.error('Error retrieving hourly highcharts:', error);
        res.status(500).send(`Error retrieving hourly highcharts - ${error}`);
      }
    });

    // Companies recommendation trends
    app.get('/api/recommendationTrends', async (req, res) => {
      const tickerSymbol = req.query['symbol'];
      const apiKey = finnhub_api_key;

      try {
        const finnhubResponse = await axios.get(
          `https://finnhub.io/api/v1/stock/recommendation`,
          {
            params: {
              symbol: tickerSymbol,
              token: apiKey,
            },
          }
        );
        res.json(finnhubResponse.data);
      } catch (error) {
        res
          .status(500)
          .send(`Error retrieving recommendation trends - ${error}`);
      }
    });

    // Company's Peers
    app.get('/api/peers', async (req, res) => {
      const tickerSymbol = req.query['symbol'];
      const apiKey = finnhub_api_key;

      try {
        const finnhubResponse = await axios.get(
          `https://finnhub.io/api/v1/stock/peers`,
          {
            params: {
              symbol: tickerSymbol,
              token: apiKey,
            },
          }
        );
        res.json(finnhubResponse.data);
      } catch (error) {
        res.status(500).send(`Error retrieving peers - ${error}`);
      }
    });

    // Company's Earnings
    app.get('/api/earnings', async (req, res) => {
      const tickerSymbol = req.query['symbol'];
      const apiKey = finnhub_api_key;
      try {
        const finnhubResponse = await axios.get(
          `https://finnhub.io/api/v1/stock/earnings`,
          {
            params: {
              symbol: tickerSymbol,
              token: apiKey,
            },
          }
        );
        res.json(finnhubResponse.data);
      } catch (error) {
        res.status(500).send(`Error retrieving earnings - ${error}`);
      }
    });

    // Company's insider sentiment
    app.get('/api/insiderSentiment', async (req, res) => {
      const tickerSymbol = req.query['symbol'];
      const apiKey = finnhub_api_key;
      const fromDate = '2022-01-01';
      try {
        const finnhubResponse = await axios.get(
          `https://finnhub.io/api/v1/stock/insider-sentiment`,
          {
            params: {
              symbol: tickerSymbol,
              from: fromDate,
              token: apiKey,
            },
          }
        );
        res.json(finnhubResponse.data);
      } catch (error) {
        res.status(500).send(`Error retrieving insider sentiment - ${error}`);
      }
    });

    // Company's news
    const today = new Date();
    // const toDate = today.toISOString().split('T')[0];
    // const fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    // .toISOString()
    // .split('T')[0];
    app.get('/api/news', async (req, res) => {
      const tickerSymbol = req.query['symbol'];
      const fromDate = req.query['fromDate'];
      const toDate = req.query['toDate'];
      const apiKey = finnhub_api_key;
      try {
        const finnhubResponse = await axios.get(
          `https://finnhub.io/api/v1/company-news`,
          {
            params: {
              symbol: tickerSymbol,
              from: fromDate,
              to: toDate,
              token: apiKey,
            },
          }
        );
        res.json(finnhubResponse.data);
        // console.log('News Data:', finnhubResponse.data);
        // console.log('Previous Date:', previousDate);
        // console.log('Today:', dateToday);
      } catch (error) {
        res.status(500).send(`Error retrieving news - ${error}`);
      }
    });

    // Company's highcharts
    app.get('/api/highcharts', async (req, res) => {
      const tickerSymbol = req.query['symbol'];
      const apiKey = polygon_api_key;
      const fromDate = calculateFromDate();
      const toDate = getCurrentDate();
      let api_key = apiKeyRotator.getNextKey();
      try {
        console.log();
        const url = `https://api.polygon.io/v2/aggs/ticker/${tickerSymbol}/range/1/day/${fromDate}/${toDate}?adjusted=true&sort=asc&apiKey=${api_key}`;
        const polygonResponse = await axios.get(url);
        res.json(polygonResponse.data);
      } catch (error) {
        res.status(500).send(`Error retrieving highcharts - ${error}`);
      }
    });

    // Calculate the date six months, one day ago
    function calculateFromDate() {
      const today = new Date();
      const sixMonthsAgo = new Date(
        today.getFullYear(),
        today.getMonth() - 6,
        today.getDate() - 1
      );
      return sixMonthsAgo.toISOString().split('T')[0];
    }

    // Calculate the current date
    function getCurrentDate() {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }

    // Autocomplete search
    app.get('/api/search', async (req, res) => {
      const query = req.query['searchString'];
      const apiKey = finnhub_api_key;
      try {
        const finnhubResponse = await axios.get(
          `https://finnhub.io/api/v1/search`,
          {
            params: {
              q: query,
              token: apiKey,
            },
          }
        );
        res.json(finnhubResponse.data.result);
      } catch (error) {
        res.status(500).send(`Error retrieving search results - ${error}`);
      }
    });

    app.get('/api/addwatchlist', async (req, res) => {
      const tickerSymbol = req.query['symbol'];
      //const apiKey = finnhub_api_key;
      try {
        // await client.connect();
        const session = client.startSession();
        const watchlistResponse = await watchlist.insertOne({
          symbol: tickerSymbol,
        });
        console.log('Added to watchlist:', watchlistResponse);
        const watchlistData = await watchlist.find({}).toArray();
        res.json(watchlistData);
        await session.endSession();
        // client.close();
      } catch (error) {
        res.status(500).send(`Error adding to watchlist - ${error}`);
      }
    });

    app.get('/api/getwatchlist', async (req, res) => {
      try {
        // await client.connect();
        const session = client.startSession();
        const watchlistData = await watchlist.find({}).toArray();
        res.json(watchlistData);
        console.log('Watchlist Data:', watchlistData);
        await session.endSession();
        // client.close();
      } catch (error) {
        res.status(500).send(`Error retrieving watchlist - ${error}`);
      }
    });

    app.get('/api/removewatchlist', async (req, res) => {
      const tickerSymbol = req.query['symbol'];
      try {
        // await client.connect();
        const session = client.startSession();
        const watchlistResponse = await watchlist.deleteOne({
          symbol: tickerSymbol,
        });
        console.log('Removed from watchlist:', watchlistResponse);
        const watchlistData = await watchlist.find({}).toArray();
        res.json(watchlistData);
        await session.endSession();
        // client.close();
      } catch (error) {
        res.status(500).send(`Error removing from watchlist - ${error}`);
      }
    });

    app.get('/api/addportfoliorecord', async (req, res) => {
      try {
        // await client.connect();
        const session = client.startSession();
        const portfolioResponse = await portfolio.insertOne({
          stocksymbol: req.query['symbol'],
          quantity: req.query['stockquantity'],
          cost: req.query['price'],
        });
        console.log('Added to portfolio:', portfolioResponse);
        const portfolioData = await portfolio.find({}).toArray();
        res.json(portfolioData);
        await session.endSession();
        // client.close();
      } catch (error) {
        res.status(500).send(`Error adding to portfolio - ${error}`);
      }
    });

    app.get('/api/getportfolio', async (req, res) => {
      try {
        // await client.connect();
        const session = client.startSession();
        const portfolioData = await portfolio.find({}).toArray();
        res.json(portfolioData);
        console.log('Portfolio Data:', portfolioData);
        await session.endSession();
        // client.close();
      } catch (error) {
        res.status(500).send(`Error retrieving portfolio - ${error}`);
      }
    });

    app.get('/api/removeportfoliorecord', async (req, res) => {
      try {
        const tickerSymbol = req.query['symbol'];
        // await client.connect();
        const session = client.startSession();
        const portfolioResponse = await portfolio.deleteOne({
          stocksymbol: tickerSymbol,
        });
        console.log('Removed from portfolio:', portfolioResponse);
        const portfolioData = await portfolio.find({}).toArray();
        res.json(portfolioData);
        await session.endSession();
        // client.close();
      } catch (error) {
        res.status(500).send(`Error removing from portfolio - ${error}`);
      }
    });

    app.get('/api/updateportfoliorecord', async (req, res) => {
      try {
        const tickerSymbol = req.query['symbol'];
        const quantity = req.query['stockquantity'];
        const cost = req.query['price'];
        // await client.connect();
        const session = client.startSession();
        const portfolioResponse = await portfolio.updateOne(
          { stocksymbol: tickerSymbol },
          { $set: { quantity: quantity, cost: cost } }
        );
        console.log('Updated portfolio:', portfolioResponse);
        const portfolioData = await portfolio.find({}).toArray();
        res.json(portfolioData);
        await session.endSession();
        // client.close();
      } catch (error) {
        res.status(500).send(`Error updating portfolio - ${error}`);
      }
    });

    app.get('/api/setwalletmoney', async (req, res) => {
      try {
        const updatedAmount = req.query['updatedAmount'];
        // await client.connect();
        const session = client.startSession();
        const walletResponse = await wallet.updateOne(
          { key: 'key_wallet' },
          { $set: { walletmoney: Number(updatedAmount) } },
          { upsert: true }
        );
        console.log('Updated wallet:', walletResponse);
        const walletMoney = await wallet.find({}).toArray();
        res.json(walletMoney);
        await session.endSession();
        // client.close();
      } catch (error) {
        res.status(500).send(`Error updating wallet - ${error}`);
      }
    });

    app.get('/api/getwalletmoney', async (req, res) => {
      try {
        // await client.connect();
        const session = client.startSession();
        const walletMoney = await wallet.find({}).toArray();
        res.json(walletMoney);
        console.log('Wallet Money:', walletMoney);
        await session.endSession();
        // client.close();
      } catch (error) {
        res.status(500).send(`Error retrieving wallet - ${error}`);
      }
    });

    // app.use(cors());
    // app.use(
    //   express.static(path.join(__dirname, '../dist/stock-portfolio-manager'))
    // );

    app.get('*', (req, res) => {
      res.sendFile(
        path.join(__dirname, 'dist/stock-portfolio-manager/browser/index.html')
      );
    });

    // Start the Express server
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1); // Exit the process with an error code (1) in case of a connection failure
  }
}

startServer();
