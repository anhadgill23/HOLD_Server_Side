const express = require( 'express' );

// const ENV = process.env.ENV || 'development';

const app = express();

const PORT = process.env.PORT || 8080; // default port 8080

// const knexConfig = require( './knexfile' );
// const knex = require( 'knex' )( knexConfig[ENV] );

// const knexLogger = require( 'knex-logger' );

// const pollRoutes = require( './routes/polls' );

app.get( '/api/urls', ( req, res ) => {
  res.send( {
    status: 'We are now connected to the back end Express server.',
  } );
} );

// Listens on port
app.listen( PORT, () => {
  console.log( `Example app listening on port ${PORT}!` );
} );
