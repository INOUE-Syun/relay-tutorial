import Relay from 'react-relay';

// Writing the game
// Let's tweak the file ./js/routes/AppHomeRoute.js
// to anchor our game to the game root field of the schema:

export default class extends Relay.Route {
  static queries = {
    game: () => Relay.QL`
      query {
        game
      }
    `,
  };
  static routeName = 'AppHomeRoute';
}
