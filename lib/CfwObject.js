/**
 * @todo Make this an abstract class
 * @author  Dario Filkovic <dfilkovi@gmail.com>
 *
 * @since 1.0
 *
 * @package CoreFw
 */
const {translate} = require('../helpers/translate');

class CfwObject {
    /**
     * Get objects from Registry
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @return void
     */
    constructor(session)
    {
        var me = this;

        me.events = {};
        me.ownerActionGlob = false;
        me.companyActionGlob = false;
        me.functionNameGlob = false;
        me.modelLoaded = false;
        me.assocData = {};

        me.objectNameGlob = this.constructor.name;

        if (typeof session == 'undefined' && me.objectNameGlob != 'Session' && me.objectNameGlob != 'Translator')
        {
            return new Proxy(this,
                {
                    get: function get(target, name)
                    {
                        return function wrapper()
                        {
                            throw ('Please provide session for object instantiation: ' + me.objectNameGlob + ' ' + target);
                        }
                    }
                });
        }

        me.lib = lib;
        me.session = session;
        if (typeof me.session == 'undefined') me.session = me.lib.unregisteredSession;
        if (typeof me.session != 'undefined')
        {
            if (me.session.tranDb && me.session.tranDb.dbname == me.session.db.dbname) me.db = me.session.tranDb;
            else me.db = me.session.db;
        }
        else
        {
            me.db = lib.db;
        }
        me.props = lib.props;
        if (typeof me.tableConf != 'undefined')
        {
            me.tableConfig = me.tableConf();
            if (typeof me.tableConfig.tableName != 'undefined') me.tableName = me.tableConfig.tableName;
            if (typeof me.tableConfig.id != 'undefined') me.idField = me.tableConfig.id;
        }

        me.config = lib.config;

        return new Proxy(this,
            {
                get: function get(target, name)
                {
                    if (typeof me[name] == 'function')
                    {
                        return function wrapper()
                        {
                            return me.__call(name, arguments);
                            /*
                      var args = Array.prototype.slice.call(arguments);
                      console.log(name);
                            */
                        }
                    }
                    else return me[name];
                }
            });
    }

    /**
     * Magic method that gets called every time a (method) is triggered
     *
     * This is MOST important, if you want to use out-of-the box ACL management for objects and methods, functions should be named protected
     * Every time a is triggered __call gets fired before which checks privilage on module.exports = class and method
     * NOTICE!!! Observer is also called here, every function that you want to observe needs to be protected to get __call method to be fired
     *
     * @see Observer
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     * @param String methodName
     * @param mixed[] argumentsin
     * @return void
     */
    __call(methodName, argumentsin)
    {
        var me = this;

        if (methodName == 'translate' || methodName == 'on')
        {
            return me[methodName](...argumentsin);
        }

        return new Promise((resolve, reject) =>
        {
            me.methodName = (me.functionNameGlob != false) ? me.functionNameGlob : methodName;

            //check if method really exists
            if (typeof me[methodName] == 'undefined')
            {

                reject(
                    {
                        'error': true,
                        'notice': translate('METHODDOESNOTEXIST'),
                        'methodname': methodName,
                        'classname': me.objectNameGlob
                    });
                return;
            }

            try
            {
                var inst = me[methodName](...argumentsin);
                if (typeof inst != 'undefined' && typeof inst.then != 'undefined')
                {
                    inst.then(function(val)
                    {
                        resolve(val);
                        return;
                    }).catch(function(val)
                    {
                        reject(val);
                        return;
                    });
                }
                else
                {
                    console.log('Not an promise')
                    reject(
                        {
                            error: true,
                            notice: translate('NOTANPROMISE'),
                            methodName: methodName,
                            objectNameGlob: me.objectNameGlob
                        });
                }
            }
            catch (e)
            {
                console.log(e);
                reject(
                    {
                        error: true,
                        notice: e.toString()
                    });
            }
        });
    }
}

module.exports = {
    CfwObject,
}
