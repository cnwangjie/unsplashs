var http = require('http')
var fs = require('fs')
var path = require('path')
var request = require('request')
var cheerio = require('cheerio')
var schedule = require('node-schedule')
var app = require('express')()
var async = require('async')
var save_dir = './saved/'
//var list = './pictures.json'
var port = 80

// app.get('/', (req, res) => {
//     res.download(randPic())
// })
//
//
// schedule.scheduleJob('0 0 */2 * * *', () => {
//     spider()
// })

var addPic = async.queue(function(dest, cb) {
    fs.readFile(list, (err, data) => {
        var pics = JSON.parse(data)
        for (var i = 0; i < pics.length; i++) {
            if (pics[i] == dest) {
                console.log(dest+' is exist!')
                cb()
                return
            }
        }
        pics.push(dest)
        data = JSON.stringify(pics, null, 4)
        fs.writeFile(list, data, 'utf8', function(err) {
            console.log('done! '+dest)
            cb()
            return
        })
    })
}, 1)

function spider() {
    console.log('start download at '+Date())
    request('https://unsplash.com/', (err, res, body) => {
        if (err || res.statusCode != 200) {
            console.log(err)
        } else {
            var $ = cheerio.load(body)
            var $a = $("a[title='Download photo']")
            for (var i = 0;i < $a.length;i++) {
                var src = $a[i].attribs.href
                console.log('downloading: '+src)
                var dest = save_dir+path.dirname(src).split('/')[4]+'.jpg'
                download(src, dest, (err, pic) => {
                    addPic.push(dest)
                })
            }
        }
    })
}

function download(url, dest, cb) {
    fs.stat(dest, (err, stat) => {
        if (stat && stat.isFile() && stat.size > 1000) {
            console.log(dest+' is exist!')
            cb(null, dest)
        } else {
            console.log(dest+' is downloading!')
            try {
                request(url).pipe(fs.createWriteStream(dest)).on('close', () => {
                    console.log('done! '+dest)
                    cb(null, dest)
                })
            } catch (e) {
                console.log(e.message)
                cb(null, dest)
            }
        }
    })
}

function randPic() {
    var pics = JSON.parse(fs.readFileSync(list))
    var n = Math.floor(Math.random() * pics.length)
    return pics[n]
}

function itCatcher() {
    var listUrl = 'https://unsplash.it/list'
    async.waterfall([
        (cb) => {
            console.log('Solving the picture list...')
            request(listUrl, (err, res, body) => {
                if (err) {
                    console.log(err)
                } else {
                    var picList = JSON.parse(body)
                    for (var i = 0; i < picList.length; i++) {
                        picList[i] = picList[i].post_url + '/download?force=true'
                    }
                    cb(null, picList)
                }
            })
        },
        (picList, cb) => {
        console.log('There ar '+picList.length+' pictures.')
            async.mapLimit(picList, 5, (src, cb) => {
                var dest = save_dir+path.dirname(src).split('/')[4]+'.jpg'
                async.retry({
                    times: 3,
                    interval: 1000
                }, () => {
                    download(src, dest, cb)
                }, (err, result) => {

                })
            }, (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log(result)
                }
            })
        }
    ])
}
itCatcher()
// app.listen(port)
