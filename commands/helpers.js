var child_process = require('child_process')

var helpers = exports
  , userCache = {}

/**
 * Look up the information for a user, and cache it
 */
helpers.cachedUser = function(client, id, callback) {
  if (userCache[id]) {
    return callback(userCache[id])
  }

  client.user(id, function(user) {
    userCache[id] = user
    callback(user)
  })
}

/**
 * Limit `func` so that each user can only use it every `seconds` seconds
 */
helpers.ratelimit = function(seconds, func) {
  var userLimits = {}
  return function(room, msg, client) {
    var userLimit = userLimits[msg.userId]
    if (userLimit && Date.now() < userLimit) {
      return helpers.cachedUser(client, msg.userId, function(user) {
        room.speak(user.name + ": Slow down! You can only use this command every " + seconds + " seconds." )
      })
    }

    userLimits[msg.userId] = Date.now() + (seconds * 1000)
    func(room, msg)
  }
}

/**
 * Helper function for child_process.spawn
 *
 */
helpers.execSystem = function(cmd, args, callback) {
  if (arguments.length === 2) {
    callback = args
    args = []
  }

  var proc = child_process.spawn(cmd, args)
    , output = ""

  proc.stdout.on('data', function(data) {
    output += data
  })
  proc.stderr.on('data', function(data) {
    output += data
  })

  proc.on('exit', function(code) {
    if (code) {
      callback(new Error(code + ": " + output), output)
    } else {
      // TODO also provide seperate stdout and stderr?
      callback(null, output)
    }
  })
}
