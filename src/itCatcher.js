import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import request from 'request'
import rp from 'request-promise'
import async from 'async'
import bluebird from 'bluebird'

const stat = bluebird.promisify(fs.stat)
const writeFile = bluebird.promisify(fs.writeFile)
const readFile = bluebird.promisify(fs.readFile)

const enableMessage = true

const log = (...obj) => enableMessage ? console.log(...obj) : undefined

const download = async (url, dest) => {
    const fileStat = await stat(dest)
    if (fileStat && fileStat.isFile()) {
        log(chalk.yellow(`${dest} exists. Verifying integrity now.`))
        const res = await rp({ url, resolveWithFullResponse: true })
        const contentLength = new Number(res.headers['content-length'])
        if (contentLength === fileStat.size) {
            log(chalk.yellow(`${dest} is integral!`))
            return
        }

        log(chalk.yellow(`${dest} exists. File on server is ${contentLength} bytes but local is ${fileStat.size} bytes. Redownloading now.`))
    }

    return new Promise((resolve, reject) => {
        log(`${dest} are being downloaded...`)
        request(url).pipe(fs.createWriteStream(dest)).on('close', () => {
            resolve()
        })
    })
}

const itCatcher = async saveDir => {
    if (!saveDir) throw new Error('save dir must be type of path like')

    const listUrl = 'https://unsplash.it/list'
    const listFile = path.join(saveDir, 'list.json')

    if (!fs.existsSync(listFile)) {
        fs.writeFileSync(listFile, '')
    }

    log('Solving the picture list...')

    const listStat = await stat(listFile)
    let listStr
    if (Date.now() - listStat.mtime > 1000 * 60 * 60 * 24) {
        listStr = await rp(listUrl)
        await writeFile(listFile, listStr)
    } else {
        listStr = await readFile(listFile)
    }
    const list = JSON.parse(listStr)
    const picList = list.map(i => i.post_url + '/download?force=true')
    const picSum = picList.length
    let downloaded = 0

    log(`There are ${picSum} pictures in total.`)

    return async.mapLimit(picList, 5, async src => {
        const dest = path.join(saveDir, path.dirname(src).split('/')[4] + '.jpg')
        return new Promise((resolve, reject) => {
            async.retry({ times: 3, interval: 1000 }, async () => {
                await download(src, dest)
                downloaded += 1
                log(chalk.green(`(${downloaded}/${picSum}) done!`), dest)
            }, err => {
                if (err) reject(err)
                else resolve()
            })
        })
    }, err => {
        if (err) throw new Error(err)
    })
}

if (!module.parent) itCatcher(path.join(__dirname, '../saved'))

export default itCatcher
