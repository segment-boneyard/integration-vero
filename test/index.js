'use strict';

var Test = require('segmentio-integration-tester');
var mapper = require('../lib/mapper');
var assert = require('assert');
var Vero = require('..');

describe('Vero', function(){
  var settings;
  var vero;
  var test;

  beforeEach(function(){
    settings = { authToken: 'OTk1MDRmZWExN2Q5YjcwODA1ZTQ3MGE2NzJhZjFjNWI2MDhlYjg4ZjozODUzNzJlMjMwOWQ2NTg0NTQyNDUwMmM0NzQwN2ZlNDJiM2ZmOWQz' };
    vero = new Vero(settings);
    test = Test(vero, __dirname);
  });

  it('should have the correct settings', function(){
    test
      .endpoint('https://api.getvero.com/api/v2')
      .channels(['server', 'mobile'])
      .ensure('settings.authToken')
      .ensure('message.userId')
      .retries(2);
  });

  describe('.validate()', function(){
    var msg;

    beforeEach(function(){
      msg = { userId: 'user-id' };
    });

    it('should be invalid if .authToken is missing', function(){
      delete settings.authToken;
      test.invalid(msg, settings);
    });

    it('should be invalid if .userId is missing', function(){
      delete msg.userId;
      test.invalid(msg, settings);
    });

    it('should be valid if settings are complete', function(){
      test.valid(msg, settings);
    });
  });

  describe('mapper', function(){
    describe('identify', function(){
      it('should map basic identify', function(){
        test.maps('identify-basic', {}, { ignored: [ 'auth_token' ] });
      });
    });

    describe('track', function(){
     it('should map basic track', function(){
       test.maps('track-basic', {}, { ignored: [ 'auth_token' ] });
     });

    it('should map unsubscribe track', function(){
      test.maps('track-unsubscribe', {}, { ignored: [ 'auth_token' ] });
    });
   });

    describe('group', function(){
      it('should map basic group', function(){
        test.maps('group-basic', {}, { ignored: [ 'auth_token' ] });
      });

      it('should not map `email` to a group trait', function(){
        test.set({ authToken: settings.authToken });
        test.maps('group-no-userid', {}, { ignored: [ 'auth_token' ] });
      });
    });
  });

  describe('.track()', function(){
    it('should get a good response from the API', function(done){
      var track = test.fixture('track-basic');
      test
        .set(settings)
        .track(track.input)
        .sendsAlmost(track.output, { ignored: [ 'auth_token' ] })
        .expects(200, done);
    });

    it('should error on invalid request', function(done){
      test
        .set({ authToken: 'x' })
        .track({ event: 'event' })
        .error('Bad Request', done);
    });

    it('should unsubscribe when the event name contains "unsubscribe"', function(done){
      var track = test.fixture('track-unsubscribe');
      test
        .set(settings)
        .track(track.input)
        .sendsAlmost(track.output, { ignored: [ 'auth_token' ] })
        .pathname('/api/v2/users/unsubscribe')
        .expects(200, done);
    });
  });

  describe('.identify()', function(){
    it('should get a good response from the API', function(done){
      var identify = test.fixture('identify-basic');
      test
        .set(settings)
        .identify(identify.input)
        .sendsAlmost(identify.output, { ignored: [ 'auth_token' ] })
        .expects(200, done);
    });

    it('should send userAgent when present', function(done){
      var identify = test.fixture('identify-ua');
      test
        .set(settings)
        .identify(identify.input)
        .sendsAlmost(identify.output, { ignored: [ 'auth_token' ] })
        .expects(200, done);
    });

    it('should error on invalid request', function(done){
      test
        .set({ authToken: 'x' })
        .identify({ userId: 'user-id' })
        .error('Unauthorized', done);
    });
  });

  describe('.group()', function(){
    it('should get a good response from the API', function(done){
      var group = test.fixture('group-basic');
      test
        .set(settings)
        .group(group.input)
        .sendsAlmost(group.output, { ignored: [ 'auth_token' ] })
        .expects(200, done);
    });

    it('successfully send when only an email (no userId) is provided', function(done){
      var group = test.fixture('group-no-userid');
      test
        .set(settings)
        .group(group.input)
        .sendsAlmost(group.output, { ignored: [ 'auth_token' ] })
        .expects(200, done);
    });

    it('should error on invalid request', function(done){
      test
        .set({ authToken: 'x' })
        .group({ userId: 'user-id' })
        .error('Unauthorized', done);
    });
  });

  describe('.alias()', function(){
    it('should alias correctly', function(done){
      var alias = test.fixture('alias-basic');
      test
        .set(settings)
        .alias(alias.input)
        .sendsAlmost(alias.output, { ignored: [ 'auth_token' ] })
        .expects(200, done);
    });

    it('should error on invalid request', function(done){
      test
        .set({ authToken: 'x' })
        .alias({ userId: 'user-id' })
        .error('Bad Request', done);
    });
  });

  describe('.page()', function(){
    it('should track page as a viewed_page event', function(done) {
      var page = test.fixture('page-basic');
      test
        .set(settings)
        .page(page.input)
        .sendsAlmost(page.output, { ignored: [ 'auth_token' ] })
        .expects(200, done);
    });
  });
});
