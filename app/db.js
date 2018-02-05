"use strict";

import nconf from './config';
import mysql from 'mysql';

if (nconf.get('mysql')) {
    let pool = mysql.createPool(nconf.get('mysql'))
}

export function dq(query, params, tag) {

    return new Promise((res, rej) => {

        pool.getConnection(function(poolErr, connection) {

            if (poolErr) rej(poolErr);

            let q = connection.query(query, params, (qErr, rows) => {
                if (qErr) rej(qErr)
                else res(rows)
            });

            // console.log(q.sql);

            connection.release();
        });


    });
}

export function dqf(query, params, tag) {

    return new Promise((res, rej) => {
        return dq(query, params, tag)
            .then(
                (rows) => {
                    if (rows && rows.length === 1) {
                        res(rows[0]);
                    } else {
                        rej('not 1 item returned');
                    }
                },
                rej
            );
    });
}

export function dbclose() {
    pool.end(function(err) {
        if (err) {
            console.error(err)
        }
    });
}