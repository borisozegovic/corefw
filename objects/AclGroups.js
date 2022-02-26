var CfwObject = require('../lib/CfwObject.js');
/**
 * AclGroups object
 *
 * @version $Id$
 * @copyright 2018
 */

module.exports = class AclGroups extends CfwObject
{
	constructor(session)
	{
		var proxy = super(session);

		return proxy;
	}

	tableConf()
	{
		return {
			'tableName': 'acl_groups',
			'id': {
				'groupId': {
					'fieldType': 'int',
					'maxlength': 30,
					'req': 0
				}
			},
			'fields': {
				'groupName': {
					'fieldType': 'text',
					'maxlength': 255,
					'req': 1
				}
			}
		};
	}

	async insertRow(param)
	{
		var me = this;
		try 
		{
			me.db = await me.db.begin(me.session);
			var val = await super.insertRow(param);

			if(param.copyGroupId != undefined)
			{
				await me.db.query("INSERT INTO acl_privilages (objectId, groupId, insertPrivilage, updatePrivilage, deletePrivilage, instantiate, ownerAction, companyAction) SELECT objectId, :groupId, insertPrivilage, updatePrivilage, deletePrivilage, instantiate, ownerAction, companyAction FROM acl_privilages WHERE groupId=:copyGroupId", {groupId: val.lastId, copyGroupId: param.copyGroupId});
			}

			await me.db.commit();
			return val;
		}
		catch(e)
		{
			console.log(e);
			await me.db.rollback();
			throw(e);
		}
	}
}
