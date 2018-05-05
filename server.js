const express = require( 'express' );

const ENV = process.env.ENV || 'development';

const bodyParser = require( 'body-parser' );
const bcrypt = require( 'bcrypt' );

const app = express();

const PORT = process.env.PORT || 8080; // default port 8080

const knexConfig = require( './knexfile' );
const knex = require( 'knex' )( knexConfig[ENV] );
const request = require( 'request' );

app.use( bodyParser.urlencoded( { extended: true } ) );

// const knexLogger = require( 'knex-logger' );

// const pollRoutes = require( './routes/polls' );

// Selects all symbols a user has purchased
// to do query all user transactions manually calculate profit/loss swell as total coin holdings create and send in json res.json
app.get( '/:users_id', ( req, res ) => {
  knex.select().from( 'transactions' )
    .where( { users_id: req.params.users_id } )
    .then( ( result ) => {
      res.send( result );
    } );
} );

// { id: 2, symbol: 'BTC', price: 10.8, amount: 1, users_id: 2 }
// Selects a specific transaction
app.get( '/transactions/:transaction_id', ( req, res ) => {
  console.log( req.params.transaction_id );
  const transaction_id = req.params.transaction_id;
  console.log( transaction_id );
  knex.select().from( 'transactions' ).where( { id: transaction_id } )
    .then( result => result )
    .then( ( result ) => {
      const transaction = result[0];
      const symbol = transaction.symbol;
      const buyPrice = transaction.price;
      const tradingPair = `${symbol}/USD`;
      const amount = transaction.amount;
      const transactionCost = amount * buyPrice;
      const userTransaction = {
        symbol, buyPrice, tradingPair, amount, transactionCost,
      };
      console.log( userTransaction );
      request( `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`, ( error, response, body ) => {
        const currentPrice = JSON.parse( body ).USD;
        const currentWorth = currentPrice * amount;
        const profit = ( currentWorth - transactionCost ) / transactionCost;
        userTransaction.currentWorth = currentWorth;
        userTransaction.profit = profit;
        res.json( userTransaction );
      } );
    } );
} );

// Selects all transactions of a user of a certain symbol
app.get( '/:users_id/transactions/:symbol', ( req, res ) => {
  knex.select().from( 'transactions' ).where( { symbol: req.params.symbol, users_id: req.params.users_id } )
    .then( ( result ) => {
      res.send( result );
    } );
} );

// how to make the portfolio calcs

// use postman to send json
app.post( '/transactions/:users_id', ( req, res ) => {
  // knex.insert( req.body ).into( 'transactions' );
  res.json( req.body );
} );

// knex( 'option' ).insert( { title, description, poll_id: id[0] } );

app.post( '/register', ( req, res ) => {
  const body = JSON.parse( req.body.symbol );
  const email = body.email;
  const name = body.name;
  const password = bcrypt.hashSync( body.password, 10 );
  // const userObj = { email, name, password };
  knex( 'users' ).insert( { email, name, password } );
} );

// Listens on port
app.listen( PORT, () => {
  console.log( `Example app listening on port ${PORT}!` );
} );
