import nconf from 'nconf'

nconf.file({ file: __dirname + '/../conf.json' });

export default nconf;