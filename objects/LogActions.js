var moment = require('moment');
/**
 * LogActions_Base object
 *
 * @version $Id$
 * @copyright 2018
 */
module.exports = class LogActions extends CfwObject
{
	tableConf()
	{
		return {
			'tableName': 'log_actions',
			'id': {
				'id': {
					'fieldType': 'int',
					'maxlength': 30,
					'req': 0
				}
			},
			'fields': {
				'name': {
					'fieldType': 'text',
					'decorators': ['leaveuntouched'],
					'req': 0
				},
				'params': {
					'fieldType': 'text',
					'decorators': ['leaveuntouched'],
					'req': 0
				},
				'userId': {
					'fieldType': 'int',
					'maxlength': 20,
					'req': 0,
					'null': true
				},
				'dateTime': {
					'fieldType': 'dateTime',
					'req': 1,
					'default': moment().format('YYYY-MM-DD HH:mm:ss')
				}
			}
		};
	}
}
