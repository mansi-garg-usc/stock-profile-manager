import cors from 'cors';
import express, { Request, Response } from 'express';
import path from 'path';
const axios = require('axios');

const { MongoClient, ServerApiVersion } = require('mongodb');
// Replace the placeholder with your Atlas connection string

const uri =
  'mongodb+srv://mansi:zkHDQ2TIRLMdPZlY@firstcluster.ard0ayc.mongodb.net/';
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const db = client.db('stockprofilemanager');
const watchlist = db.collection('watchlist');
const portfolio = db.collection('portfolio');

const app = express();
const finnhub_api_key = 'cnih581r01qj1g5q4jlgcnih581r01qj1g5q4jm0';
const polygon_api_key = 'Veu4EyzzJTduRuvf0Y1woy5mwtn1mMIA';
const port = 8000;

app.use(cors());
app.use(
  express.static(path.join(__dirname, '../dist/stock-portfolio-manager'))
);

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

// app.get('/autocomplete', async (req, res) => {
//   const tickerSymbol = req.query['symbol'] as string;
//   try {
//     const finnhubResponse = await axios.get(
//       `https://finnhub.io/api/v1/search?q=${tickerSymbol.toUpperCase()}`,
//       {
//         params: {
//           token: finnhub_api_key,
//         },
//       }
//     );
//     res.json(finnhubResponse.data);
//   } catch (error) {
//     res.status(500).send(`Error retrieving stock - ${error}`profile');
//   }
// });

// Company's latest stock price
app.get('/api/latestPrice', async (req, res) => {
  const tickerSymbol = req.query['symbol'];
  const apiKey = finnhub_api_key;

  try {
    const finnhubResponse = await axios.get(`https://finnhub.io/api/v1/quote`, {
      params: {
        symbol: tickerSymbol,
        token: apiKey,
      },
    });
    res.json(finnhubResponse.data);
  } catch (error) {
    res.status(500).send(`Error retrieving latest price - ${error}`);
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
    res.status(500).send(`Error retrieving recommendation trends - ${error}`);
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
const toDate = today.toISOString().split('T')[0];
const fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];
app.get('/api/news', async (req, res) => {
  const tickerSymbol = req.query['symbol'];
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
  try {
    const url = `https://api.polygon.io/v2/aggs/ticker/${tickerSymbol}/range/1/day/${fromDate}/${toDate}?adjusted=true&sort=asc&apiKey=${apiKey}`;
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
    await client.connect();
    const watchlistResponse = await watchlist.insertOne({
      symbol: tickerSymbol,
    });
    console.log('Added to watchlist:', watchlistResponse);
    const watchlistData = await watchlist.find({}).toArray();
    res.json(watchlistData);
    client.close();
  } catch (error) {
    res.status(500).send(`Error adding to watchlist - ${error}`);
  }
});

app.get('/api/getwatchlist', async (req, res) => {
  try {
    await client.connect();
    const watchlistData = await watchlist.find({}).toArray();
    res.json(watchlistData);
    console.log('Watchlist Data:', watchlistData);
    client.close();
  } catch (error) {
    res.status(500).send(`Error retrieving watchlist - ${error}`);
  }
});

app.get('/api/removewatchlist', async (req, res) => {
  const tickerSymbol = req.query['symbol'];
  try {
    await client.connect();
    const watchlistResponse = await watchlist.deleteOne({
      symbol: tickerSymbol,
    });
    console.log('Removed from watchlist:', watchlistResponse);
    const watchlistData = await watchlist.find({}).toArray();
    res.json(watchlistData);
    client.close();
  } catch (error) {
    res.status(500).send(`Error removing from watchlist - ${error}`);
  }
});

app.get('/api/addportfoliorecord', async (req, res) => {
  try {
    await client.connect();
    const portfolioResponse = await portfolio.insertOne({
      stocksymbol: req.query['symbol'],
      quantity: req.query['stockquantity'],
      cost: req.query['price'],
    });
    console.log('Added to portfolio:', portfolioResponse);
    const portfolioData = await portfolio.find({}).toArray();
    res.json(portfolioData);
    client.close();
  } catch (error) {
    res.status(500).send(`Error adding to portfolio - ${error}`);
  }
});

app.get('/api/getportfolio', async (req, res) => {
  try {
    await client.connect();
    const portfolioData = await portfolio.find({}).toArray();
    res.json(portfolioData);
    console.log('Portfolio Data:', portfolioData);
    client.close();
  } catch (error) {
    res.status(500).send(`Error retrieving portfolio - ${error}`);
  }
});

app.get('/api/removeportfoliorecord', async (req, res) => {
  try {

  const tickerSymbol = req.query['symbol'];
    await client.connect();
    const portfolioResponse = await portfolio.deleteOne({
      stocksymbol: tickerSymbol,
    });
    console.log('Removed from portfolio:', portfolioResponse);
    const portfolioData = await portfolio.find({}).toArray();
    res.json(portfolioData);
    client.close();
  } catch (error) {
    res.status(500).send(`Error removing from portfolio - ${error}`);
  }
}
);

app.get('/api/updateportfoliorecord', async (req, res) => {
  try {
    const tickerSymbol = req.query['symbol'];
    const quantity = req.query['stockquantity'];
    const cost = req.query['price'];
    await client.connect();
    const portfolioResponse = await portfolio.updateOne(
      { stocksymbol: tickerSymbol },
      { $set: { quantity: quantity, cost: cost } }
    );
    console.log('Updated portfolio:', portfolioResponse);
    const portfolioData = await portfolio.find({}).toArray();
    res.json(portfolioData);
    client.close();
  } catch (error) {
    res.status(500).send(`Error updating portfolio - ${error}`);
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/browser/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/`);
});

// async function run() {
//   // Connect the client to the server (optional starting in v4.7)
//   client.connect().then(() => {
//     client
//       .db('admin')
//       .command({ ping: 1 })
//       .then(() => {
//         console.log(
//           'Pinged your deployment. You successfully connected to MongoDB!'
//         );
//       });
//   });
//   // Send a ping to confirm a successful connection
// }
// run().catch(console.dir);

// const startServer = async () => {
//   try {
//     await client.connect();
//     console.log('Connected to MongoDB');

//     // Add routes that need database connection here, for example:
//     app.get('/api/my-data', async (req, res) => {
//       try {
//         const myCollection = client.db('myDatabaseName').collection('myCollectionName');
//         const myData = await myCollection.find({}).toArray();
//         res.json(myData);
//       } catch (error) {
//         console.error('Database query failed', error);
//         res.status(500).send('Failed to get data');
//       }
//     });

//     // Start the server
//     const port = process.env.PORT || 8000;
//     app.listen(port, () => {
//       console.log(`Server running on http://localhost:${port}`);
//     });
//   } catch (error) {
//     console.error('Failed to connect to MongoDB', error);
//   }
// };
