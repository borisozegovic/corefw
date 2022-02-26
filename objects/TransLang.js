/**
 * TransLang_Base object
 *
 * @version $Id$
 * @copyright 2008
 */

module.exports = class TransLang extends CfwObject
{
	tableConf()
	{
		return {
			'tableName': 'trans_lang',
			'id': {
				'langId': {
					'fieldType': 'int',
					'maxlength': 20,
					'req': 0
				}
			},
			'fields': {
				'langName': {
					'fieldType': 'text',
					'decorators': ['uppercase'],
					'maxlength': 255,
					'req': 1
				},
				'langCode': {
					'fieldType': 'text',
					'decorators': ['uppercase'],
					'maxlength': 6,
					'req': 1
				}
			}
		};
	}
}
