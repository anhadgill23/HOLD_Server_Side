const express = require( 'express' );

const ENV = process.env.ENV || 'development';
const bodyParser = require( 'body-parser' );
const bcrypt = require( 'bcrypt' );

const app = express();
const PORT = process.env.PORT || 8080; // default port 8080

const knexConfig = require( './knexfile' );
const knex = require( 'knex' )( knexConfig[ENV] );
const rp = require( 'request-promise' );
const cookieSession = require( 'cookie-session' );

app.use( express.static( 'public' ) );
app.use( bodyParser.urlencoded( { extended: true } ) );
app.use( bodyParser.json() );
app.use( cookieSession( {
  name: 'session',
  secret: 'secret',
  maxAge: 24 * 60 * 60 * 1000,
} ) );

const verifyUser = ( req, res, next ) => {
  if ( req.session.id ) {
    next();
  } else {
    res.status( 403 ).send( { error: '=' } );
  }
};

const roundNumber = ( num, places ) => ( Math.round( num * 100 ) / 100 ).toFixed( places );

//* ********************************************
//* ** GET /api/:users_id/transactions ***
//* ** All transactions per user
//* ** This endpoint for the portfolio page
//* ********************************************

app.get( '/api/:users_id/transactions', verifyUser, ( req, res ) => {
  knex.select( 'symbol' )
    .from( 'transactions' )
    .where( 'users_id', req.params.users_id )
    .groupBy( 'symbol' )
    .then( ( result ) => {
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
          const query = `${'SELECT'
            + ' symbol, image_url,'
            + 'COALESCE(sum(CASE WHEN buy = TRUE THEN (price * amount) END),0) AS buy,'
            + 'COALESCE(sum(CASE WHEN buy = FALSE THEN (price * amount) END),0) as sell,'
            + '(sum(CASE WHEN buy = TRUE THEN (amount) END) - COALESCE(sum(CASE WHEN buy = FALSE THEN (amount) END),0)) as remaining'

            + ' FROM transactions'
            + ' WHERE users_id = '}${req.params.users_id
          } GROUP BY symbol, image_url;`;

          knex.raw( query )
            .then( ( portfolioQueryResult ) => {
              const parsedApiResult = JSON.parse( apiResult );
              const data = [];
              portfolioQueryResult.rows.forEach( ( currency ) => {
                const { symbol, remaining, image_url } = currency;
                const currentPrice = parsedApiResult[symbol].USD;
                const currentValue = currentPrice * currency.remaining;
                const originalValue = currency.buy - currency.sell;
                const gain = currentValue - originalValue;
                const percentageGain = ( gain - originalValue ) / originalValue / 0.01;
                const dataObj = {
                  symbol,
                  currentPrice,
                  image_url,
                  remaining: roundNumber( remaining, 4 ),
                  currentValue,
                  originalValue,
                  gain,
                  percentageGain,
                };

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
} );

//* ********************************************
//* ** POST /api/transactions ***
//* ** Inserts transaction into databse
//* ********************************************

app.post( '/api/transactions/', verifyUser, ( req, res ) => {
  const transaction = req.body;
  const { symbol } = transaction;
  knex( 'coins' )
    .where( 'Symbol', symbol )
    .then( results => results[0] )
    .then( ( coinQuery ) => {
      const url = `https://www.cryptocompare.com${coinQuery.ImageUrl}`;
      transaction.image_url = url;
      knex( 'transactions' )
        .returning( 'id' )
        .insert( transaction )
        .then( ( result ) => {
          console.log( 'INSERTED COIN AT', result );
        } );
    } );


  res.send( req.body );
} );

//* ****************************************************
//* ** GET /api/:users_id/transactions/:symbol *********
//* ** Gets all transactions for a given user and symbol
//* ****************************************************

app.get( '/api/:users_id/transactions/:symbol', verifyUser, ( req, res ) => {
  const results = [];
  rp( `https://min-api.cryptocompare.com/data/price?fsym=${req.params.symbol}&tsyms=USD` )
    .then( singleCoinData => singleCoinData )
    .then( ( singleCoinData ) => {
      knex.select().from( 'transactions' ).where( { symbol: req.params.symbol, users_id: req.params.users_id } )
        .then( ( transactions ) => {
          transactions.forEach( ( transaction ) => {
            const
              {
                id,
                symbol,
                image_url,
                price,
                amount,
                buy,
                created_at,
              } = transaction;

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
              created_at,
            };
            Object.entries( userTransaction ).forEach( ( pair ) => {
              if ( typeof pair[1] === 'number' && pair[0] !== 'amount' && pair[0] !== 'id' ) {
                userTransaction[pair[0]] = roundNumber( pair[1], 2 );
              }
            } );
            results.push( userTransaction );
          } );
          res.send( results );
        } )
        .catch( ( err ) => {
          console.log( err );
        } );
    } );
} );

//* ********************************************
//* ** GET /api/transactions/:transactionId ***
//* ** Gets specific transaction
//* ********************************************

app.get( '/api/transactions/:transactionId', verifyUser, ( req, res ) => {
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

//* ********************************************
//* ** POST /api/transactions/:transactionId ***
//* ** Gets specific transaction
//* ********************************************

app.post( '/api/transactions/:transactionId', verifyUser, ( req, res ) => {
  const { transactionId } = req.params;
  knex( 'transactions' )
    .del()
    .where( 'id', transactionId )
    .then( ( ) => {
      res.status( 200 );
    } )
    .catch( ( err ) => {
      console.log( err );
    } );
} );


//* ********************************************
//* ** GET /api/coins ***
//* ** Get coin list
//* ********************************************

app.get( '/api/coins', verifyUser, ( req, res ) => {
  knex( 'coins' )
    .del()
    .whereNotNull( 'id' )
    .then( () => {
      rp( 'https://www.cryptocompare.com/api/data/coinlist/' )
        .then( ( result ) => {
          const data = JSON.parse( result ).Data;
          const values = Object.values( data );

          values.forEach( ( coin ) => {
            coin.TotalCoinsFreeFloat = 0;
            coin.TotalCoinSupply = 0;
          } );
          return values;
        } )
        .then( ( values ) => {
          knex( 'coins' )
            .insert( values )
            .then( ( ) => {
              knex( 'coins' )
                .select( ['Symbol', 'FullName', 'SortOrder'] )
                .orderBy( 'SortOrder', 'asc' )
                .limit( 200 )
                .then( ( coinQueryResult ) => {
                  res.send( coinQueryResult );
                } )
                .catch( ( err ) => {
                  console.log( err );
                } );
            } );
        } );
    } );
} );

//* ********************************************
//* ** POST /api/register ***
//* ** Registers a new user
//* ********************************************


app.post( '/api/register', ( req, res ) => {
  const { body } = req; // JSON.parse( req.body[Object.keys( req.body )[0]] );
  const newEmail = body.email.toLowerCase();
  const newName = body.name;
  const hashedPassword = bcrypt.hashSync( body.password, 10 );
  const userObj = { email: newEmail, name: newName, password: hashedPassword };

  knex( 'users' )
    .where( 'email', newEmail )
    .then( ( results ) => {
      if ( results.length === 0 ) {
        return knex( 'users' ).insert( userObj ).returning( 'id' );
      }
      return Promise.reject( 'Email already taken' );
    } )
    .then( ( id ) => {
      const user = {
        id: id[0], email: newEmail, name: newName, password: hashedPassword,
      };
      req.session.id = id;
      res.status( 201 ).json( user );
    } )
    .catch( ( err ) => {
      res.status( 409 ).send( { err: 'Email already taken' } );
    } );
} );

//* ********************************************
//* ** POST /api/login ***
//* ** Logs user in
//* ********************************************

app.post( '/api/login', ( req, res ) => {
  const { email, password } = req.body;
  knex.select().from( 'users' )
    .where( 'email', email )
    .then( ( result ) => {
      if ( result && bcrypt.compareSync( password, result[0].password ) ) {
        req.session.id = result[0].id;
        return result[0];
      }
      return Promise.reject( 'Password incorrect' );
    } )
    .then( ( user ) => {
      res.status( 201 ).json( user );
    } )
    .catch( ( err ) => {
      res.status( 404 ).send( { err: 'Email or password incorrect' } );
    } );
} );

//* ********************************************
//* ** POST /api/logut ***
//* ** Logs user out
//* ********************************************

app.post( '/api/logout', ( req, res ) => {
  console.log( 'LOG OUT' );
  req.session = null;
  res.status( 201 ).send( 'hello from log out' );
} );

app.listen( PORT, () => {
  console.log( `Example app listening on port ${PORT}!` );
} );
