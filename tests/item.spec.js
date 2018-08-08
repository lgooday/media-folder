import fs from 'fs-extra'
import { expect } from 'chai'
import sinon from 'sinon'
import pathjoin from 'path.join'
import moment from 'moment'
import db from 'oz-mysql'
import Item from '../app/item'
import nconf from '../app/config'

import 'babel-polyfill'

/*
raw.jpg : raw 1x1 jpg file
20170213_140832.jpg : no_exif
exif.jpg : 08/06/2017 15:17
*/

describe('processing files in ./resources', () => {
	let copyMock
	let moveMock
	let checkIfExistsInDbMock
	let insertInDbMock
	let src
	let exp

	const verify = (item, exp) => {
		expect(item).to.be.an('object')
		expect(item.src).to.eq(src)
		expect(item.mediaType).to.equal(exp.mediaType)
		expect(item.alreadyExists).to.be.false // eslint-disable-line no-unused-expressions
		expect(item.exif).not.to.be.null // eslint-disable-line no-unused-expressions

		expect(item.lastModif).to.be.an('object')
		expect(item.lastModif.isValid()).to.be.true // eslint-disable-line no-unused-expressions
		expect(item.lastModifFrom).to.equal(exp.lastModifFrom)

		expect(item.outputPath).to.equal(exp.outputPath)
		expect(item.outputFilename).to.equal(exp.outputFilename)

		checkIfExistsInDbMock.verify()
		insertInDbMock.verify()
		copyMock.verify()
		moveMock.verify()
	}

	beforeEach(() => {
		insertInDbMock = sinon.mock(db).expects('queryAll')
			.withArgs(sinon.match.any, sinon.match.any, 'insertInDb')
			.once()
			.resolves()

		checkIfExistsInDbMock = sinon.mock(db).expects('queryOne')
			.withArgs(sinon.match.any, sinon.match.any, 'checkIfExistsInDb')
			.once()
			.resolves({ alreadyExists: 0 })

		copyMock = sinon.mock(fs).expects('copy')
			.withArgs(src, pathjoin(nconf.get('dir').output, exp.outputPath, exp.outputFilename))
			.once()

		moveMock = sinon.mock(fs).expects('move')
			.withArgs(src, pathjoin(nconf.get('dir').backup, moment.utc().format('YYYYMMDD'), exp.filename))
			.once()
	})

	afterEach(() => {
		fs.copy.restore()
		fs.move.restore()
		db.queryAll.restore()
		db.queryOne.restore()
	})

	describe('raw.jpg', () => {
		before(() => {
			src = pathjoin(nconf.get('dir').input, '/raw.jpg')
			exp = {
				outputFilename: '2018-02-02_15h10__70c753.jpg',
				outputPath: '2018/02 - fevrier',
				hash: '70c7532c0edb28f8b063ed0ba61a3de1',
				mediaType: 'photo',
				lastModifFrom: 'fs',
				filename: 'raw.jpg'
			}
		})
		it('should process', async () => {
			const item = new Item(src)
			await item.process()
			verify(item, exp)
		})
	})

	describe('20170213_140832.jpg', () => {
		before(() => {
			src = pathjoin(nconf.get('dir').input, '20170213_140832.jpg')
			exp = {
				outputFilename: '2017-02-13_14h08__70c753.jpg',
				outputPath: '2017/02 - fevrier',
				hash: '70c7532c0edb28f8b063ed0ba61a3de1',
				mediaType: 'photo',
				lastModifFrom: 'filename',
				filename: '20170213_140832.jpg'
			}
		})
		it('should process', async () => {
			const item = new Item(src)
			await item.process()
			verify(item, exp)
		})
	})

	describe('20210102_133758.JPG', () => {
		before(() => {
			src = pathjoin(nconf.get('dir').input, '20210102_133758.JPG')
			exp = {
				outputFilename: '2021-01-02_13h37__37dd8e.jpg',
				outputPath: '2021/01 - janvier',
				hash: '37dd8e1415bf2999069c10210e068fe1',
				mediaType: 'photo',
				lastModifFrom: 'filename',
				filename: '20210102_133758.JPG'
			}
		})
		it('should process', async () => {
			const item = new Item(src)
			await item.process()
			verify(item, exp)
		})
	})

	describe('20140901_111132(0).jpg', () => {
		before(() => {
			src = pathjoin(nconf.get('dir').input, '20140901_111132(0).jpg')
			exp = {
				outputFilename: '2014-09-01_11h11__70c753.jpg',
				outputPath: '2014/09 - septembre',
				hash: '70c7532c0edb28f8b063ed0ba61a3de1',
				mediaType: 'photo',
				lastModifFrom: 'filename',
				filename: '20140901_111132(0).jpg'
			}
		})
		it('should process', async () => {
			const item = new Item(src)
			await item.process()
			verify(item, exp)
		})
	})

	describe('exif.jpg', () => {
		before(() => {
			src = pathjoin(nconf.get('dir').input, 'exif.jpg')
			exp = {
				outputFilename: '2018-02-25_14h23__0506ca.jpg',
				outputPath: '2018/02 - fevrier',
				hash: '0506ca4c0cdb4409db254955492e1d08',
				mediaType: 'photo',
				lastModifFrom: 'exif',
				filename: 'exif.jpg'
			}
		})
		it('should process', async () => {
			const item = new Item(src)
			await item.process()
			verify(item, exp)
		})
	})

	describe('small.mp4', () => {
		before(() => {
			src = pathjoin(nconf.get('dir').input, 'small.mp4')
			exp = {
				outputFilename: '2018-02-06_15h29__a3ac7d.mp4',
				outputPath: '2018/02 - fevrier',
				hash: 'a3ac7ddabb263c2d00b73e8177d15c8d',
				mediaType: 'video',
				lastModifFrom: 'fs',
				filename: 'small.mp4'
			}
		})
		it('should process', async () => {
			const item = new Item(src)
			await item.process()
			verify(item, exp)
		})
	})
})
