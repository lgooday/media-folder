'use strict'

import Item from '../app/item'
import { expect } from 'chai'
import sinon from 'sinon'
import md5File from 'md5-file'

describe('Item module', () => {

    let src = 'this/is/a/path.jpg'
    let hash = '1234F'
    let item
    let md5checkStub

    beforeEach(() => {
        md5checkStub = sinon.stub(md5File, 'sync')
        md5checkStub.returns(hash)
        item = new Item(src)
    })

    afterEach(() => {
        md5checkStub.restore()
    })

    describe('"constructor"', () => {
        it('should work with a valid path', () => {
            expect(item).to.be.an('object')
            expect(item.src).to.eq(src)
        })
    })

    describe('"init"', () => {
        it('should init', () => {
            item.init()
            expect(item.hash).to.eq(hash)

        })
    })

    describe('"getMediaType"', () => {
        it('should be "photo"', () => {
            item = new Item('test.jpg')
            item.init()
            expect(item.mediaType).to.eq('photo')
        })

        it('should be "video"', () => {
            item = new Item('test.mp4')
            item.init()
            expect(item.mediaType).to.eq('video')
        })

        it('should stay "unknown"', () => {
            item = new Item('test.ext')
            item.init()
            expect(item.mediaType).to.eq('unknown')
        })
    })

    describe('"media date extraction"', () => {

        describe('"tryFilename"', () => {

            it('should return wrong verdict due to length', () => {

                item = new Item('WRONGDATE')
                item.init()
                item.tryFilename()
                    .then((res) => {
                        expect(res.verdict).to.be.false
                        expect(res.reason).to.eq('len')
                    })

            })

            it('should return wrong verdict due to date parsing', () => {

                item = new Item('20171301 270059')
                item.init()
                item.tryFilename()
                    .then((res) => {
                        expect(res.verdict).to.be.false
                        expect(res.reason).to.eq('invalid')
                    })

            })

            xit('should return wrong verdict due to date parsing', () => {

                item = new Item('20170101_130059')
                item.init()
                item.tryFilename()
                    .then((res) => {
                        expect(res.verdict).to.be.true
                        expect(res.reason).to.eq('invalid')
                    })

            })

            xit('should return good verdict', () => {

                item = new Item('20170101_130059')
                item.init()
                item.tryFilename()
                    .then((res) => {
                        expect(res.verdict).to.be.true
                        expect(res.dt.isValid()).to.be.true
                    })

            })


        })



    })

})