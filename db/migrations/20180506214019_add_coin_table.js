exports.up = function create( knex, Promise ) {
  return Promise.all( [
    knex.schema.createTable( 'coins', ( table ) => {
      table.increments();
      table.string( 'Id' ).unique();
      table.string( 'Url' );
      table.string( 'ImageUrl' );
      table.string( 'Name' );
      table.string( 'Symbol' );
      table.string( 'CoinName' );
      table.string( 'FullName' );
      table.string( 'Algorithm' );
      table.string( 'ProofType' );
      table.string( 'FullyPremined' );
      table.float( 'TotalCoinSupply' );
      table.string( 'PreMinedValue' );
      table.bigint( 'TotalCoinsFreeFloat' );
      table.integer( 'SortOrder' );
      table.boolean( 'Sponsored' );
    } ),
  ] );
};
exports.down = function drop( knex, Promise ) {
  return Promise.all( [
    knex.schema.dropTable( 'coins' ),
  ] );
};

