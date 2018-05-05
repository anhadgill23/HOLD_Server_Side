exports.up = function create( knex, Promise ) {
  return Promise.all( [
    knex.schema.createTable( 'transactions', ( table ) => {
      table.increments();
      table.string( 'symbol' );
      table.float( 'price', 20, 8 );
      table.float( 'amount', 20, 8 );
      table.integer( 'users_id' ).references( 'id' );
    } ),
  ] );
};
exports.down = function drop( knex, Promise ) {
  return Promise.all( [
    knex.schema.dropTable( 'transactions' ),
  ] );
};
