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

exports.identify = function(identify) {
  return reject(addCommon(identify, {
    auth_token: this.settings.authToken,
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

exports.page = function(page) {
  return reject(addCommon(page, {
    auth_token: this.settings.authToken,
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

exports.track = function(track) {
  // If the event name contains "unsubscribe", instead send an unsubscribe payload
  if (/[Uu]nsubscribe/.test(track.event())) {
    return reject({
      auth_token: this.settings.authToken,
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
    auth_token: this.settings.authToken,
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

exports.group = function(group) {
  var traits = clone(group.traits());
  del(traits, 'email');

  return reject({
    auth_token: this.settings.authToken,
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

exports.alias = function(alias) {
  return {
    auth_token: this.settings.authToken,
    id: alias.from(),
    new_id: alias.to()
  };
};

function addCommon(facade, message) {
  var ua = facade.userAgent();
  if (ua) {
    message.data.userAgent = ua;
  }
  return message;
}
