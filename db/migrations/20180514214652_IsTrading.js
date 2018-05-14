exports.up = function create( knex, Promise ) {
  return Promise.all( [
    knex.schema.table( 'coins', ( table ) => {
      table.boolean( 'IsTrading' );
    } ),
  ] );
};

exports.down = function drop( knex, Promise ) {
  return Promise.all( [
    knex.schema.table( 'coins', ( table ) => {
      table.dropColumn( 'IsTrading' );
    } ),
  ] );
};

