/**
 * ./data/shema.js
 */

// Authoring a schema
// A GraphQL schema describes your data model,
// and provides a GraphQL server with an associated set of resolve methods that know how to fetch data.
// We will use graphql-js and graphql-relay-js to build our schema.

// Let's open up the starter kit's schema, and replace the database imports with the ones we just created:

import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';

import {
  connectionArgs,
  connectionDefinitions,
  connectionFromArray,
  fromGlobalId,
  globalIdField,
  mutationWithClientMutationId,
  nodeDefinitions,
} from 'graphql-relay';

import {
  Game,
  HidingSpot,
  checkHidingSpotForTreasure,
  getGame,
  getHidingSpot,
  getHidingSpots,
  getTurnsRemaining,
} from './database';

// At this point, you can delete everything up until queryType in ./data/schema.js.

// Next, let's define a node interface and type.
// We only need to provide a way for Relay to map from an object to the GraphQL type associated with that object,
// and from a global ID to the object it points to:

const { nodeInterface, nodeField } = nodeDefinitions(
  (globalId) => {
    const { type, id } = fromGlobalId(globalId);
    if (type === 'Game') {
      return getGame(id);
    } else if (type === 'HidingSpot') {
      return getHidingSpot(id);
    } else {
      return null;
    }
  },
  (obj) => {
    if (obj instanceof Game) {
      return gameType;
    } else if (obj instanceof HidingSpot) {
      return hidingSpotType;
    } else {
      return null;
    }
  }
);

// Next, let's define our game and hiding spot types, and the fields that are available on each.

const gameType = new GraphQLObjectType({
  name: 'Game',
  description: 'A treasure search game',
  fields: () => ({
    id: globalIdField('Game'),
    hidingSpots: {
      type: hidingSpotConnection,
      description: 'Places where treasure might be hidden',
      args: connectionArgs,
      resolve: (game, args) => connectionFromArray(getHidingSpots(), args),
    },
    turnsRemaining: {
      type: GraphQLInt,
      description: 'The number of turns player has left to find the treasure',
      resolve: () => getTurnsRemaining(),
    },
  }),
  interfaces: [nodeInterface],
});

const hidingSpotType = new GraphQLObjectType({
  name: 'HidingSpot',
  description: 'A place where you might find treasure',
  fields: () => ({
    id: globalIdField('HidingSpot'),
    hasBeenChecked: {
      type: GraphQLBoolean,
      description: 'True if this hiding spot holds treasure',
      resolve: (hidingSpot) => hidingSpot.hasBeenChecked,
    },
    hasTreasure: {
      type: GraphQLBoolean,
      description: 'True if this hiding spot holds treasure',
      resolve: (hidingSpot) => {
        if (hidingSpot.hasBeenChecked) {
          return hidingSpot.hasTreasure;
        } else {
          return null;
        }
      },
    },
  }),
  interfaces: [nodeInterface],
});

// Since one game can have many hiding spots,
// we need to create a connection that we can use to link them together.

const { connectionType: hidingSpotConnection } =
  connectionDefinitions({ name: 'HidingSpot', nodeType: hidingSpotType });

// Now let's associate these types with the root query type.

const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    node: nodeField,
    game: {
      type: gameType,
      resolve: () => getGame(),
    },
  }),
});

// With the queries out of the way,
// let's start in on our only mutation: the one that spends a turn by checking a spot for treasure.
// Here, we define the input to the mutation (the id of a spot to check for treasure)
// and a list of all of the possible fields that the client might want updates about after the mutation has taken place.
// Finally, we implement a method that performs the underlying mutation.

const checkHidingSpotForTreasureMutation = mutationWithClientMutationId({
  name: 'CheckHidingSpotForTreasure',
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  outputFields: {
    hidingSpot: {
      type: hidingSpotType,
      resolve: ({ localHidingSpotId }) => getHidingSpot(localHidingSpotId),
    },
    game: {
      type: gameType,
      resolve: () => getGame(),
    },
  },
  mutationAndGetPayload: ({ id }) => {
    const localHidingSpotId = fromGlobalId(id).id;
    checkHidingSpotForTreasure(localHidingSpotId);
    return { localHidingSpotId };
  },
});

// Let's associate the mutation we just created with the root mutation type:

const mutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    checkHidingSpotForTreasure: checkHidingSpotForTreasureMutation,
  }),
});

// Finally, we construct our schema (whose starting query type is the query type we defined above) and export it.

export const Schema = new GraphQLSchema({
  query: queryType,
  mutation: mutationType,
});
