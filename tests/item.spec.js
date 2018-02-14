import fs from 'fs-extra'
import Item from '../app/item'
import nconf from '../app/config'
import { expect } from 'chai'
import sinon from 'sinon'
import pathjoin from 'path.join'
import * as db from '../app/db'
import moment from 'moment'

import "babel-polyfill"

/*
raw.jpg : raw 1x1 jpg file
20170213_140832.jpg : no_exif
exif.jpg : 08/06/2017 15:17
*/

describe('processing files in ./resources', () => {

    let copyMock, moveMock, checkIfExistsInDbMock, insertInDbMock, src, exp

    beforeEach(() => {
        insertInDbMock = sinon.mock(db).expects('dq')
            .withArgs(sinon.match.any, sinon.match.any, 'insertInDb')
            .once()
            .resolves()

        checkIfExistsInDbMock = sinon.mock(db).expects('dqf')
            .withArgs(sinon.match.any, sinon.match.any, 'checkIfExistsInDb')
            .once()
            .resolves({ alreadyExists: 0 })

        copyMock = sinon.mock(fs).expects('copy')
            .withArgs(src, pathjoin(nconf.get('dir').output, exp.outputPath, exp.outputFilename))
            .once()

        moveMock = sinon.mock(fs).expects('move')
            .withArgs(src, pathjoin(nconf.get('dir').backup, moment.utc().format('YYYYMMDD')))
            .once()
    })

    afterEach(() => {
        fs.copy.restore()
        fs.move.restore()
        db.dq.restore()
        db.dqf.restore()
    })

    xdescribe('raw.jpg', () => {
        before(() => {
            src = pathjoin(__dirname, '/resources/raw.jpg')
            exp = {
                outputFilename: '2018-02-02_15h10__70c753.jpg',
                outputPath: '2018/02 - fevrier',
                hash: '70c7532c0edb28f8b063ed0ba61a3de1',
                mediaType: 'photo',
                lastModifFrom: 'fs'
            }
        })
        it('should process', async() => {
            let item = new Item(src)
            await item.process()
            verify(item, exp)
        })
    })

    describe('20170213_140832.jpg', () => {
        before(() => {
            src = pathjoin(__dirname, '/resources/20170213_140832.jpg')
            exp = {
                outputFilename: '2017-02-13_14h08__70c753.jpg',
                outputPath: '2017/02 - fevrier',
                hash: '70c7532c0edb28f8b063ed0ba61a3de1',
                mediaType: 'photo',
                lastModifFrom: 'filename'
            }
        })
        it('should process', async() => {
            let item = new Item(src)
            await item.process()
            verify(item, exp)
        })
    })

    describe('20210102_133758.JPG', () => {
        before(() => {
            src = pathjoin(__dirname, '/resources/20210102_133758.JPG')
            exp = {
                outputFilename: '2021-01-02_13h37__37dd8e.jpg',
                outputPath: '2021/01 - janvier',
                hash: '37dd8e1415bf2999069c10210e068fe1',
                mediaType: 'photo',
                lastModifFrom: 'filename'
            }
        })
        it('should process', async() => {
            let item = new Item(src)
            await item.process()
            verify(item, exp)
        })
    })

    describe('exif.jpg', () => {
        before(() => {
            src = pathjoin(__dirname, '/resources/exif.jpg')
            exp = {
                outputFilename: '2018-02-25_14h23__0506ca.jpg',
                outputPath: '2018/02 - fevrier',
                hash: '0506ca4c0cdb4409db254955492e1d08',
                mediaType: 'photo',
                lastModifFrom: 'exif'
            }
        })
        it('should process', async() => {
            let item = new Item(src)
            await item.process()
            verify(item, exp)
        })
    })

    xdescribe('small.mp4', () => {
        before(() => {
            src = pathjoin(__dirname, '/resources/small.mp4')
            exp = {
                outputFilename: '2018-02-06_15h29__a3ac7d.mp4',
                outputPath: '2018/02 - fevrier',
                hash: 'a3ac7ddabb263c2d00b73e8177d15c8d',
                mediaType: 'video',
                lastModifFrom: 'fs'
            }
        })
        it('should process', async() => {
            let item = new Item(src)
            await item.process()
            verify(item, exp)
        })
    })

    const verify = (item, exp) => {
        expect(item).to.be.an('object')
        expect(item.src).to.eq(src)
        expect(item.mediaType).to.equal(exp.mediaType)
        expect(item.alreadyExists).to.be.false
        expect(item.exif).not.to.be.null

        expect(item.lastModif).to.be.an('object')
        expect(item.lastModif.isValid()).to.be.true
        expect(item.lastModifFrom).to.equal(exp.lastModifFrom)

        expect(item.outputPath).to.equal(exp.outputPath)
        expect(item.outputFilename).to.equal(exp.outputFilename)

        checkIfExistsInDbMock.verify()
        insertInDbMock.verify()
        copyMock.verify()
        moveMock.verify()
    }
})