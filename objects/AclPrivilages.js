var GeneralHandling = require('../lib/GeneralHandling.js'),
	CfwObject = require('../lib/CfwObject.js');
/**
 * AclPrivilages object
 *
 * @version $Id$
 * @copyright 2008
 */

module.exports = class AclPrivilages extends CfwObject
{
	constructor(session)
	{
		var proxy = super(session);

		return proxy;
	}

	tableConf()
	{
		return {
			'tableName': 'acl_privilages',
			'id': {
				'privlageId': {
					'fieldType': 'int',
					'maxlength': 30,
					'req': 0
				}
			},
			'fields': {
				'objectId': {
					'fieldType': 'int',
					'maxlength': 20,
					'minlength': 1,
					'req': 1
				},
				'groupId': {
					'fieldType': 'int',
					'maxlength': 20,
					'minlength': 1,
					'req': 1
				},
				'insertPrivilage': {
					'fieldType': 'int',
					'maxlength': 1,
					'minlength': 1,
					'req': 0
				},
				'updatePrivilage': {
					'fieldType': 'int',
					'maxlength': 1,
					'minlength': 1,
					'req': 0
				},
				'deletePrivilage': {
					'fieldType': 'int',
					'maxlength': 1,
					'minlength': 1,
					'req': 0
				},
				'instantiate': {
					'fieldType': 'int',
					'maxlength': 1,
					'minlength': 1,
					'req': 0
				},
				'ownerAction': {
					'fieldType': 'int',
					'maxlength': 1,
					'minlength': 1,
					'req': 0
				},
				'companyAction': {
					'fieldType': 'int',
					'maxlength': 1,
					'minlength': 1,
					'req': 0
				}
			}
		};
	}

	async afterUpdate()
	{
		var me = this;
		try
		{
			me.lib.init();
			return {error: false, notice: me.translate('SUCCESS')}
		}
		catch(e)
		{
			throw(e)
		}
	}

	async afterInsert()
	{
		var me = this;
		try
		{
			me.lib.init();
			return {error: false, notice: me.translate('SUCCESS')}
		}
		catch(e)
		{
			throw(e)
		}
	}

	async updatePrivilageByGroupId(param)
	{
		var me = this;
		try
		{
			var results = await me.db.query("SELECT privlageId FROM acl_privilages WHERE objectId=? AND groupId=?", [param['objectId'], param['groupId']]);
			var row = results[0];
			if(typeof row != 'undefined' && typeof row['privlageId'] != 'undefined')
			{
				me.id = row['privlageId'];

				me.insertPrivilage = param.insertPrivilage;
				me.updatePrivilage = param.updatePrivilage;
				me.deletePrivilage = param.deletePrivilage;
				me.instantiate = param.instantiate;
				me.ownerAction = param.ownerAction;
				me.companyAction = param.companyAction;

				var val = await me.update();
				return val;
			}
			else
			{
				me.objectId = param['objectId'];
				me.groupId = param['groupId'];
				me.insertPrivilage = param.insertPrivilage;
				me.updatePrivilage = param.updatePrivilage;
				me.deletePrivilage = param.deletePrivilage;
				me.instantiate = param.instantiate;
				me.ownerAction = param.ownerAction;
				me.companyAction = param.companyAction;

				var val = await me.insert();
				return val;
			}
		}
		catch(e)
		{
			reject(e)
		}
	}

	async getPrivilagesByGroupId(param)
	{
		var me = this;
		try
		{
			var limit = '';
			if(typeof param['start'] != 'undefined' && typeof param['limit'] != 'undefined')
			{
				var start = me.db.escape(parseInt(param['start']));
				var end = me.db.escape(parseInt(param['limit']));
				limit = ' LIMIT '+start+', '+end+' ';
			}

			var whereSearch = '';
			if(typeof param['query'] != 'undefined' && param['query'] != '')
			{
				whereSearch = ' AND objectName LIKE :query OR objectFunction LIKE :query ';
				param.query = '%'+param.query+'%';
			}

			var results = await me.db.query("SELECT * FROM acl_objects WHERE 1=1 "+whereSearch+" ORDER BY objectId DESC "+limit, param)

			var data = [];

			for(var result of results)
			{
				var val = await me.getSingleObjectPrivilageByGroupId(param.groupId, result.objectId);
				data.push(val);
			}

			var results = await me.db.query("SELECT COUNT(*) AS cnt FROM acl_objects WHERE 1=1 "+whereSearch, param)
			return {root: data, totalCount: results[0].cnt}
		}
		catch(e)
		{
			throw(e);
		}
	}

	async getSingleObjectPrivilageByGroupId(groupId, objectId)
	{
		var me = this;
		try
		{
			var results = await me.db.query("SELECT ap.*, ao.* FROM acl_objects ao LEFT JOIN acl_privilages ap ON ao.objectId=ap.objectId AND ap.groupId=? WHERE ao.objectId=?", [groupId, objectId]);

			if(typeof results[0] != 'undefined')
			{
				return {
					objectId: results[0].objectId,
					objectName: results[0].objectName,
					objectFunction: results[0].objectFunction,
					insertPrivilage: (results[0].insertPrivilage) ? results[0].insertPrivilage : 0,
					updatePrivilage: (results[0].updatePrivilage) ? results[0].updatePrivilage : 0,
					deletePrivilage: (results[0].deletePrivilage) ? results[0].deletePrivilage : 0,
					instantiate: (results[0].instantiate) ? results[0].instantiate : 0,
					ownerAction: (results[0].ownerAction) ? results[0].ownerAction : 0,
					companyAction: (results[0].companyAction) ? results[0].companyAction : 0
				}
			}
			else
			{
				throw({error: true, notice: me.translate('OBJECTNOTFOUND')})
			}
		}
		catch(e)
		{
			throw(e)
		}
	}
}
