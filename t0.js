// var request = require('request')
// request({
//     url: 'https://api.unsplash.com/feeds/home?after=aa0a9910-bd0b-11e6-8080-8001451fa973',
//     method: 'POST'
// }, function(err, res, body) {
//     console.log(body)
// })

var fs = require('fs')
var http = require('http')
// fs.stat('./app.js', (err, stat) => {
//     console.log(stat)
// })

var opt = {method: 'HEAD', host: 'unsplash.com', path: '/photos/gv1I7bYLLDI/download?force=true'}

var req = http.request(opt, (res) => {
    console.log(res.headers)
})
req.end()
