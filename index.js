//globals
objClasses = {};
objClassesCall = {};
GeneralHandling = require('./lib/GeneralHandling.js');
CfwObject = require('corefwnode/lib/CfwObject.js');
lib = {};

var Language = require('./lib/Language.js'),
    Session = require('./objects/Session.js'),
    LoggingClass = require('./lib/Logging.js'),
    ErrorControl = require('./lib/ErrorControl.js'),
    moment = require('moment'),
    coreModules = require('./modules');

module.exports = class Library
{
    constructor(config)
    {
        var me = this;

        console.log = function(...args)
        {
            process.stdout.write(moment().format('YYYY-MM-DD HH:mm:ss.SSS') + ': ');
            Object.getPrototypeOf(this).log.call(this, ...args);
        }

        lib = me;

        me.ErrorControl = ErrorControl;

        process.on('unhandledRejection', (reason, p) =>
        {
            console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
            // application specific logging, throwing an error, or other logic here
        });

        me.config = config;

        me.SessionClass = Session;

        me.LoggingClass = LoggingClass;

        //init db
        me.db = new coreModules.MySQL(config.mysql);

        (async () =>
        {
            await me.init();
            me.start();
        })();
    }

    async init()
    {
        var me = this;

        objClassesCall = require('./objects')();

        for (var key in objClassesCall)
        {
            var obj = objClassesCall[key];
            objClasses[obj.origName] = obj.class
        }

        try
        {
            //init language
            var lang = new Language();
            await lang.fillTrans();
            me.lang = lang;
            me.unregisteredSession = new Session();

            me.afterinit();
        }
        catch (error)
        {
            console.log(error.message);
        }
    }

    afterinit()
    {

    }

    start()
    {

    }
}
