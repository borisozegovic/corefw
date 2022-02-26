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
            await me.setProps();
            await me.setAclGroups();

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

    setProps()
    {
        var me = this;
        return new Promise((resolve, reject) =>
        {
            me.db.query("SELECT * FROM site_props", function(error, results)
            {
                if (error)
                {
                    console.log(error);
                    return;
                }

                me.props = {};
                for (var i = 0; i < results.length; i++)
                {
                    var row = results[i];
                    me.props[row.key] = row.value;
                }

                resolve();
            });
        });
    }

    async setAclGroups()
    {
        try
        {
            var me = this,
                acl = {},
                objects = [],
                groups = [];

            var results = await me.db.query("SELECT * FROM acl_objects o");

            for (var i = 0; i < results.length; i++)
            {
                objects.push(results[i]);
            }

            results = await me.db.query("SELECT * FROM acl_groups p");

            for (var i = 0; i < results.length; i++)
            {
                groups.push(results[i]);
            }

            for (var x = 0; x < groups.length; x++)
            {
                var group = groups[x];
                var groupId = group.groupId;

                if (typeof acl[groupId] == 'undefined') acl[groupId] = {};

                await me.setPrivilagesByGroup(groupId, acl, objects);
            }

            me.acl = acl;
        }
        catch (error)
        {
            return {
                error: true,
                notice: error.toString()
            };
        }
    }

    async setPrivilagesByGroup(groupId, acl, objects)
    {
        var me = this;
        try
        {
            var privilages = {};

            var results = await me.db.query("SELECT * FROM acl_privilages p WHERE p.groupId=?", [groupId]);

            for (var i = 0; i < results.length; i++)
            {
                var row = results[i];
                privilages[row.objectId] = row;
            }

            for (var i = 0; i < objects.length; i++)
            {
                var value = objects[i];
                if (typeof acl[groupId][value['objectName']] == 'undefined') acl[groupId][value['objectName']] = {};
                if (typeof privilages[value['objectId']] != 'undefined')
                {
                    if (typeof value['objectFunction'] != 'undefined' && value['objectFunction'] != '')
                    {
                        acl[groupId][value['objectName']][value['objectFunction']] = {
                            'insertAction': privilages[value['objectId']]['insertPrivilage'],
                            'updateAction': privilages[value['objectId']]['updatePrivilage'],
                            'deleteAction': privilages[value['objectId']]['deletePrivilage'],
                            'instantiate': privilages[value['objectId']]['instantiate'],
                            'ownerAction': privilages[value['objectId']]['ownerAction'],
                            'companyAction': privilages[value['objectId']]['companyAction']
                        };
                    }
                    else
                    {
                        acl[groupId][value['objectName']]['insertAction'] = privilages[value['objectId']]['insertPrivilage'];
                        acl[groupId][value['objectName']]['updateAction'] = privilages[value['objectId']]['updatePrivilage'];
                        acl[groupId][value['objectName']]['deleteAction'] = privilages[value['objectId']]['deletePrivilage'];
                        acl[groupId][value['objectName']]['instantiate'] = privilages[value['objectId']]['instantiate'];
                        acl[groupId][value['objectName']]['ownerAction'] = privilages[value['objectId']]['ownerAction'];
                        acl[groupId][value['objectName']]['companyAction'] = privilages[value['objectId']]['companyAction'];
                    }
                }
                else
                {
                    if (typeof value['objectFunction'] != 'undefined' && value['objectFunction'] != '')
                    {
                        acl[groupId][value['objectName']][value['objectFunction']] = {
                            'insertAction': 0,
                            'updateAction': 0,
                            'deleteAction': 0,
                            'instantiate': 0,
                            'ownerAction': 0,
                            'companyAction': 0
                        };
                    }
                    else
                    {
                        acl[groupId][value['objectName']]['insertAction'] = 0;
                        acl[groupId][value['objectName']]['updateAction'] = 0;
                        acl[groupId][value['objectName']]['deleteAction'] = 0;
                        acl[groupId][value['objectName']]['instantiate'] = 0;
                        acl[groupId][value['objectName']]['ownerAction'] = 0;
                        acl[groupId][value['objectName']]['companyAction'] = 0;
                    }
                }
            }
        }
        catch (error)
        {
            return {
                error: true,
                notice: error.toString()
            };
        }
    }
}