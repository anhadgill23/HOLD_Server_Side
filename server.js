const express = require( 'express' );

const app = express();

const PORT = process.env.PORT || 8080; // default port 8080

app.get( '/api/urls', ( req, res ) => {
  res.send( {
    status: 'We are now connected to the back end Express server.',
  } );
} );

// Listens on port
app.listen( PORT, () => {
  console.log( `Example app listening on port ${PORT}!` );
} );
