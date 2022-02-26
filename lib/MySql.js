var mysql = require('promise-mysql'),
    SqlString = require('sqlstring');

module.exports = class MySQLConn
{
    constructor(config)
    {
        var me = this;

        var db = mysql.createPool(
        {
            connectionLimit: config.connectionLimit,
            host: config.host,
            user: config.username,
            password: config.password,
            database: config.dbname,
            port: config.port,
            dateStrings: true, //if we want dates as strings
            connectTimeout: 20000,
            acquireTimeout: 20000,
            queryFormat: function(query, values)
            {
                var data = query;
                if (!values)
                {
                    data = query;
                }
                else
                {
                    if (query.indexOf('?') != -1)
                    {
                        data = SqlString.format(query, values, this.config.stringifyObjects, this.config.timezone);
                    }
                    else
                    {
                        data = query.replace(/\:(\w+)/g, function(txt, key)
                        {
                            if (values.hasOwnProperty(key))
                            {
                                return this.escape(values[key]);
                            }
                            return txt;
                        }.bind(this));
                    }
                }
                console.log(data)
                console.log('connected as id ' + this.threadId);
                return data;
            }
        });

        db.dbname = config.dbname;

        db.query = function(...args)
        {
            var meSec = this;
            return new Promise(async (resolve, reject) =>
            {
                try
                {
                    var res = await Object.getPrototypeOf(this).query.call(meSec, ...args);
                    resolve(res);
                }
                catch (e)
                {
                    reject(
                    {
                        sqlError: e
                    });
                }
            });
        }

        db.begin = function(session)
        {
            return new Promise(async (resolve, reject) =>
            {
                try
                {
                    if (typeof session == 'undefined')
                    {
                        reject(
                        {
                            error: true,
                            notice: 'begin excepts session'
                        });
                        return;
                    }

                    var connection = await db.getConnection();

                    connection.commitInstance = 0;

                    connection.dbname = db.dbname;
                    connection.query = db.query;

                    session.tranDb = connection;

                    connection.begin = function()
                    {
                        //dummy function, as begin was already called and mysql does not support nested transactions, return existing connection
                        connection.commitInstance++;
                        return connection;
                    }

                    connection.rollback = function()
                    {
                        return new Promise(async (resolve, reject) =>
                        {
                            try
                            {
                                if (connection.commitInstance > 0)
                                {
                                    connection.commitInstance--;
                                    resolve(db);
                                    return;
                                }
                                await connection.query("ROLLBACK");
                                connection.release();
                                session.tranDb = null;
                                resolve(db);
                            }
                            catch (e)
                            {
                                reject(e);
                            }
                        })
                    }

                    connection.commit = function()
                    {
                        return new Promise(async (resolve, reject) =>
                        {
                            try
                            {
                                if (connection.commitInstance > 0)
                                {
                                    connection.commitInstance--;
                                    resolve(db);
                                    return;
                                }
                                await connection.query("COMMIT");
                                connection.release();
                                session.tranDb = null;
                                resolve(db);
                            }
                            catch (e)
                            {
                                reject(e);
                            }
                        })
                    }

                    await connection.query("START TRANSACTION");

                    resolve(connection);
                }
                catch (e)
                {
                    console.log(e);
                    reject(e);
                }
            })
        }

        return db;
    }
}