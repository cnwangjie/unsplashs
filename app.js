var http = require('http')
var fs = require('fs')
var request = require('request')
var cheerio = require('cheerio')
var schedule = require('node-schedule')
var app = require('express')
var path = require('path')
var save_dir = './saved/'
var list = fs.openSync('./pictures.json', 'rs+')
var port = 80

app.get('/', (req, res) => {

})

app.listen(port)

schedule.scheduleJob('0 0 */2 * * *', () => {
    console.log('start download at'+Date())
    spider()
})

function spider() {
    request('https://unsplash.com/', (err, res, body) => {
        if (err || res.statusCode != 200) {
            console.log(err)
        } else {
            var $ = cheerio.load(body)
            var $a = $("a[title='Download photo']")
            for (var i = 0;i < $a.length;i++) {
                var src = $a[i].attribs.href
                var dest = save_dir+path.dirname(src).split('/')[4]+'.jpg'
                download(src, dest, (err, pic) => {
                    console.log('done! '+pic)
                })
            }
        }
    })
}

function download(url, dest, cb) {
    fs.stat(dest, (err, stat) => {
        if (stat && stat.isFile()) {
            console.log(dest+' is exist!')
        } else {
            request(url).pipe(fs.createWriteStream(dest)).on('close', () => {
                cb(null, dest)
            })
        }
    })
}

 
