'use strict';

const ApiEndpoint = require('./endpoint')
  , SceneIdPlaceholder = require('../placeholders/SceneIdPlaceholder')
  , Scene = require('../../../bridge-model/Scene')
  , ApiError = require('../../ApiError')
  , utils = require('../../../hue-api/utils')
;

module.exports = {

  getAll: new ApiEndpoint()
    .get()
    .acceptJson()
    .uri('/api/<username>/scenes')
    .pureJson()
    .postProcess(buildScenesResult),

  createScene: new ApiEndpoint()
    .post()
    .acceptJson()
    .uri('/api/<username>/scenes')
    .pureJson()
    .payload(buildScenePayload)
    .postProcess(buildCreateSceneResult),

  updateScene: new ApiEndpoint()
    .put()
    .acceptJson()
    .uri('/api/<username>/scenes/<id>')
    .pureJson()
    .payload(buildBasicSceneUpdatePayload)
    .postProcess(extractUpdatedAttributes),

  //TODO the lightstates id is a weird one here
  // modifyScene: new ApiEndpoint()
  //   .put()
  //   .acceptJson()
  //   .uri('/api/<username>/scenes/<id>/lightstates/<id>')
  //   .pureJson()
  //   .payload(buildScenePayload),

  getScene: new ApiEndpoint()
    .get()
    .acceptJson()
    .uri('/api/<username>/scenes/<id>')
    .placeholder(new SceneIdPlaceholder())
    .pureJson()
    .postProcess(buildSceneResult),

  deleteScene: new ApiEndpoint()
    .delete()
    .acceptJson()
    .uri('/api/<username>/scenes/<id>')
    .placeholder(new SceneIdPlaceholder())
    .pureJson()
    .postProcess(validateSceneDeletion),
};


function buildScenesResult(result) {
  let scenes = [];

  Object.keys(result).forEach(function (id) {
    scenes.push(new Scene(result[id], id));
  });

  return scenes;
}

function buildSceneResult(data, requestParameters) {
  if (requestParameters) {
    return new Scene(data, requestParameters.id);
  } else {
    return new Scene(data);
  }
}

function validateSceneDeletion(result) {
  if (!utils.wasSuccessful(result)) {
    throw new ApiError(utils.parseErrors(result).join(', '));
  }
  return true;
}

function buildScenePayload(parameters) {
  const scene = parameters.scene;

  if (!scene) {
    throw new ApiError('No scene provided');
  } else if (!(scene instanceof Scene)) {
    throw new ApiError('Must provide a valid Scene object');
  }

  const body = scene.payload;
  // Recycle is a required parameter when creating a new scene
  if (!body.recycle) {
    body.recycle = false;
  }
  return {
    type: 'application/json',
    body: body
  };
}

function buildBasicSceneUpdatePayload(parameters) {
  const scene = parameters.scene;

  if (!scene) {
    throw new ApiError('No scene provided');
  } else if (!(scene instanceof Scene)) {
    throw new ApiError('Must provide a valid Scene object');
  }

  const body = scene.payload;
  return {
    type: 'application/json',
    body: body
  };
}

function buildCreateSceneResult(result) {
  const hueErrors = utils.parseErrors(result); //TODO not sure if this still gets called as the request handles some of this

  if (hueErrors) {
    throw new ApiError(`Error creating scene: ${hueErrors[0].description}`, hueErrors[0]);
  }

  return {id: result[0].success.id};
}

function extractUpdatedAttributes(result) {
  if (utils.wasSuccessful(result)) {
    const values = {}
    result.forEach(update => {
      const success = update.success;
      Object.keys(success).forEach(key => {
        const attribute = /.*\/(.*)$/.exec(key)[1];
        values[attribute] = true; //success[key];
      });
    });
    return values;
  } else {
    throw new ApiError('Error in response'); //TODO extract the error
  }
}