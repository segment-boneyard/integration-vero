'use strict';

/**
 * Module dependencies.
 */

var clone = require('clone');
var del = require('obj-case').del;
var reject = require('reject');
var time = require('unix-time');

/**
 * Identify.
 *
 * @param {Identify} identify
 * @return {Object}
 * @api private
 */

exports.identify = function(identify, settings) {
  return reject(addCommon(identify, {
    auth_token: settings.authToken,
    id: identify.userId(),
    email: identify.email(),
    data: identify.traits()
  }));
};

/**
 * Page.
 *
 * @param {Page} page
 * @return {Object}
 * @api private
 */

exports.page = function(page, settings) {
  return reject(addCommon(page, {
    auth_token: settings.authToken,
    event_name: 'viewed_page',
    data: {
      url: page.url()
    },
    identity: {
      id: page.userId()
    },
    extras: {
      created_at: time(page.timestamp()),
      source: 'segment'
    }
  }));
};

/**
 * Track.
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.track = function(track, settings) {
  // If the event name contains "unsubscribe", instead send an unsubscribe payload
  if (/[Uu]nsubscribe/.test(track.event())) {
    return reject({
      auth_token: settings.authToken,
      id: track.userId(),
      extras: {
        created_at: time(track.timestamp()),
        source: 'segment'
      }
    });
  } 
  var identity; 
  if (typeof track.proxy('context.traits.email') !== 'undefined') {
    identity = {
      id: track.userId(),
      email: track.proxy('context.traits.email')
    };
  } else {
    identity = {
      id: track.userId()
    };
  }
  return reject(addCommon(track, {
    auth_token: settings.authToken,
    event_name: track.event(),
    data: track.properties(),
    identity: identity,
    extras: {
      created_at: time(track.timestamp()),
      source: 'segment'
    }
  }));
};

/**
 * Group.
 *
 * @param {Group} group
 * @return {Object}
 * @api private
 */

exports.group = function(group, settings) {
  var traits = clone(group.traits());
  del(traits, 'email');

  return reject({
    auth_token: settings.authToken,
    id: group.userId(),
    email: group.email(),
    changes: {
      group: traits
    }
  });
};

/**
 * Alias.
 *
 * @param {Track} track
 * @param {Object} settings
 * @return {Object}
 * @api private
 */

exports.alias = function(alias, settings) {
  return {
    auth_token: settings.authToken,
    id: alias.from(),
    new_id: alias.to()
  };
};

/**
 * AddOrRemoveTags.
 *
 * @param {Facade} msg
 * @param {Object} tags
 * @return {Object}
 * @api private
 */

exports.addOrRemoveTags = function(msg, tags, settings) {
  var payload = {};
  payload.auth_token = settings.authToken;

  // Add id to payload.
  // Defaults to msg.userId() if id is not provided in options object.
  payload.id = tags.id || msg.userId();

  // Either 'add' or 'remove'.
  // See docs: http://developers.getvero.com/?bash#tags
  payload[tags.action] = tags.values;

  return payload;
};

function addCommon(facade, message) {
  var ua = facade.userAgent();
  if (ua) {
    message.data.userAgent = ua;
  }
  return message;
}
