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

const roundNumber = ( num, places ) => ( Math.round( num * 100 ) / 100 ).toFixed( places );

// Middleware to update coin list:
const updateCoinList = ( req, res, next ) => {
  knex( 'coins' )
    .del()
    .whereNotNull( 'Id' ).then( () => {
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
    } );
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
app.get( '/api/transactions/:transactionId', ( req, res ) => {
  const { transactionId } = req.params;
  knex.select().from( 'transactions' )
    .where( { id: transactionId } )
    .then( result => result[0] )
    .then( ( transaction ) => {
      const
        {
          symbol,
          image_url,
          price,
          amount,
          buy,
        } = transaction;

      rp( `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD` )
        .then( ( singleCoinData ) => {
          const tradingPair = `${symbol}/USD`;
          const transactionCost = amount * price;
          const currentPrice = JSON.parse( singleCoinData ).USD;
          const currentWorth = currentPrice * amount;
          const profit = ( currentWorth - transactionCost ) / transactionCost / 0.01;

          const userTransaction = {
            symbol,
            price,
            tradingPair,
            amount: roundNumber( amount, 4 ),
            transactionCost,
            image_url,
            currentWorth,
            profit,
            buy,
          };
          // If object field is a number, round it for display
          Object.entries( userTransaction ).forEach( ( pair ) => {
            if ( typeof pair[1] === 'number' && pair[0] !== 'amount' ) {
              userTransaction[pair[0]] = roundNumber( pair[1], 2 );
            }
          } );

          res.send( userTransaction );
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
  // Need to query database for coin image URL before inserting
  // TODO use promise to make sure database access happens synchronously
  // knex.insert( req.body ).into( 'transactions' );
  res.json( req.body );
} );

// knex( 'option' ).insert( { title, description, poll_id: id[0] } );


app.post( '/api/register', ( req, res ) => {
  console.log(req.body);
  const body = req.body; //JSON.parse( req.body[Object.keys( req.body )[0]] );
  const newEmail = body.email.toLowerCase();
  const newName = body.name;
  const hashedPassword = bcrypt.hashSync( body.password, 10 );
  const userObj = { email: newEmail, name: newName, password: hashedPassword };

  knex( 'users' )
    .where( 'email', newEmail )
    .then( ( results ) => {
      if(results.length === 0) {
        return knex( 'users' ).insert( userObj ).returning('*');
      }
      return Promise.reject('Email already taken')
    })
    .then(user => {
      res.status(201).json(user);
    })
    .catch( ( err ) => {
      res.status(409).send( { error: '=' } );
    });
});

app.post( '/api/login', ( req, res ) => {
  const {email, password} = req.body;
  console.log(req.body);
  knex.select().from( 'users' )
    .where( 'email', email )
    .then( ( result ) => {
      console.log(result[0]);
      if(result && bcrypt.compareSync(password, result[0].password)) {
        console.log("success!");
        res.send("it worked")
      }
      return Promise.reject('Password incorrect')
    })
    .catch( ( err ) => {
      res.status(404).send( { error: '=' } );
    })

})

// Listens on port
app.listen( PORT, () => {
  console.log( `Example app listening on port ${PORT}!` );
} );
