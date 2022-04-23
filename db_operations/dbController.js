import sqlite3 from 'sqlite3'

const db = new sqlite3.Database('./db_operations/botdb.db', sqlite3.READ_WRITE, (error) => {
    return console.log(error)
})

export const showStat = async () => {
    let query = `select city, requestAmount from statistics order by requestAmount desc limit 10;`
    // return await db.all(query,[], error => {
    //     console.log(error)
    // })
    return new Promise((resolve, reject) => {
        db.all(query, function(err, rows) {
            resolve(rows);
        })
    })
}

export const insertStat = async (city_id,city,city_idcheck) => {
    let query = `INSERT INTO statistics (city_id, city, requestamount)
                 VALUES(?,?,1)
                ON CONFLICT(city_id)
                DO UPDATE SET requestamount=(select requestamount from statistics where city_id = ? ) + 1`
    return new Promise((resolve, reject) => {
        db.run(query,[city_id,city,city_idcheck], error =>{
            return console.log(error)
        })
    })
}

export const deleteStat = async () => {
    let query = `delete from statistics where 1`
    return new Promise((resolve, reject) => {
        db.run(query,[], error =>{
            return console.log(error)
        })
    })
}

export const closeDB = async () => {
    db.close((error) =>{
        return console.log(error)
    })
}

