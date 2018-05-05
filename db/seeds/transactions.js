exports.seed = function create( knex, Promise ) {
  // Deletes ALL existing entries
  return knex( 'transactions' ).del()
    .then( () =>
      // Inserts seed entries
      knex( 'transactions' ).insert( [
        {
          users_id: 2,
          symbol: 'BTC',
          amount: 10.0,
          price: 128.8,
        },
        {
          users_id: 2,
          symbol: 'BTC',
          amount: 1.0,
          price: 10.8,
        },
        {
          users_id: 2,
          symbol: 'BTC',
          amount: -5.5,
          price: 10.8,
        },
        {
          users_id: 2,
          symbol: 'ETH',
          amount: 100,
          price: 12,
        }, {
          users_id: 1,
          symbol: 'LTC',
          amount: 5,
          price: 55.8,
        },
        {
          users_id: 1,
          symbol: 'LTC',
          amount: 18,
          price: 110,
        },
        {
          users_id: 1,
          symbol: 'ETH',
          amount: 100,
          price: 12,
        },
      ] ) );
};
