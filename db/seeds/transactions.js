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
          imageUrl: 'https://www.cryptocompare.com/media/19633/btc.png',
        },
        {
          users_id: 2,
          symbol: 'BTC',
          amount: 1.0,
          price: 10.8,
          imageUrl: 'https://www.cryptocompare.com/media/19633/btc.png',
        },
        {
          users_id: 2,
          symbol: 'BTC',
          amount: -5.5,
          price: 10.8,
          imageUrl: 'https://www.cryptocompare.com/media/19633/btc.png',
        },
        {
          users_id: 2,
          symbol: 'ETH',
          amount: 100,
          price: 12,
          imageUrl: 'https://www.cryptocompare.com/media/19782/litecoin-logo.png',
        }, {
          users_id: 1,
          symbol: 'LTC',
          amount: 5,
          price: 55.8,
          imageUrl: 'https://www.cryptocompare.com/media/19782/litecoin-logo.png',
        },
        {
          users_id: 1,
          symbol: 'LTC',
          amount: 18,
          price: 110,
          imageUrl: 'https://www.cryptocompare.com/media/19782/litecoin-logo.png',
        },
        {
          users_id: 1,
          symbol: 'ETH',
          amount: 100,
          price: 12,
          imageUrl: 'https://www.cryptocompare.com/media/20646/eth_logo.png',
        },
      ] ) );
};
