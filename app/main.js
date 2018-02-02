import Item from './item'
import nconf from './config'
import glob from 'glob'
import _ from 'lodash'
import Promise from 'bluebird'
import console from 'better-console'
import async from 'async'
import moment from 'moment'
import { dbclose } from './db'
import dump from './dump'
import assert from 'assert'
import commandLineArgs from 'command-line-args'

let globAsync = Promise.promisify(glob)

const cla = commandLineArgs([
    { name: 'dump', type: String }
])

main();

function main() {

    assert(nconf.get('mysql'), 'missing db')
    assert(nconf.get('dir'), 'missing dir')
    assert(nconf.get('batch'), 'missing batch')

    console.info('------------------------------------------------------------------')
    console.info(moment.utc().format())
    console.info(nconf.get('mysql').host + ' / ' + nconf.get('mysql').database)
    console.info(nconf.get('dir').input)
    console.info('concurrency : ' + nconf.get('batch').concurrency)
    console.info('------------------------------------------------------------------')

    if (cla && cla.dump) {

        let date = moment(cla.dump, "YYYY-MM-DD", true);

        if (date.isValid()) {

            let dumpq = async.queue((date, next) => {
                dump(date)
                    .then(next)
                    .catch(console.error)
            }, 1);

            dumpq.drain = () => { console.log('finished.') };

            while (date <= moment()) {
                dumpq.push(date.clone());
                date.add(1, 'day');
            }

        } else {
            console.error('not a valid date');
        }

    } else {
        getFilesInFolder()
            .then(processFiles)
            .then(dump)
            .then(dbclose)
            .then(() => console.log('finished.'))
            .catch(console.error)
    }
}

function processFiles(files) {
    if (files && files.length) {
        return new Promise((res, rej) => {

            let count = 0;
            console.info(`processing ${files.length} files.`)

            var q = async.queue((file, next) => {
                //console.log(`processing "${file}"`)
                processFile(file)
                    .then(() => {
                        console.log(`${++count}/${files.length} ok.`)
                        next()
                    })
                    .catch(rej)
            }, nconf.get('batch').concurrency);

            q.drain = res;

            _.each(files, (file) => q.push(file))

        })
    } else {
        console.log('no media here.')
        return Promise.resolve()
    }
}

function processFile(file) {
    return new Item(file).process()
}

function getFilesInFolder() {
    return globAsync(`${nconf.get('dir').input}/**/*.{JPG,jpg,jpeg,mp4,3gp,MPG,AVI,MOV}`, { ignore: '**/*/@eaDir/**/*' })
}