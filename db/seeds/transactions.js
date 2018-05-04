exports.seed = function create( knex, Promise ) {
  return knex( 'transactions' ).del()
    .then( () => Promise.all( [
      knex( 'transactions' ).insert( {
        id: 1, coin: 'BTC', cost: 100.01, amount: 10, type: 'BUY', user_id: 1,
      } ),
      knex( 'transactions' ).insert( {
        id: 2, coin: 'BTC', cost: 1000, amount: 3, type: 'SELL', user_id: 1,
      } ),
      knex( 'transactions' ).insert( {
        id: 3, coin: 'ETH', cost: 50, amount: 10, type: 'BUY', user_id: 1,
      } ),
    ] ) );
};
