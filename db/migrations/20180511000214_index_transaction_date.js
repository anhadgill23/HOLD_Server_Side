exports.up = function create( knex, Promise ) {
  return Promise.all( [
    knex.schema.table( 'transactions', ( table ) => {
      table.timestamp( 'created_at' ).defaultTo( knex.fn.now() );
    } ),
  ] );
};

exports.down = function drop( knex, Promise ) {
  return Promise.all( [
    knex.schema.table( 'transactions', ( table ) => {
      table.dropColumn( 'created_at' );
    } ),
  ] );
};
