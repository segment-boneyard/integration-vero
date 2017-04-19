'use strict';

/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var is = require('is');
var mapper = require('./mapper');

/**
 * Expose `Vero`
 */

var Vero = module.exports = integration('Vero')
  .endpoint('https://api.getvero.com/api/v2')
  .channels(['server', 'mobile'])
  .ensure('settings.authToken')
  .ensure('message.userId')
  .retries(2);

Vero.prototype.page = request('page', '/events/track');

/**
 * Identify.
 *
 * https://github.com/getvero/vero-api/blob/master/sections/api/users.md
 *
 * @param {Identify} identify
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Vero.prototype.identify = request('identify', '/users/track');

/**
 * Group.
 *
 * https://github.com/getvero/vero-api/blob/master/sections/api/users.md
 *
 * @param {Group} group
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Vero.prototype.group = request('group', '/users/edit', 'put');

/**
 * Track.
 *
 * https://github.com/getvero/vero-api/blob/master/sections/api/events.md
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Vero.prototype.track = function(track, fn) {
  var payload = mapper.track(track, this.settings);
  var endpoint;
  // event name isn't included in unsubscribe calls
  if (payload.event_name) {
    endpoint = '/events/track';
  } else {
    endpoint = '/users/unsubscribe';
  }
  var self = this;
  return this
    .post(endpoint)
    .set('Accept', 'application/json')
    .type('json')
    .send(payload, this.settings)

    // Tags are sent after the initial event to ensure the existence of the object to be tagged in Vero.
    // On error, the callback is invoked.
    // See docs: https://visionmedia.github.io/superagent/#request-basics

    .then(function(res) {
      var tags = checkForTags(track);
      if (tags) return self.addOrRemoveTags(track, tags, fn);
      return fn(null, res);
    }, fn);
};

/**
 * Alias.
 *
 * https://github.com/getvero/vero-php/blob/master/vero/client.php#L30-L40
 *
 * @param {Alias} alias
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Vero.prototype.alias = request('alias', '/users/reidentify', 'put');

/**
 * Add or Remove Tags.
 *
 * http://developers.getvero.com/?bash#tags
 *
 * @param {Facade} msg
 * @param {Object} tags
 * @param {Function} fn
 * @api public
 */

Vero.prototype.addOrRemoveTags = function(msg, tags, fn) {
  // Check to ensure tags object is properly formatted.
  var err;
  if (!is.object(tags)) {
    err = new Error('Tag option must be passed as an Object.');
  }

  if (!tags.action || tags.action !== 'add' && tags.action !== 'remove') {
    err = new Error('Tags action value must be either \'add\' or \'remove\'');
  }

  if (!tags.values || !is.array(tags.values)) {
    err = new Error('Could not detect tag values. Tag values must be passed as array of strings.');
  }

  if (err instanceof Error) {
    err.status = 400;
    return fn(err);
  }

  var payload = mapper.addOrRemoveTags(msg, tags, this.settings);
  var path = '/users/tags/edit';

  this
    .request('put', path)
    .set('Accept', 'application/json')
    .type('json')
    .send(payload)
    .end(fn);
};

/**
 * Request.
 *
 * @param {String} integrationMethod
 * @param {String} path
 * @param {String} requestMethod
 * @return {Function}
 * @api private
 */

function request(integrationMethod, path, requestMethod) {
  requestMethod = requestMethod || 'post';
  return function(msg, fn) {
    var payload = mapper[integrationMethod](msg, this.settings);
    var self = this;
    return self
      .request(requestMethod, path)
      .set('Accept', 'application/json')
      .type('json')
      .send(payload)
      .then(function(res) {
        var tags = checkForTags(msg);
        if (tags) return self.addOrRemoveTags(msg, tags, fn);
        return fn(null, res);
      }, fn);
  };
}

function checkForTags(msg) {
  var options = msg.options('Vero');
  if (options.tags) {
    return options.tags;
  }
  return false;
}
