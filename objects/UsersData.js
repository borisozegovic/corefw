/**
 * user_data object
 *
 * @version $Id$
 * @copyright 2008
 */

module.exports = class UsersData extends CfwObject
{
	constructor(session)
	{
		var proxy = super(session);

		return proxy;
	}

	tableConf()
	{
		return {
			'tableName': 'users_data',
			'id': {
				'userId': {
					'fieldType': 'int',
					'maxlength': 20,
					'req': 1
				}
			},
			'ownerField': 'userId',
			'fields': {
				'name': {
					'fieldType': 'text',
					'maxlength': 255,
					'minlength': 2,
					'req': 1
				},
				'surname': {
					'fieldType': 'text',
					'maxlength': 255,
					'minlength': 2,
					'req': 1
				},
				'address': {
					'fieldType': 'text',
					'maxlength': 255,
					'req': 0,
					null: true
				},
				'city': {
					'fieldType': 'text',
					'maxlength': 255,
					'req': 0,
					null: true
				},
				'postalCode': {
					'fieldType': 'int',
					'maxlength': 10,
					'req': 0,
					null: true
				},
				'country': {
					'fieldType': 'text',
					'maxlength': 255,
					'req': 0,
					null: true
				},
				'phone': {
					'fieldType': 'int',
					'maxlength': 20,
					'req': 0,
					null: true
				},
				'oibNum': {
					'fieldType': 'oib',
					'maxlength': 255,
					'req': 0,
					null: true
				}
			},
			'onduplicate': ['name', 'surname', 'address', 'city', 'postalCode', 'country', 'phone', 'oibNum']
		};
	}
}
