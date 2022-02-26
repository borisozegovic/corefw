/**
 * SiteProps_Base object
 *
 * @version $Id$
 * @copyright 2008
 */

module.exports = class SiteProps extends CfwObject
{
	constructor(session)
	{
		var proxy = super(session);
		return proxy;
	}

	tableConf()
	{
		return {
			'tableName': 'site_props',
			'id': {
				'key': {
					'fieldType': 'text',
					'maxlength': 255,
					'req': 1
				}
			},
			'fields': {
				'value': {
					'fieldType': 'text',
					'decorators': ['leaveuntouched'],
					'req': 1
				}
			},
			'onduplicate': ['value']
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
}
