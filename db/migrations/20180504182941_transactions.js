exports.up = function create( knex, Promise ) {
  return Promise.all( [
    knex.schema.createTable( 'transactions', ( table ) => {
      table.increments();
      table.date( 'date' );
      table.string( 'coin' );
      table.float( 'cost', 20, 8 );
      table.integer( 'amount' );
      table.string( 'type' );
      table.integer( 'user_id' ).references( 'id' ).inTable( 'users' );
    } ),
  ] );
};
exports.down = function drop( knex, Promise ) {
  return Promise.all( [
    knex.schema.dropTable( 'transactions' ),
  ] );
};
