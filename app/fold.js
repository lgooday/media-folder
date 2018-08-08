import glob from 'glob'
import Promise from 'bluebird'
import _ from 'lodash'
import async from 'async'
import nconf from './config'
import Item from './item'
import { mediaTypes } from './constant'

const globAsync = Promise.promisify(glob)

export function getFilesInFolder() {
	const p = nconf.get('dir').input
	let exts = '/**/*.{'

	exts += _.chain(mediaTypes)
		.values()
		.flattenDeep()
		.uniq()
		.map(ext => {
			ext = ext.replace('.', '')
			return [ext.toLowerCase(), ext.toUpperCase()]
		})
		.value()

	exts += '}'

	return globAsync(`${p}${exts}`, { ignore: '**/*/@eaDir/**/*' })
}

export function processFiles(files) {
	if (files && files.length) {
		return new Promise((res, rej) => {
			let count = 0
			console.info(`processing ${files.length} files.`)

			const q = async.queue((file, next) => {
				// console.log(`processing "${file}"`)
				return new Item(file).process()
					.then(() => {
						console.log(`${++count}/${files.length} ok.`)
						next()
					})
					.catch(rej)
			}, nconf.get('batch').concurrency)

			q.drain = res

			_.each(files, file => q.push(file))
		})
	}
	console.log('no media here.')
	return Promise.resolve()
}
