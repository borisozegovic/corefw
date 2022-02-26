var moment = require('moment');
/**
 * LogErrors object
 *
 * @version $Id$
 * @copyright 2012
 */
module.exports = class LogErrors extends CfwObject
{
	constructor(session)
	{
		super(session);
		//me.db = new \_cfw_lib_MySQLConnect();
	}

	tableConf()
	{
		return {
			'tableName': 'log_errors',
			'id': {
				'id': {
					'fieldType': 'int',
					'maxlength': 30,
					'req': 0
				}
			},
			'fields': {
				'error': {
					'fieldType': 'text',
					'decorators': ['leaveuntouched'],
					'req': 0
				},
				'data': {
					'fieldType': 'text',
					'decorators': ['leaveuntouched'],
					'req': 0
				},
				'datetime': {
					'fieldType': 'dateTime',
					'req': 1,
					'default': moment().format('YYYY-MM-DD HH:mm:ss')
				}
			}
		};
	}
}
