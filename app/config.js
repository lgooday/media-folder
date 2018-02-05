import nconf from 'nconf'
import fs from 'fs-extra'

if (process.env.NODE_ENV === 'test') {
    nconf.overrides({
        "dir": {
            "input": "dir/input",
            "output": "dir/output",
            "backup": "dir/backup"
        }
    })
} else {
    nconf.file({ file: __dirname + '/../conf.json' })
}

export default nconf