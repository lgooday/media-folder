import path from 'path'
import fs from 'fs-extra'
import async from 'async'
import _ from 'lodash'
import moment from 'moment'
import db from 'oz-mysql'
import nconf from './config'

const TABLE_NAME = 'item'

function getFields() {
	return db.queryAll(`SHOW COLUMNS FROM ${TABLE_NAME}`)
}

function getData(date, batchNumber) {
	return db.queryAll(`SELECT * FROM ${TABLE_NAME} WHERE DATE(dateinserted) = ? LIMIT ? OFFSET ?`, [date.format('YYYY-MM-DD'), nconf.get('batch').dump, batchNumber * nconf.get('batch').dump])
}

function createStatements(fields, data) {
	return _.map(data, row => {
		return _.map(fields, field => {
			switch (typeof (row[field.Field])) {
				case 'string':
				case 'object':
					if (field.Type === 'datetime') {
						const d = moment(row[field.Field])

						if (d.isValid()) {
							return JSON.stringify(moment(row[field.Field]).format('YYYY-MM-DD HH:mm:ss'))
						}

						return 'NULL'
					}

					return JSON.stringify(row[field.Field])

				default:
					return row[field.Field]
			}
		})
	})
}

function dumpStatements(date, batchNumber, fields, rows) {
	if (rows && rows.length) {
		const _fields = _.map(fields, 'Field')

		const statementInserts = []

		_.each(rows, row => {
			statementInserts.push(`(${row.join(',')})`)
		})

		const statement = `INSERT INTO item(${_fields.join(',')})\nVALUES\n${statementInserts.join(',\n')}\n`

		const ouputFilePath = path.join(nconf.get('dir').output, '_dump', `dump_${date.format('YYYY_MM_DD')}_${batchNumber}.sql`)

		return fs.outputFile(ouputFilePath, statement)
	}
	return Promise.resolve()
}

function batch(date, batchNumber) {
	return new Promise((res, rej) => {
		async.auto({
			getFields: async.asyncify(getFields),
			getData: async.asyncify(() => {
				return getData(date, batchNumber)
			}),
			createStatements: ['getFields', 'getData', async.asyncify(results => {
				return createStatements(results.getFields, results.getData)
			})],
			dumpStatements: ['createStatements', async.asyncify(results => {
				return dumpStatements(date, batchNumber, results.getFields, results.createStatements)
			})]
		},
			(err, results) => {
				if (err) {
					rej(err)
				}

				if (results.getData.length === nconf.get('batch').dump) {
					return batch(date, ++batchNumber).then(res, rej)
				}
				res({
					date,
					count: batchNumber * nconf.get('batch').dump + results.getData.length // eslint-disable-line no-mixed-operators
				})
			})
	})
}

const dump = date => {
	return new Promise((res, rej) => {
		const targetDate = date || moment.utc()

		batch(targetDate, 0)
			.then(report => {
				console.log(`dumped ${report.date.format('YYYY-MM-DD')}, lines : ${report.count}`)
				res()
			})
			.catch(rej)
	})
}

export default { dump }
