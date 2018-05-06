const express = require( 'express' );

const ENV = process.env.ENV || 'development';

const bodyParser = require( 'body-parser' );
const bcrypt = require( 'bcrypt' );

const app = express();

const PORT = process.env.PORT || 8080; // default port 8080

const knexConfig = require( './knexfile' );
const knex = require( 'knex' )( knexConfig[ENV] );
const rp = require( 'request-promise' );

app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );

// Middleware to update coin list:
const updateCoinList = ( req, res, next ) => {
  rp( 'https://www.cryptocompare.com/api/data/coinlist/' )
    .then( ( result ) => {
      const data = JSON.parse( result ).Data;
      const values = Object.values( data );

      values.forEach( ( coin ) => {
        coin.TotalCoinsFreeFloat = 0;
        coin.TotalCoinSupply = 0;
      } );
      knex( 'coins' )
        .insert( values )
        .then( ( err ) => {
          console.log( err );
        } );
    } );
  next();
};

app.use( updateCoinList );
// Selects all symbols a user has purchased
// to do query all user transactions manually calculate profit/loss swell as total coin holdings create and send in json res.json
app.get( '/api/:users_id', ( req, res ) => {
  knex.select().from( 'transactions' )
    .where( { users_id: req.params.users_id } )
    .then( ( result ) => {
      res.send( result );
    } );
} );

// { id: 2, symbol: 'BTC', price: 10.8, amount: 1, users_id: 2 }
// Selects a specific transaction
app.get( '/api/transactions/:transaction_id', ( req, res ) => {
  const transaction_id = req.params.transaction_id;
  knex.select().from( 'transactions' )
    .where( { id: transaction_id } )
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
      rp( `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD` )
        .then( ( singleCoinData ) => {
          const currentPrice = JSON.parse( singleCoinData ).USD;
          const currentWorth = currentPrice * amount;
          const profit = ( currentWorth - transactionCost ) / transactionCost * 100;
          userTransaction.currentWorth = currentWorth;
          userTransaction.profit = profit;
          return userTransaction;
        } ).then( ( userTransactionWithProfit ) => {
          res.send( userTransactionWithProfit );
        } );
    } );
} );

// Selects all transactions of a user of a certain symbol
app.get( '/api/:users_id/transactions/:symbol', ( req, res ) => {
  knex.select().from( 'transactions' ).where( { symbol: req.params.symbol, users_id: req.params.users_id } )
    .then( ( result ) => {
      res.send( result );
    } );
} );

// how to make the portfolio calcs

// use postman to send json
app.post( '/api/transactions/:users_id', ( req, res ) => {
  // knex.insert( req.body ).into( 'transactions' );
  res.json( req.body );
} );

// knex( 'option' ).insert( { title, description, poll_id: id[0] } );

app.post( '/api/register', ( req, res ) => {
  const body = JSON.parse( req.body[Object.keys( req.body )[0]] );
  const newEmail = body.email;
  const newName = body.name;
  const hashedPassword = bcrypt.hashSync( body.password, 10 );
  const userObj = { email: newEmail, name: newName, password: hashedPassword };
  knex( 'users' ).insert( userObj )
    .then( ( err ) => {
      console.log( err );
    } ).catch( ( err ) => {
      res.status( 422 ).send( { error: '=' } );
      console.log( err );
    } );
} );

// Listens on port
app.listen( PORT, () => {
  console.log( `Example app listening on port ${PORT}!` );
} );
