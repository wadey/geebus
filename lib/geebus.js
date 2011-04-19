var fs = require('fs')
  , path = require('path')
  , configFile = process.env.GEEBUS_CONFIG

if (!configFile) {
  console.error("usage: GEEBUS_CONFIG=config.json node geebus.js")
}

function resolve(file) {
  if (file[0] !== '/') {
    return path.join(process.cwd(), file)
  }
  return file
}

var config = JSON.parse(fs.readFileSync(resolve(configFile)))
  , client = require("ranger").createClient(config.account, config.token)
  , _ = require('underscore')
  , commands = {}
  , rules = []
  , openRooms = []

config.commands.forEach(function(file) {
  _.extend(commands, require(resolve(file)))
})

Object.keys(commands).forEach(function(name) {
  console.log(" *", name)
  rules.push({
    re: RegExp('^!(' + name + ")\\s*(.*)$"),
    name: name,
    func: commands[name]
  })
})

console.log(" ** " + config.account + ".campfirenow.com")

client.rooms(function(rooms) {
  rooms.forEach(function(room) {
    openRooms.push(room)
    room.join(function() {
      console.log(' ** joined ' + room.name + ' (' + room.id + ')')
      room.listen(function(message) {
        if (message.type !== "TextMessage") {
          return
        }
        if (message.body[0] !== '!') {
          return
        }

        rules.forEach(function(rule) {
          var match

          if (match = message.body.match(rule.re)) {
            var command = match[1]
              , full = match[2].trim()
              , split = full.split(/\s+/)

            var extMessage = _.extend({}, message, {
              command: command,
              full: full,
              split: split
            })

            console.log("[", Date(), "]", rule.name, ":", full)
            rule.func(room, extMessage, client)
          }
        })
      })
    })
  })
})

// Exit gracefully

var exit = function() {
  console.log(" ** disconnecting")
  openRooms.forEach(function(room) {
    room.stopListening()
    room.leave()
  })
}

process.on('SIGINT', exit)
process.on('SIGTERM', exit)
