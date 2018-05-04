exports.seed = function create( knex, Promise ) {
  return knex( 'users' ).del()
    .then( () => Promise.all( [
      knex( 'users' ).insert( {
        id: 1, name: 'Tom', email: 'tom@tom.tom', password: 'password',
      } ),
    ] ) );
};
