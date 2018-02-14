import md5File from 'md5-file'
import exif from 'exif'
import path from 'path'
import pathjoin from 'path.join'
import fs from 'fs-extra'
import moment from 'moment'
import { dq, dqf, test } from './db'
import _ from 'lodash'
import Promise from 'bluebird'
import nconf from './config'
import { exifAllowedType, mediaTypes, months } from './constant'

export default class Item {

    constructor(src) {
        this.src = src;
    }

    init() {
        try {
            this.ext = path.extname(this.src).toLowerCase()
            this.baseName = path.basename(this.src)
            this.dirName = path.dirname(this.src)
            this.hash = md5File.sync(this.src)
            this.getMediaType()
        } catch (err) {
            throw err
        }
        return Promise.resolve()
    }

    thrw() {
        throw new Error('err')
    }

    process() {
        return this.init()
            .then(() => { return this.checkIfExistsInDb() })
            .then(() => { return this.prepare() })
            .then(() => { return this.copyToDest() })
            .then(() => { return this.insertInDb() })
            .then(() => { return this.moveToBackup() })
            .then(() => {
                return new Promise(res => setTimeout(res, 0))
            })
    }

    checkIfExistsInDb() {
        return dqf('SELECT COUNT(hash) AS alreadyExists FROM item WHERE hash = ?', [this.hash], 'checkIfExistsInDb')
            .then(
                (row) => { this.alreadyExists = row.alreadyExists !== 0 }
            )
    }

    insertInDb() {
        return dq('INSERT IGNORE INTO item SET ?', this.toDb(), 'insertInDb')
    }

    prepare() {
        return Promise
            .all([this.tryFs(), this.tryExif(), this.tryFilename()])
            .then(
                (pRes) => {

                    if (pRes[1] && pRes[1].verdict)
                        this.exif = pRes[1].exif

                    if (pRes[2] && pRes[2].verdict) {
                        this.lastModif = pRes[2].dt
                        this.lastModifFrom = 'filename'
                    }

                    if (!this.lastModif &&
                        pRes[1] &&
                        pRes[1].verdict &&
                        pRes[1].exif && pRes[1].exif.exif &&
                        pRes[1].exif.exif.DateTimeOriginal) {

                        let dt = moment(pRes[1].exif.exif.DateTimeOriginal, 'YYYY:MM:DD HH:mm:ss');

                        if (dt.isValid()) {
                            this.lastModif = dt;
                            this.lastModifFrom = 'exif';
                        }

                    }

                    if (!this.lastModif) {
                        this.lastModif = pRes[0];
                        this.lastModifFrom = 'fs';
                    }
                }
            )
            .then(() => {

                this.outputPath = pathjoin(this.lastModif.format('YYYY'),
                    this.lastModif.format('MM') +
                    ' - ' + months[this.lastModif.format('M')]
                )

                this.outputFilename =
                    this.lastModif.format('YYYY-MM-DD_HH[h]mm') +
                    '__' +
                    this.hash.substring(0, 6) +
                    this.ext.toLowerCase()

                this.absBackupPath = pathjoin(
                    nconf.get('dir').backup,
                    moment.utc().format('YYYYMMDD')
                )

                // console.log(this)
            })
    }

    tryFilename() {
        return new Promise((res) => {

            let filename = this.baseName.toLocaleLowerCase().replace(this.ext, '')

            if (filename.length === 15) {

                let dt = moment(filename, 'YYYYMMDD_HHmmss', true)

                if (dt.isValid()) res({ verdict: true, dt })
                else res({ verdict: false, reason: 'invalid' })

            } else res({ verdict: false, reason: 'len' })

        })
    }

    tryFs() {

        return new Promise((res, rej) => {

            try {
                fs.stat(this.src, (err, stats) => {

                    if (err) rej({ type: 'tryFs', err })

                    this.fileSize = stats.size

                    let m = moment(stats.mtime)

                    if (m.isValid()) res(m)
                    else rej({ type: 'tryFs', err: stats.mtime })

                });

            } catch (err) {
                rej({ type: 'tryFs', err })
            }

        })

    }

    tryExif() {

        return new Promise((res) => {

            if (exifAllowedType.indexOf(this.ext) >= 0) {

                try {

                    new exif.ExifImage({ image: this.src }, (err, exif) => {
                        if (err) res({ verdict: false, err })
                        else res({ verdict: true, exif })
                    });
                } catch (err) {
                    res({ verdict: false, err })
                }

            } else {
                return res({ verdict: false });
            }

        });

    }

    toString() {
        return this
    }

    getMediaType() {

        this.mediaType = 'unknown';

        _.chain(mediaTypes)
            .each((md, k) => {
                if (md.indexOf(this.ext) >= 0) {
                    this.mediaType = k;
                    return false;
                }
            })
            .value();
    }

    toDb() {
        return {
            hash: this.hash,
            name: this.baseName,
            exif: JSON.stringify(this.exif),
            dateinserted: moment.utc().toDate(),
            datecreated: this.lastModif.toDate(),
            datecreatedfrom: this.lastModifFrom,
            ext: this.ext,
            inputdir: this.dirName,
            mediatype: this.mediaType,
            outputpath: this.outputPath,
            outputfilename: this.outputFilename,
            size: this.fileSize
        };
    }

    copyToDest() {
        if (this.alreadyExists) {
            return Promise.resolve();
        } else {
            return fs.copy(this.src, pathjoin(nconf.get('dir').output, this.outputPath, this.outputFilename))
        }
    }

    moveToBackup() {
        return fs.move(this.src, this.absBackupPath, { overwrite: true })
    }

}