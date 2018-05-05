const express = require( 'express' );

const ENV = process.env.ENV || 'development';

const bodyParser = require( 'body-parser' );

const app = express();

const PORT = process.env.PORT || 8080; // default port 8080

const knexConfig = require( './knexfile' );
const knex = require( 'knex' )( knexConfig[ENV] );

app.use( bodyParser.urlencoded( { extended: true } ) );

// const knexLogger = require( 'knex-logger' );

// const pollRoutes = require( './routes/polls' );

// Selects all symbols a user has purchased
// query all user transactions manually calculate profit/loss swell as total coin holdings create and send in json res.json
app.get( '/users_id', ( req, res ) => {
  knex.select().from( 'transactions' )
    .where( { users_id: 2 } )
    .then( ( result ) => {
      res.send( result );
    } );
} );

// Selects all transactions of a user of a certain symbol
app.get( '/users_id/symbol', ( req, res ) => {
  knex.select().from( 'transactions' ).where( { symbol: 'BTC', users_id: 2 } )
    .then( ( result ) => {
      res.send( result );
    } );
} );

// Selects a specific transaction
app.get( '/transactions/transaction_id', ( req, res ) => {
  knex.select().from( 'transactions' ).where( { id: 1 } )
    .then( ( result ) => {
      console.log( result[0].symbol );
    } );
} );

// use postman to send json
app.post( '/transactions/users_id', ( req, res ) => {
  // knex.insert( req.body ).into( 'transactions' );
  res.json( req.body );
} );

// Listens on port
app.listen( PORT, () => {
  console.log( `Example app listening on port ${PORT}!` );
} );
