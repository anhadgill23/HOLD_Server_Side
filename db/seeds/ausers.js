exports.seed = function create( knex, Promise ) {
  // Deletes ALL existing entries
  return knex( 'users' ).del()
    .then( () =>
      // Inserts seed entries
      knex( 'users' ).insert( [
        { name: 'test', email: 'test@test.com', password: 'rowValue1' },
        { name: 'bob', email: 'bob@bob.bob', password: 'rowValue2' },
      ] ) );
};
