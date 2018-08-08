import assert from 'assert'
import console from 'better-console'
import async from 'async'
import moment from 'moment'
import commandLineArgs from 'command-line-args'
import db from 'oz-mysql'
import * as folder from './fold'
import nconf from './config'
import dumper from './dump'

const cla = commandLineArgs([
	{ name: 'dump', type: String }
])

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

	db.init(nconf.get('mysql'))

	if (cla && cla.dump) {
		const date = moment(cla.dump, 'YYYY-MM-DD', true)

		if (date.isValid()) {
			const dumpq = async.queue((date, next) => {
				dumper.dump(date)
					.then(next)
					.catch(console.error)
			}, 1)

			dumpq.drain = () => {
				console.log('finished.')
			}

			while (date <= moment()) {
				dumpq.push(date.clone())
				date.add(1, 'day')
			}
		} else {
			console.error('not a valid date')
		}
	} else {
		folder.getFilesInFolder()
			.then(folder.processFiles)
			.then(dumper.dump)
			.then(db.close)
			.then(() => console.log('finished.'))
			.catch(console.error)
	}
}

main()
