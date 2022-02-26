/**
 * User_companies_Base object
 *
 * @version $Id$
 * @copyright 2016
 */

module.exports = class UserCompanies extends CfwObject
{
	constructor(session)
	{
		var proxy = super(session);

		return proxy;
	}

	tableConf()
	{
		return {
			'tableName': 'user_companies',
			'id': {
				'companyId': {
					'fieldType': 'int',
					'maxlength': 20,
					'req': 0
				}
			},
			'fields': {
				'companyName': {
					'fieldType': 'text',
					'maxlength': 255,
					'req': 1
				}
			}
		};
	}

	insertRow(param)
	{
		param.companyId = false;
		return super.insertRow(param);
	}
}
