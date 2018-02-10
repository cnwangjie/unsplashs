#!/usr/bin/env node
'use strict';

if (process.argv.length < 3) {
    console.log(`Usage: unsplash [save path]`)
    process.exit(0)
}
const {existsSync} = require('fs')
const {join} = require('path')
const itCatcher = existsSync('../dist/itCatcher.js') ?
                     require('../dist/itCatcher.js').default :
                     require('../src/itCatcher.js').default


itCatcher(join(process.cwd(), process.argv[2]))
