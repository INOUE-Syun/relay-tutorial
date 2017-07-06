import Relay from 'react-relay';

// Next, let's create a file in ./js/mutations/CheckHidingSpotForTreasureMutation.js
// and create subclass of Relay.Mutation called CheckHidingSpotForTreasureMutation to hold our mutation implementation:

export default class CheckHidingSpotForTreasureMutation extends Relay.Mutation {
  static fragments = {
    game: () => Relay.QL`
      fragment on Game {
        id,
        turnsRemaining,
      }
    `,
    hidingSpot: () => Relay.QL`
      fragment on HidingSpot {
        id,
      }
    `,
  };
  getMutation() {
    return Relay.QL`mutation{checkHidingSpotForTreasure}`;
  }
  getCollisionKey() {
    return `check_${this.props.game.id}`;
  }
  getFatQuery() {
    return Relay.QL`
      fragment on CheckHidingSpotForTreasurePayload @relay(pattern: true) {
        hidingSpot {
          hasBeenChecked,
          hasTreasure,
        },
        game {
          turnsRemaining,
        },
      }
    `;
  }
  getConfigs() {
    return [{
      type: 'FIELDS_CHANGE',
      fieldIDs: {
        hidingSpot: this.props.hidingSpot.id,
        game: this.props.game.id,
      },
    }];
  }
  getVariables() {
    return {
      id: this.props.hidingSpot.id,
    };
  }
  getOptimisticResponse() {
    return {
      game: {
        turnsRemaining: this.props.game.turnsRemaining - 1,
      },
      hidingSpot: {
        id: this.props.hidingSpot.id,
        hasBeenChecked: true,
      },
    };
  }
}
