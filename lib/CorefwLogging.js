var zlib = require('zlib'),
    moment = require('moment');

module.exports = class CoreFwLogging
{
    constructor(session)
    {
        var me = this;
        me.session = session;

        me.lib = me.session.lib;
        me.config = me.session.config;

        me.consoleLog = false;
        me.dataLog = [];

        me.startTime = new Date().getTime();

        if (typeof me.config.consoleLog != 'undefined' && me.config.consoleLog == true) me.consoleLog = true;

        return new Proxy(this,
        {
            get: function get(target, name)
            {
                if (typeof me[name] == 'function')
                {
                    return function wrapper()
                    {
                        if (me.consoleLog == true || name == 'logData') return me[name](...arguments);
                    }
                }
                else return me[name];
            }
        });
    }

    /**
     * logs a variable to the console
     *
     * @param mixed $data,... unlimited OPTIONAL number of additional logs [...]
     * @return void
     */
    log(data)
    {
        return this._log('info', data);
    }

    /**
     * logs a warning to the console
     *
     * @param mixed $data,... unlimited OPTIONAL number of additional logs [...]
     * @return void
     */
    warn(data)
    {
        return this._log('warn', data);
    }

    /**
     * logs an error to the console
     *
     * @param mixed $data,... unlimited OPTIONAL number of additional logs [...]
     * @return void
     */
    error(data)
    {
        return this._log('error', data);
    }

    /**
     * sends an info log
     *
     * @param mixed $data,... unlimited OPTIONAL number of additional logs [...]
     * @return void
     */
    info(data)
    {
        return this._log('info', data);
    }

    /**
     * internal logging call
     *
     * @param string $type
     * @return void
     */
    _log(type, data)
    {
        var me = this;
        var obj = {
            type: type,
            time: moment().valueOf(),
            data: data
        };
        me.dataLog.push(obj);
    }

    end()
    {
        this._writeHeader();
    }

    _writeHeader()
    {
        var me = this;
        var json = {
            type: 'info',
            time: moment().valueOf(),
            data:
            {
                title: 'total log count: ' + me.dataLog.length + ', total execution time: ' + (new Date().getTime() - me.startTime) + 's'
            }
        };

        me.dataLog.unshift(json);

        var result = zlib.deflateSync(JSON.stringify(me.dataLog));

        var data = Buffer.from(result).toString('base64');
        if ((data.length / 1000) > 3)
        {
            var chunkCount = parseInt((data.length / 1000) / 3);
            chunkCount = me.dataLog.length / chunkCount;

            var dataChunks = Array.from(Array(Math.ceil(me.dataLog.length / chunkCount)), (_, i) => me.dataLog.slice(i * chunkCount, i * chunkCount + chunkCount));

            for (var i = 0; i < dataChunks.length; i++)
            {
                var chunk = dataChunks[i];
                var resultSec = zlib.deflateSync(JSON.stringify(chunk));
                var data = Buffer.from(resultSec).toString('base64');
                me.session.res.header('X-CoreFwLogger-Data-' + i, data);
            }
        }
        else
        {
            me.session.res.header('X-CoreFwLogger-Data-0', data);
        }
    }
}