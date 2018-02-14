import nconf from '../app/config'
import { expect } from 'chai'
import sinon from 'sinon'
import { t } from '../app/fold'
import * as folder from '../app/fold'

import "babel-polyfill"

describe('test main', () => {

    describe('fold.js', () => {
        it('should glob files in ./resources', async() => {
            let files = await folder.getFilesInFolder()
            expect(files).to.have.lengthOf(6)
        })
    })

})