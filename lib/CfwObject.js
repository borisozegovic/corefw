var Decorator = require('./Decorator.js'),
    Validator = require('./Validator.js'),
    ErrorControl = require('./ErrorControl.js');

/**
 * Class providing main Object Model for database insertion, validation, update, delete etc...
 *
 * This is a starting point of every object that uses database
 * Every object should extend this object
 * <code>
 * module.exports = class User_Base extends Object
 * {
 *
 *	tableConf()
 *	{
 *		return {
 *			'tableName': 'users',
 *			'id': {
 *				'userId': {
 *					'fieldType': 'int',
 *					'maxlength': 20,
 *					'req': 0
 *				)
 *			),
 *			'ownerField': 'userId',
 *			'fields': {
 *				'username': {
 *					'fieldType': 'sc',
 *					'maxlength': 255,
 *					'minlength': 1,
 *					'req': 1
 *				),
 *				'updateDateTime': {
 *					'fieldType': 'dateTime',
 *					'req': 1
 *				)
 *			)
 *		);
 *	}
 *
 *	insertRow(param)
 *	{
 *		me.username = param['username'];
 *		me.updateDateTime = _cfw_lib_GeneralHandling::datetimeNow();
 *		return me.insert();
 *	}
 *
 *	updateRow(param)
 *	{
 *		param['updateDateTime'] = _cfw_lib_GeneralHandling::datetimeNow();
 *
 *		return parent::updateRow(param);
 *	}
 * }
 * </code>
 * In the above example, we extended the object, called the new module.exports = class User cause it will hold user database table mapping,
 * we then override tableConf() method to define * table specification.
 * 'tableName' is the exact table name as it is written in database
 * 'id' array holds primary key values, if they are autoincrement then 'req' should be '0' else they should be specified on insert
 * 'ownerField' is used to define which field holds value that will be checked of 'owner action' is checked in ACL. If that is the case 'ownerField' will be checked against Session::userId value.
 * 'fields' holds columns except primary key values
 * we can define each column properties with following:
 * <ul>
 * <li>fieldType - (required) define as 'text', 'int', 'float', 'dateTime', 'date', 'sc (special case)'</li>
 * <li>maxlength - String max length</li>
 * <li>minlegth - String min length</li>
 * <li>maxvalue - Int or float max value</li>
 * <li>minvalue - Int or float min value</li>
 * <li>req - (required) define if this field is optional</li>
 * <li>decorators - {) of decorators that should be used before validating and inserting/updating</li>
 * </ul>
 * We then override insertRow if we want to do some preprocessing like in this example in which updateDateTime was not given in parameters then we insert it ourselves.
 * We can also override functions like we did in updateRow only to add a single parameter
 *
 * @todo Make this an abstract class
 * @author  Dario Filkovic <dfilkovi@gmail.com>
 *
 * @since 1.0
 *
 * @package CoreFw
 */
module.exports = class CfwObject
{
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
        me.errorControl = new ErrorControl(me.session);
        me.aclLangId = 1;
        me.aclGroupId = 2;
        if (typeof me.session != 'undefined')
        {
            me.aclLangId = me.session.langId;
            me.aclGroupId = me.session.groupId;
            if (me.session.tranDb && me.session.tranDb.dbname == me.session.db.dbname) me.db = me.session.tranDb;
            else me.db = me.session.db;
        }
        else
        {
            me.db = lib.db;
        }
        me.props = lib.props;
        //me.error = _cfw_lib_Registry::fetch('error');
        me.lang = lib.lang;
        if (typeof me.tableConf != 'undefined')
        {
            me.tableConfig = me.tableConf();
            if (typeof me.tableConfig.tableName != 'undefined') me.tableName = me.tableConfig.tableName;
            if (typeof me.tableConfig.id != 'undefined') me.idField = me.tableConfig.id;
        }

        me.config = lib.config;
        //me.cache = _cfw_lib_Registry::fetch('cache');
        me.dbName = 'db';

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
                        'notice': me.translate('METHODDOESNOTEXIST'),
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
                            notice: me.translate('NOTANPROMISE'),
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

    /**
     * Translate key based on current langId
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @return string Translated word
     */
    translate(key)
    {
        var me = this;
        var val = me.lang.translate(key, me.aclLangId);
        return val;
    }

    /**
     * Select a single row from this table based on id
     *
     * <code>
     *	user = new User;
     *	user.id = 5;
     *	user.select();
     * </code>
     * In the above example if an user with id 5 is found in database user object get's populated with data that can be fetched by:
     * <code>
     *	user.username;
     * </code>
     * for example.
     * If table has more than one primary key you can select it like this:
     * <code>
     *	user = new User;
     *	user.id = {'id': 5, 'group': 4);
     *	user.select();
     * </code>
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @return booelan True if record found false instead
     */
    async select()
    {
        var me = this;

        try
        {
            var params = [];
            var strings = [];
            if (typeof me.id == 'object')
            {
                for (var key in me.idField)
                {
                    var value = me.idField[key];
                    strings.push('`' + key + '`=?');
                    params.push(me.id[key]);
                }
            }
            else
            {
                strings.push('`' + Object.keys(me.idField)[0] + '`=?');
                params.push(me.id);
            }

            var string = ' WHERE ' + strings.join(' AND ');
            var results = await me[me.dbName].query("SELECT * FROM `" + me.tableName + "` " + string, params)

            me.modelLoaded = true;

            if (typeof results[0] != 'undefined')
            {
                me.assocData = results[0];
                for (var key in results[0])
                {
                    if (typeof me[key] == 'undefined') me[key] = results[0][key];
                }
                return true;
            }
            throw (
                {
                    error: true,
                    notice: me.translate('RECORDNOTFOUND')
                });
        }
        catch (e)
        {
            throw (e);
        }
    }

    /**
     * Used to cast value before update or insert to it's mathcing field type
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     * @param String value
     * @param String fieldType
     * @return String|int Casted value
     */
    defineType(value, field)
    {
        if (typeof value == 'object') return value;

        var fieldType = field['fieldType'];

        switch (fieldType)
        {
            case 'int':
                value = parseInt(value) || 0;
                break;
            case 'float':
                value = parseFloat(value) || 0;
                break;
            case 'string':
                value = value.toString();
                break;
            case 'num':
                value = value.toString();
                break;
        }

        if (value === '' && typeof field['null'] != 'undefined' && field['null'] == true)
        {
            value = null;
        }

        return value;
    }

    /**
     * Used before insert or update to validate all fields
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     * @param Array param Array of values
     * @param Array update
     * @return boolean True if succes false otherwise
     */
    checkInsert(param, update)
    {
        var me = this;

        if (typeof param == 'undefined') param = false;
        if (typeof update == 'undefined') update = false;

        if (update != false && !me.modelLoaded)
        {
            me.select();
        }

        if (typeof me.id != 'undefined' && typeof me.id == 'object')
        {
            for (var key in me.id)
            {
                me[key] = me.id[key];
            }
        }
        else if (typeof me.id != 'undefined')
        {
            me[Object.keys(me.idField)[0]] = me.id;
        }

        if (param != false)
        {
            for (var key in param)
            {
                me[key] = param[key];
            }
        }

        var valuesCheck = {};
        for (var key in me.tableConfig['fields'])
        {
            if (typeof me[key] != 'undefined') valuesCheck[key] = me[key];
        }

        for (var key in me.idField)
        {
            if (typeof me[key] != 'undefined' && me[key] !== "") valuesCheck[key] = me[key];
        }

        val = me.checkFields(valuesCheck, update);
        return val;
    }

    /**
     * Used for inserting new row into table
     *
     * <code>
     *	user = new User;
     *	user.username = 'mirko';
     *	user.dateEntered = date('Y-m-d H:i:s');
     *	val = user.insert();
     * </code>
     * In this example val will hold an array with 'error' boolean which if it is true, error happened and 'notice' string is also in array
     * which holds the error message or error array if more than one error is given
     * On succes var will hold error: false and 'lastId' parameter which holds last autoincrement Id for further processing (chaining)
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @return mixed[] Array with 'error' and 'notice' if error true, and 'lastId' if error false
     */
    async insert()
    {
        var me = this;

        try
        {
            if (typeof me.id != 'undefined' && typeof me.id == 'object')
            {
                for (var key in me.id)
                {
                    me[key] = me.id[key];
                }
            }
            else if (typeof me.id != 'undefined')
            {
                me[Object.keys(me.idField)[0]] = me.id;
            }

            if (typeof me.userId == 'undefined') me.userId = me.session.userId;
            if (typeof me.companyId == 'undefined') me.companyId = me.session.companyId;

            if (me.userId === false) delete(me.userId);
            if (me.companyId === false) delete(me.companyId);

            if (me.functionNameGlob != false)
            {
                if (me.lib.acl[me.aclGroupId][me.objectNameGlob][me.functionNameGlob]['insertAction'] == '0')
                {
                    throw(
                        {
                            'error': true,
                            'notice': me.translate('NOPRIVILAGE'),
                            'noPriv': true
                        });
                }
            }
            else if (me.objectNameGlob != false)
            {
                if (me.lib.acl[me.aclGroupId][me.objectNameGlob]['insertAction'] == '0')
                {
                    throw(
                        {
                            'error': true,
                            'notice': me.translate('NOPRIVILAGE'),
                            'noPriv': true
                        });
                }
            }

            var valuesCheck = {};
            for (var key in me.tableConfig['fields'])
            {
                if (typeof me[key] != 'undefined') valuesCheck[key] = me[key];
                else if (typeof me.tableConfig.fields[key].default != 'undefined')
                {
                    if(typeof me.tableConfig.fields[key].default == 'function')
                    {
                        me[key] = await me.tableConfig.fields[key].default.call(me);
                    }
                    else
                    {
                        me[key] = me.tableConfig.fields[key].default;
                    }

                    valuesCheck[key] = me[key];
                }
            }

            for (var key in me.idField)
            {
                if (typeof me[key] != 'undefined' && me[key] !== "") valuesCheck[key] = me[key];
                else if (typeof me.idField[key].default != 'undefined')
                {

                    if(typeof me.tableConfig.fields[key].default == 'function')
                    {
                        me[key] = await me.idField[key].default.call(me);
                    }
                    else
                    {
                        me[key] = me.idField[key].default;
                    }
                    valuesCheck[key] = me[key];
                }
            }

            var val = me.checkFields(valuesCheck);
            if (val.error == true)
            {
                throw(val);
            }

            //call before insert
            await me.beforeInsert();

            var fields = [],
                values = [];
            for (var key in me.tableConfig['fields'])
            {
                if (typeof me[key] != 'undefined')
                {
                    fields.push("`" + key + "`");
                    values.push(me.defineType(me[key], me.tableConfig['fields'][key]));
                }
            }

            for (var key in me.idField)
            {
                if (typeof me[key] != 'undefined' && me[key] !== "")
                {
                    fields.push("`" + key + "`");
                    values.push(me.defineType(me[key], me.tableConfig['id'][key]));
                }
            }

            var duplic = '',
                fieldsDupl = [];

            if (typeof me.tableConfig['onduplicate'] != 'undefined')
            {
                var key = Object.keys(me.idField)[0];
                //this will see if the field isn't autoincrement
                if (me.idField[key]['req'] == 0) duplic = ' ON DUPLICATE KEY UPDATE `' + key + '`=LAST_INSERT_ID(`' + key + '`), ';
                else duplic = ' ON DUPLICATE KEY UPDATE ';
                for (var i = 0; i < me.tableConfig['onduplicate'].length; i++)
                {
                    var value = me.tableConfig['onduplicate'][i];
                    if (typeof me[value] != 'undefined')
                    {
                        fieldsDupl.push('`' + value + '`=?');
                        if (typeof me.tableConfig['fields'][value] != 'undefined') values.push(me.defineType(me[value], me.tableConfig['fields'][value]));
                        else values.push(me.defineType(me[value], me.idField[value]));
                    }
                }
                if (fieldsDupl.length > 0) duplic += fieldsDupl.join(', ');
                else duplic = '';
            }

            var fieldsq = '';
            if (fields.length > 0) fieldsq = fields.join(', ');

            var pSafe = [];
            for (var i = 0; i < fields.length; i++)
            {
                pSafe.push('?');
            }

            var pSafeq = '';
            if (pSafe.length > 0) pSafeq = pSafe.join(', ');

            var results = await me[me.dbName].query("INSERT INTO `" + me.tableName + "` (" + fieldsq + ") VALUES (" + pSafeq + ") " + duplic, values)

            me.lastId = results.insertId;
            me.id = me.lastId;

            //call after insert
            await me.afterInsert();

            return(
                {
                    'error': false,
                    'lastId': me.lastId,
                    'notice': me.translate('VALUEINSERTED')
                });
        }
        catch (e)
        {
            throw(e);
        }
    }

    /**
     * Called before insert into db
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @return void
     */
    async beforeInsert()
    {
        var me = this;
        try
        {
            return(
                {
                    error: false,
                    notice: me.translate('SUCCESS')
                })
        }
        catch (e)
        {
            throw(e)
        }
    }

    /**
     * Called after succesfull insert into db
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @return void
     */
    async afterInsert()
    {
        var me = this;
        try
        {
            return(
                {
                    error: false,
                    notice: me.translate('SUCCESS')
                })
        }
        catch (e)
        {
            throw(e)
        }
    }

    /**
     * Used for selection mainly from ExtJS and ajax requests
     * It automaticaly selects rows based on passed parameters in this object
     * Parameters are:
     * <ul>
     *	<li>sort - sort by</li>
     *	<li>dir - sort direction (ASC or DESC)</li>
     *	<li>start - starting row</li>
     *	<li>limit - number of records to fetch</li>
     *	<li>query - every field in table is searched by this value (LIKE %value%)</li>
     *	<li>initialId - if you want to inlcude a single value in this search that would not normaly come, pass it with this parameter</li>
     * </ul>
     * If 'sort' parameter is not passed sorting is by first idField and direction is DESC, if no start or limit parameters are passed, no limit is used
     *
     * <code>
     *	user = new User;
     *	val = user.selectRow({'sort': 'id', 'dir': 'DESC', 'start': 20, 'limit': 10));
     * </code>
     * In this example val will hold an array with 'error' boolean if error happened and 'notice' string which holds the error message or error array if more than one error is given
     * On succes var will hold 'root' which holds all row results (empty array if no results) and 'totalCount' int that has number of records without limit (for use with pagination)
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     * @param Array param An array of key: value pairs for selecting rows
     * @return mixed[] Array with 'error' and 'notice' if error true and 'root' and 'totalCount' if error false
     */
    async selectRow(param)
    {
        var me = this;

        try
        {
            var data = [];

            if (typeof param['sort'] != 'undefined') var sort = me.db.escapeId('t.'+param['sort']);
            else var sort = 't.' + Object.keys(me.idField)[0];

            var dir = 'DESC';
            if (typeof param['dir'] != 'undefined')
            {
                switch(param['dir'])
                {
                    case 'asc':
                        dir = 'ASC';
                        break;
                }
            }

            var limit = '';
            if (typeof param['start'] != 'undefined' && typeof param['limit'] != 'undefined')
            {
                var start = me.db.escape(parseInt(param['start']));
                var end = me.db.escape(parseInt(param['limit']));
                limit = ' LIMIT ' + end + ' OFFSET ' + start + ' ';
            }

            var whereSearch = '';
            var params = {};
            if (typeof param['query'] != 'undefined' && param['query'] != '')
            {
                var searchString = [];
                for (var key in me.tableConfig['fields'])
                {
                    var value = me.tableConfig['fields'][key];
                    if (value['fieldType'] == 'date' || value['fieldType'] == 'dateTime') continue;
                    searchString.push(' t.' + key + ' LIKE :' + key + ' ');
                    params[key] = '%' + param['query'] + '%';
                }
                if (searchString.length > 0)
                {
                    whereSearch = ' AND (' + (searchString.join(' OR ')) + ') ';
                }
            }

            if (typeof param['conditions'] != 'undefined' && param['conditions'] != '')
            {
                for (var key in param['conditions'])
                {
                    var value = me.db.escape(param['conditions'][key]);
                    var field = me.tableConfig['fields'][key];
                    if (field == undefined) continue;
                    whereSearch += ' AND t.' + key + ' = :' + key + ' ';
                    params[key] = param['conditions'][key];
                }
            }

            if (typeof param['filters'] != 'undefined' && param['filters'] != '')
            {
                for (var key in param['filters'])
                {
                    var value = me.db.escape(param['filters'][key]);
                    var field = me.tableConfig['fields'][key];
                    if (field == undefined) continue;
                    whereSearch += ' AND t.' + key + ' LIKE :' + key + ' ';
                    params[key] = '%' + param['filters'][key] + '%';
                }
            }

            var ownerWhere = '';
            if (me.ownerActionGlob == true)
            {
                ownerWhere = ' AND t.' + me.tableConfig['ownerField'] + '=:sessionUserId ';
                params.sessionUserId = me.session.userId;
            }

            if (me.companyActionGlob == true)
            {
                ownerWhere += ' AND t.' + me.tableConfig['companyField'] + '=:sessionCompanyId ';
                params.sessionCompanyId = me.session.companyId;
            }

            var results = await me[me.dbName].query("SELECT t.* FROM `" + me.tableName + "` t WHERE 1=1 " + ownerWhere + " " + whereSearch + " ORDER BY " + sort + " " + dir + " " + limit, params)

            for (var i = 0; i < results.length; i++)
            {
                data.push(results[i]);
            }

            if (typeof param['initialId'] != 'undefined')
            {
                data = await me.findInitialId(data, param['initialId'])
            }

            results = await me[me.dbName].query("SELECT COUNT(*) AS cnt FROM `" + me.tableName + "` t WHERE 1=1 " + ownerWhere + " " + whereSearch, params)

            var numRows = 0;
            if (results[0] !== undefined) numRows = results[0].cnt;

            return(
                {
                    'root': data,
                    'totalCount': numRows
                });
        }
        catch (e)
        {
            throw(e);
        }
    }

    /**
     * Used for selection mainly from ExtJS and ajax requests
     * It automaticaly selects one row based on id passed, if there are more columns in primary key, then pass those parameters as get variables
     * Parameters are:
     * <ul>
     *	<li>id - id of the record you are searching</li>
     * </ul>
     *
     * <code>
     *	user = new User;
     *	val = user.selectRowById({'id': 1));
     *
     *	user = new User;
     *	val = user.selectRowById({'idOne': '15', 'idTwo': 25));
     * </code>
     * In this example val will hold an array with 'error' boolean if error happened and 'notice' string which holds the error message or error array if more than one error is given, also if record is not found it will return error
     * On succes var will hold 'root' which holds row result
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     * @param Array param An array of key: value pairs for selecting rows
     * @return mixed[] Array with 'error' and 'notice' if error true and 'root' if error false
     */
    async selectRowById(param)
    {
        var me = this;

        try
        {
            if (typeof me.id == 'object')
            {
                for (var key in me.idField)
                {
                    me.id[key] = param[key];
                }
            }
            else
            {
                me.id = param['id'];
            }

            await me.select();

            var data = {};
            for (var key in me.tableConfig['fields'])
            {
                data[key] = me[key];
            }

            for (var key in me.idField)
            {
                data[key] = me[key];
            }

            return(
                {
                    'error': false,
                    'root': data
                });
        }
        catch(error)
        {
            throw(error);
        }
    }

    /**
     * Used for selecting a single value from a table
     * It is optimized to check first if value exists in given data if not, then selects it and appends it to an array
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param Array data Array with starting data
     * @param mixed[] initialValue Value of ID field
     * @return Array Final array with all data
     */
    async findInitialId(data, initialValue)
    {
        var me = this;

        try
        {
            var initialValues = [];
            if (typeof initialValue == 'number' || typeof initialValue == 'string')
            {
                initialValues = [initialValue];
            }
            else
            {
                initialValues = initialValue;
            }

            for (var val of initialValues)
            {
                var defKey = Object.keys(me.idField)[0];

                for (var i = 0; i < data.length; i++)
                {
                    var value = data[i];
                    if (value[defKey] == val)
                    {
                        return data;
                    }
                }

                var ownerWhere = '',
                    params = {
                        initialId: val
                    };
                if (me.ownerActionGlob == true)
                {
                    ownerWhere = ' AND i.' + me.tableConfig['ownerField'] + '=:sessionUserId ';
                    params.sessionUserId = me.session.userId;
                }

                if (me.companyActionGlob == true)
                {
                    ownerWhere += ' AND i.' + me.tableConfig['companyField'] + '=:sessionCompanyId ';
                    params.sessionCompanyId = me.session.companyId;
                }

                var results = await me[me.dbName].query("SELECT i.* FROM `" + me.tableName + "` i WHERE i.`" + defKey + "`=:initialId " + ownerWhere, params)

                if (typeof results[0] != 'undefined') data.push(results[0]);
            }

            return data;
        }
        catch (e)
        {
            throw(e);
        }
    }

    /**
     * Helper method for array insertion
     *
     * It iterates through param and sets every item as a key.value and returns an insert result
     * <code>
     * user = new User;
     * param = {'username': 'mirko', 'dateTime': date('Y-m-d H:i:s'));
     * return user.insertRow(param);
     * </code>
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param Array param Array of key: value pairs for insertion
     * @return Array Error boolean and notice message
     */
    insertRow(param)
    {
        var me = this;
        for (var key in param)
        {
            me[key] = param[key];
        }
        return me.insert();
    }

    /**
     * Helper method for object update through array parameters
     *
     * It iterates through param and sets every item as a key.value and returns an insert result, it needs an 'id' field
     * <code>
     * user = new User;
     * param = {'id': 5, 'username': 'mirko', 'dateTime': date('Y-m-d H:i:s'));
     * return user.updateRow(param);
     * </code>
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param Array param Array of key: value pairs for insertion
     * @return Array Error boolean and notice message
     */
    updateRow(param)
    {
        var me = this;
        for (var key in param)
        {
            me[key] = param[key];
        }
        if (typeof me.id != 'undefined')
        {
            for (var key in me.idField)
            {
                if (typeof me[key] != 'undefined' && typeof me.id != 'object') me.id = me[key];
            }
        }
        return me.update();
    }

    /**
     * Helper method for object delete through array parameters
     *
     * It iterates through param and sets 'id' fields, it needs an 'id' field/s
     * <code>
     * user = new User;
     * param = {'id': 5);
     * return user.deleteRow(param);
     * </code>
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param Array param Array of key: value pairs for insertion
     * @return Array Error boolean and notice message
     */
    deleteRow(param)
    {
        var me = this;
        for (var key in param)
        {
            me[key] = param[key];
        }
        if (typeof me.id != 'undefined')
        {
            for (var key in me.idField)
            {
                if (typeof me[key] != 'undefined' && typeof me.id != 'object') me.id = me[key];
            }
        }
        return me.delete();
    }

    /**
     * Helper method for object delete
     *
     * <code>
     * user = new User;
     * user.id = 5;
     * return user.delete();
     * </code>
     *
     * <code>
     * user = new User;
     * user.id = {'userId: 5, 'username': 'mirko'); //in case of multiple primary keys
     * return user.delete();
     * </code>
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @return Array Error boolean and notice message
     */
    async delete()
    {
        var me = this;

        try
        {
            var ownerWhere = '',
                params = {};

            if (me.ownerActionGlob == true)
            {
                if(!me.modelLoaded)
                {
                    await me.select();
                }


                if (me[me.tableConfig['ownerField']] != me.session.userId)
                {
                    throw(
                        {
                            'error': true,
                            'notice': me.translate('NOPRIVILAGE'),
                            'noPriv': true
                        });
                }

                ownerWhere = ' AND ' + me.tableConfig['ownerField'] + '=:sessionUserId ';
                params.sessionUserId = me.session.userId;
            }

            if (me.companyActionGlob == true)
            {
                if(!me.modelLoaded)
                {
                    await me.select();
                }

                if (me[me.tableConfig['companyField']] != me.session.companyId)
                {
                    throw(
                        {
                            'error': true,
                            'notice': me.translate('NOPRIVILAGE'),
                            'noPriv': true
                        });
                }

                ownerWhere += ' AND ' + me.tableConfig['companyField'] + '=:sessionCompanyId';
                params.sessionCompanyId = me.session.companyId;
            }

            if (me.functionNameGlob != false)
            {
                if (me.lib.acl[me.aclGroupId][me.objectNameGlob][me.functionNameGlob]['deleteAction'] == '0')
                {
                    throw(
                        {
                            'error': true,
                            'notice': me.translate('NOPRIVILAGE'),
                            'noPriv': true
                        });
                }
            }
            else if (me.objectNameGlob != false)
            {
                if (me.lib.acl[me.aclGroupId][me.objectNameGlob]['deleteAction'] == '0')
                {
                    throw(
                        {
                            'error': true,
                            'notice': me.translate('NOPRIVILAGE'),
                            'noPriv': true
                        });
                }
            }

            //call before delete
            await me.beforeDelete();

            var whereArr = [],
                where = "";

            if (typeof me.id == 'object')
            {
                for (var key in me.id)
                {
                    if (me.id[key] === null)
                    {
                        whereArr.push('`' + key + '` IS NULL');
                    }
                    else
                    {
                        whereArr.push('`' + key + '`=:' + key);
                    }
                    params[key] = me.id[key];
                }
                where = whereArr.join(' AND ');
            }
            else
            {
                var key = Object.keys(me.idField)[0];
                where = '`' + key + '`=:' + key;
                params[key] = me.id;
            }

            await me[me.dbName].query("DELETE FROM `" + me.tableName + "` WHERE " + where + " " + ownerWhere, params)

            await me.afterDelete();

            return(
                {
                    'error': false,
                    'notice': me.translate('VALUEDELETED')
                });
        }
        catch (e)
        {
            throw(e);
        }
    }

    /**
     * Called before delete from db
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @return void
     */
    async beforeDelete()
    {

    }

    /**
     * Called after succesfull delete from db
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @return void
     */
    async afterDelete()
    {

    }

    /**
     * Helper method for object update
     *
     * It validates data and returns error messages if not valid data <code> {'error': true, 'notice': {'username': 'Not valid')); </code> ('notice' becomes array of error notices in case of multiple errors) or returns <code> {'error': false, 'notice': 'Success'); </code>
     * For succesfull update an 'id' field must be present
     * <code>
     * user = new User;
     * user.id = 5;
     * user.username = 'mirko';
     * return user.update();
     * </code>
     *
     * <code>
     * user = new User;
     * user.id = {'userId: 5, 'username': 'mirko'); //in case of multiple primary keys
     * user.username = 'slavko';
     * return user.update();
     * </code>
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @return Array Error boolean and notice message/messages
     */
    async update()
    {
        var me = this;

        try
        {
            if (typeof me.id == 'undefined')
            {
                throw(
                    {
                        error: true,
                        notice: me.translate('NOIDFIELDSET')
                    });
            }

            if (!me.modelLoaded)
            {
                await me.select();
            }

            var ownerWhere = '';
            var values = {};
            if (me.ownerActionGlob == true)
            {
                if (me[me.tableConfig['ownerField']] != me.session.userId)
                {
                    throw(
                        {
                            'error': true,
                            'notice': me.translate('NOPRIVILAGE'),
                            'noPriv': true
                        });
                }
                ownerWhere = ' AND ' + me.tableConfig['ownerField'] + '=:sessionUserId ';
                values.sessionUserId = me.session.userId;
            }

            if (me.companyActionGlob == true)
            {
                if (me[me.tableConfig['companyField']] != me.session.companyId)
                {
                    throw(
                        {
                            'error': true,
                            'notice': me.translate('NOPRIVILAGE'),
                            'noPriv': true
                        });
                }
                ownerWhere += ' AND ' + me.tableConfig['companyField'] + '=:sessionCompanyId ';
                values.sessionCompanyId = me.session.companyId;
            }

            if (me.functionNameGlob != false)
            {
                if (me.lib.acl[me.aclGroupId][me.objectNameGlob][me.functionNameGlob]['updateAction'] == '0')
                {
                    throw(
                        {
                            'error': true,
                            'notice': me.translate('NOPRIVILAGE'),
                            'noPriv': true
                        });
                }
            }
            else if (me.objectNameGlob != false)
            {
                if (me.lib.acl[me.aclGroupId][me.objectNameGlob]['updateAction'] == '0')
                {
                    throw(
                        {
                            'error': true,
                            'notice': me.translate('NOPRIVILAGE'),
                            'noPriv': true
                        });
                }
            }

            var check = {};
            if (typeof me.id == 'object')
            {
                for (var key in me.idField)
                {
                    check[key] = me.id[key];
                }
            }
            else
            {
                check[Object.keys(me.idField)[0]] = me.id;
            }

            for (var key in me.tableConfig['fields'])
            {
                check[key] = me[key];
            }

            for (var key in me.idField)
            {
                if (me.idField[key]['req'] == 1)
                {
                    check[key] = me[key];
                }
            }

            var val = me.checkFields(check, me.id);
            if (val['error'] == true)
            {
                throw(val);
            }

            //call before update
            await me.beforeUpdate();

            var strings = [];
            if (typeof me.id == 'object')
            {
                for (var key in me.idField)
                {
                    strings.push('`' + key + '`=:' + key);
                    values[key] = me.defineType(me.id[key], me.idField[key]);
                }
            }
            else
            {
                var key = Object.keys(me.idField)[0];
                strings.push('`' + key + '`=:' + key);
                values[key] = me.defineType(me.id, me.idField[key]);
            }

            var string = ' WHERE ' + strings.join(' AND ');

            var fieldsAr = [];
            for (var key in me.tableConfig['fields'])
            {
                fieldsAr.push('`' + key + '`=:' + key);
                values[key] = me.defineType(me[key], me.tableConfig['fields'][key]);
            }

            for (var key in me.idField)
            {
                if (me.idField[key]['req'] == 1)
                {
                    fieldsAr.push('`' + key + '`=:' + key);
                    values[key] = me.defineType(me[key], me.tableConfig['id'][key]);
                }
            }

            var fields = fieldsAr.join(', ');

            await me[me.dbName].query("UPDATE `" + me.tableName + "` SET " + fields + " " + string + " " + ownerWhere, values)

            //call after update
            await me.afterUpdate();
            me.lastId = me.id;

            return(
                {
                    'error': false,
                    'notice': me.translate('VALUEUPDATED'),
                    'lastId': me.id
                });
        }
        catch (e)
        {
            throw(e);
        }
    }

    /**
     * Called before update db
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @return void
     */
    async beforeUpdate()
    {
        var me = this;
        try
        {
            return(
                {
                    error: false,
                    notice: me.translate('SUCCESS')
                })
        }
        catch (e)
        {
            throw(e)
        }
    }

    /**
     * Called after succesfull update db
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @return void
     */
    async afterUpdate()
    {
        var me = this;
        try
        {
            return(
                {
                    error: false,
                    notice: me.translate('SUCCESS')
                })
        }
        catch (e)
        {
            throw(e)
        }
    }

    /**
     * Validate and decorate fields
     *
     * First it decorates data if decorators are passed in an object table definition, then validates fields for insertion/update
     *
     * @see Decorator
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     * @param Array insert Values
     * @param Array update Update
     * @return Array Error boolean and notice message/messages
     */
    checkFields(insert, update = false)
    {
        if (typeof update == 'undefined') update = false;
        var decorator = new Decorator(this, insert);
        var validator = new Validator(update);
        var val = validator.validate(decorator.insert, this);
        return val;
    }
}
