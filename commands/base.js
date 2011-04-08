var request = require('request')
  , helpers = require('./helpers')
  , ratelimit = helpers.ratelimit

module.exports = {
  /**
   * Google image search
   */
  "image": ratelimit(60, function(room, msg) {
    var uri = 'https://ajax.googleapis.com/ajax/services/search/images?v=1.0&q=' + encodeURIComponent(msg.full)
    request({uri: uri}, function(err, res, body) {
      if (err || res.statusCode >= 400) {
        console.error(err, res, body)
        return room.speak("Error :(")
      }

      body = JSON.parse(body)
      if (body.responseData.results.length > 0) {
        room.speak(body.responseData.results[0].unescapedUrl)
      } else {
        room.speak("No image found :(")
      }
    })
  }),

  "tweet": function(room, msg) {
    var uri = 'http://search.twitter.com/search.json?rpp=1&result_type=recent&q=' + encodeURIComponent(msg.full)
    request({uri: uri}, function(err, res, body) {
      if (err || res.statusCode >= 400) {
        console.error(err, res, body)
        return room.speak("Error :(")
      }

      body = JSON.parse(body)
      if (body.results.length > 0) {
        room.tweet("https://twitter.com/"+body.results[0].from_user+"/status/"+body.results[0].id_str)
      } else {
        room.speak("No tweet found :(")
      }
    })
  },

  "fortune": ratelimit(60, function(room) {
    helpers.execSystem('fortune', function(err, output) {
      if (err) {
        console.error(err)
        return room.speak("Error: " + err.message)
      }

      room.paste(output)
    })
  }),
}
