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
    it('raw.jpg', async() => {
        let item = new Item(src)
        await item.process()
        verify(item)
    })

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
    it('should process file correctly', async() => {
        let item = new Item(src)
        await item.process()
        verify(item)
    })

    const verify = (item) => {
        expect(item).to.be.an('object')
        expect(item.src).to.eq(src)
        expect(item.mediaType).to.eq(exp.mediaType)
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