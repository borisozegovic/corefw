var CfwObject = require('../lib/CfwObject.js');
/**
 * Objects object
 *
 * @version $Id$
 * @copyright 2008
 */

module.exports = class Objects extends CfwObject
{
	constructor(session)
	{
		var proxy = super(session);

		return proxy;
	}

	tableConf()
	{
		return {
			'tableName': 'acl_objects',
			'id': {
				'objectId': {
					'fieldType': 'int',
					'maxlength': 30,
					'req': 0
				}
			},
			'fields': {
				'objectName': {
					'fieldType': 'text',
					'req': 1
				},
				'objectFunction': {
					'fieldType': 'text',
					'req': 0
				},
				'description': {
					'fieldType': 'text',
					'req': 0
				}
			}
		};
	}
}
