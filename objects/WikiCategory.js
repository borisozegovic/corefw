/**
 * WikiCategory object
 *
 * @version $Id$
 * @copyright 2008
 */

module.exports = class WikiCategory extends CfwObject
{
	constructor(session)
	{
		var proxy = super(session);

		return proxy;
	}

	tableConf()
	{
		var me = this;

		return {
			'tableName': 'wiki_category',
			'id': {
				'categoryId': {
					'fieldType': 'int',
					'maxlength': 30,
					'req': 0
				}
			},
			'fields': {
				'categoryName': {
					'fieldType': 'text',
					'maxlength': 255,
					'minlength': 1,
					'req': 1
				}
			}
		};
	}
}
