exports.up = function create( knex, Promise ) {
  return Promise.all( [
    knex.schema.createTable( 'users', ( table ) => {
      table.increments();
      table.string( 'name' );
      table.string( 'email' );
      table.string( 'password' );
    } ),
  ] );
};
exports.down = function drop( knex, Promise ) {
  return Promise.all( [
    knex.schema.dropTable( 'users' ),
  ] );
};
