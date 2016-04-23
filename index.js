var redis = require('redis');
var Redlock = require('redlock');
var util = require('util');

var default_ttl = 30*1000;

exports = module.exports = function(redis_clients, redlock_options, auto_reply) {

  var instantiated_clients = redis_clients.map(function(client) {
    if (client instanceof redis.RedisClient) {
      return client;
    } else if (typeof client === "object") {
      return redis.createClient(client);
    } else {
      throw new Error("Clients must be a list of Redis clients or Redis settings");
    }
  });

  var redlock = new Redlock(instantiated_clients, redlock_options);

  return function(context, event, next) {
    var lockname = 'platform:' + context._platform.name + '|session:' + context.sessionId;
    var ttl = context.lock_ttl || redlock_options.ttl || default_ttl;

    redlock.lock(lockname, ttl, function(err, lock) {
      if (err) {
        // if we can't acquire the lock...
        if (auto_reply || context.auto_reply) {
          var reply = auto_reply || context.auto_reply;
          event.send(context, event, reply, function(sendErr) {
            // prioritize reporting a send error reporting a locking error
            if (sendErr) {
              next(sendErr);
            } else {
              next.unroll();
            }
          });
        } else {
          next.unroll();
        }
      } else {
        // if we do acquire the lock
        context.lock = lock;
        next(err, function(context, event, next) {
          lock.unlock(function(err) {
            next(err);
          });
        });
      }
    });

  };

};
