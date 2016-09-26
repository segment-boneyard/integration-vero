'use strict';

/**
 * Module dependencies.
 */

var integration = require('segmentio-integration');
var mapper = require('./mapper');

/**
 * Expose `Vero`
 */

var Vero = module.exports = integration('Vero')
  .endpoint('https://api.getvero.com/api/v2')
  .channels(['server', 'mobile'])
  .ensure('settings.authToken')
  .ensure('message.userId')
  .mapper(mapper)
  .retries(2);

Vero.prototype.page = request('/events/track');

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

Vero.prototype.identify = request('/users/track');

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

Vero.prototype.group = request('/users/edit', 'put');

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

Vero.prototype.track = function(payload, fn) {
  var endpoint;
  // event name isn't included in unsubscribe calls
  if (payload.event_name) {
    endpoint = '/events/track';
  } else {
    endpoint = '/users/unsubscribe';
  }
  return this
    .post(endpoint)
    .set('Accept', 'application/json')
    .type('json')
    .send(payload, this.settings)
    .end(this.handle(fn));
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

Vero.prototype.alias = request('/users/reidentify', 'put');

/**
 * Request.
 *
 * @param {String} path
 * @param {String} method
 * @return {Function}
 * @api private
 */

function request(path, method){
  method = method || 'post';
  return function(payload, fn){
    return this
      .request(method, path)
      .set('Accept', 'application/json')
      .type('json')
      .send(payload)
      .end(this.handle(fn));
  };
}
