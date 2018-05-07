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
            .then( ( result ) => {
            } );
        } );
      next();
    } );
};

app.use( updateCoinList );
// Selects all symbols a user has purchased
app.get( '/api/:users_id', ( req, res ) => {
  // 1.  Query DB for all unique coins
  knex.select( 'symbol' )
    .from( 'transactions' )
    .where( 'users_id', req.params.users_id )
    .groupBy( 'symbol' )
    .then( ( result ) => {
      // 2.  Make API call for current prices for all coins
      let apiUrl = 'https://min-api.cryptocompare.com/data/pricemulti?fsyms=';
      const urlTo = '&tsyms=USD';
      result.forEach( ( resultObj ) => {
        apiUrl = `${apiUrl + resultObj.symbol},`;
      } );
      apiUrl += urlTo;
      return apiUrl;
    } )
    .then( ( apiUrl ) => {
      rp( apiUrl )
        .then( ( apiResult ) => {
          // 3.  Query DB for values
          const query = `${'SELECT'
            + ' symbol,'
            + 'COALESCE(sum(CASE WHEN buy = TRUE THEN (price * amount) END),0) AS buy,'
            + 'COALESCE(sum(CASE WHEN buy = FALSE THEN (price * amount) END),0) as sell,'
            + '(sum(CASE WHEN buy = TRUE THEN (amount) END) - COALESCE(sum(CASE WHEN buy = FALSE THEN (amount) END),0)) as remaining'

            + ' FROM transactions'
            + ' WHERE users_id = '}${req.params.users_id
          } GROUP BY symbol;`;
          knex.raw( query )
            .then( ( portfolioQueryResult ) => {
              const parsedApiResult = JSON.parse( apiResult );
              const data = [];
              portfolioQueryResult.rows.forEach( ( currency ) => {
                const { symbol, remaining } = currency;
                const currentPrice = parsedApiResult[symbol].USD;
                const currentValue = currentPrice * currency.remaining;
                const originalValue = currency.buy - currency.sell;
                const gain = currentValue - originalValue;
                const percentageGain = ( gain - originalValue ) / originalValue / 0.01;
                const dataObj = {
                  symbol,
                  remaining: roundNumber( remaining, 4 ),
                  currentValue,
                  originalValue,
                  gain,
                  percentageGain,
                };

                // round values
                Object.entries( dataObj ).forEach( ( pair ) => {
                  if ( typeof pair[1] === 'number' && pair[0] !== 'amount' ) {
                    dataObj[pair[0]] = roundNumber( pair[1], 2 );
                  }
                } );
                data.push( dataObj );
              } );
              res.send( data );
            } );
        } );
    } );


  // 4.  Calculate current values for display
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
          id,
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
            id,
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
            if ( typeof pair[1] === 'number' && pair[0] !== 'amount' && pair[0] !== 'id' ) {
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
