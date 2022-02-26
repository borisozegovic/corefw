/**
 * WikiTemplates object
 *
 * @version $Id$
 * @copyright 2013
 */

module.exports = class WikiTemplates extends CfwObject
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
			'tableName': 'wiki_templates',
			'id': {
				'templateId': {
					'fieldType': 'int',
					'maxlength': 20,
					'req': 0
				}
			},
			'fields': {
				'modular': {
					'fieldType': 'int',
					'maxlength': 1,
					'req': 0
				},
				'name': {
					'fieldType': 'text',
					'maxlength': 255,
					'req': 1
				},
				'content': {
					'fieldType': 'text',
					'decorators': ['leaveuntouched'],
					'req': 1
				},
				'categoryId': {
					'fieldType': 'int',
					'maxlength': 20,
					'req': 0
				}
			}
		};
	}

	async insertRow(param)
	{
		try 
		{
			if(param.modular != undefined) param.modular = 1;
			else param.modular = 0;

			if(param.categoryId == '') param.categoryId = null;

			return super.insertRow(param);
		}
		catch(error)
		{
			throw(error);
		}
	}

	updateRow(param)
	{
		try 
		{
			if(param.modular != undefined) param.modular = 1;
			else param.modular = 0;

			if(param.categoryId == '') param.categoryId = null;

			return super.updateRow(param);
		}
		catch(error)
		{
			throw(error);
		}
	}
}
