'use strict';

var Test = require('segmentio-integration-tester');
var helpers = require('./helpers');
var time = require('unix-time');
var Vero = require('..');

describe('Vero', function() {
  var settings;
  var vero;
  var test;

  beforeEach(function() {
    settings = { authToken: 'OTk1MDRmZWExN2Q5YjcwODA1ZTQ3MGE2NzJhZjFjNWI2MDhlYjg4ZjozODUzNzJlMjMwOWQ2NTg0NTQyNDUwMmM0NzQwN2ZlNDJiM2ZmOWQz' };
    vero = new Vero(settings);
    test = Test(vero, __dirname);
  });

  it('should have the correct settings', function() {
    test
      .endpoint('https://api.getvero.com/api/v2')
      .channels(['server', 'mobile'])
      .ensure('settings.authToken')
      .ensure('message.userId')
      .retries(2);
  });

  describe('.validate()', function() {
    var msg;

    beforeEach(function() {
      msg = { userId: 'user-id' };
    });

    it('should be invalid if .authToken is missing', function() {
      delete settings.authToken;
      test.invalid(msg, settings);
    });

    it('should be invalid if .userId is missing', function() {
      delete msg.userId;
      test.invalid(msg, settings);
    });

    it('should be valid if settings are complete', function() {
      test.valid(msg, settings);
    });
  });

  describe('mapper', function() {
    describe('identify', function() {
      it('should map basic identify', function() {
        test.set({ authToken: 'some-auth-token' });
        test.maps('identify-basic');
      });
    });

    describe('track', function() {
      it('should map basic track', function() {
        test.set({ authToken: 'some-auth-token' });
        test.maps('track-basic');
      });
    });

    describe('group', function() {
      it('should map basic group', function() {
        test.set({ authToken: settings.authToken });
        test.maps('group-basic');
      });

      it('should not map `email` to a group trait', function() {
        test.set({ authToken: settings.authToken });
        test.maps('group-no-userid');
      });
    });
  });

  describe('.track()', function() {
    it('should get a good response from the API', function(done) {
      var track = helpers.track();
      test
        .set(settings)
        .track(track)
        .sends({
          auth_token: settings.authToken,
          event_name: track.event(),
          data: track.properties(),
          identity: {
            id: track.userId()
          },
          extras: {
            created_at: time(track.timestamp()),
            source: 'segment'
          }
        })
        .expects(200, done);
    });

    it('should error on invalid request', function(done) {
      test
        .set({ authToken: 'x' })
        .track({ event: 'event' })
        .error('cannot POST /api/v2/events/track (400)', done);
    });
  });

  describe('.identify()', function() {
    it('should get a good response from the API', function(done) {
      var identify = helpers.identify();
      test
        .set(settings)
        .identify(identify)
        .sends({
          id: identify.userId(),
          auth_token: settings.authToken,
          email: identify.email(),
          data: identify.traits()
        })
        .expects(200, done);
    });

    it('should error on invalid request', function(done) {
      test
        .set({ authToken: 'x' })
        .identify({ userId: 'user-id' })
        .error('cannot POST /api/v2/users/track (401)', done);
    });
  });

  describe('.group()', function() {
    it('should get a good response from the API', function(done) {
      var group = test.fixture('group-basic');
      test
        .set(settings)
        .group(group.input)
        .sends(group.output)
        .expects(200, done);
    });

    it('successfully send when only an email (no userId) is provided', function(done) {
      var group = test.fixture('group-no-userid');
      test
        .set(settings)
        .group(group.input)
        .sends(group.output)
        .expects(200, done);
    });

    it('should error on invalid request', function(done) {
      test
        .set({ authToken: 'x' })
        .group({ userId: 'user-id' })
        .error('cannot PUT /api/v2/users/edit (401)', done);
    });
  });

  describe('.alias()', function() {
    it('should alias correctly', function(done) {
      var alias = helpers.alias();
      test
        .set(settings)
        .track(alias)
        .sends({
          auth_token: settings.authToken,
          id: alias.from(),
          new_id: alias.to()
        })
        .expects(200, done);
    });

    it('should error on invalid request', function(done) {
      test
        .set({ authToken: 'x' })
        .alias({ userId: 'user-id' })
        .error('cannot PUT /api/v2/users/reidentify (400)', done);
    });
  });
});
