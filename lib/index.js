
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
 * Track.
 *
 * https://github.com/getvero/vero-api/blob/master/sections/api/events.md
 *
 * @param {Track} track
 * @param {Object} settings
 * @param {Function} fn
 * @api public
 */

Vero.prototype.track = request('/events/track');

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
