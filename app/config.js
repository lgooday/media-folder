import nconf from 'nconf'
import pathjoin from 'path.join'

if (process.env.NODE_ENV === 'test') {
	nconf.overrides({
		dir: {
			input: pathjoin(__dirname, '../tests/resources'),
			output: 'dir/output',
			backup: 'dir/backup'
		}
	})
} else {
	nconf.file({ file: pathjoin(__dirname, '/../conf.json') })
}

export default nconf
