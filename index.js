//globals
const Session = require('../objects/Session');
lib = {};


/**
 * This class is a copy/paste of the class from corefwlib, authored by Leapbit.
 */
class CoreFw {
    constructor(config) {
        var me = this;
        lib = me;

        process.on('unhandledRejection', (reason, p) =>
        {
            console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
            // application specific logging, throwing an error, or other logic here
        });

        me.config = config;
        me.SessionClass = Session;

        (async () =>
        {
            await me.init();
            me.start();
        })();
    }

    async init()
    {
        var me = this;

        try
        {
            me.unregisteredSession = new Session();
            me.afterinit();
        }
        catch (error)
        {
            console.log(error.message);
        }
    }

    afterinit() {}

    start() {}
}

module.exports = {
    CoreFw,
}
