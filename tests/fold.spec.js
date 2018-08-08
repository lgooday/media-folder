import { expect } from 'chai'
import * as folder from '../app/fold'

import 'babel-polyfill'

describe('fold.js', () => {
	it('should glob files in ./resources', async () => {
		const files = await folder.getFilesInFolder()
		expect(files).to.have.lengthOf(6)
	})
})
