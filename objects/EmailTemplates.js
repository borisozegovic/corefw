var CfwObject = require('../lib/CfwObject.js');
/**
 * EmailTemplates_Base object
 *
 * @version $Id$
 * @copyright 2008
 */

module.exports = class EmailTemplates extends CfwObject
{
	constructor(session)
	{
		var proxy = super(session);

		return proxy;
	}

	tableConf()
	{
		return {
			'tableName': 'email_templates',
			'id': {
				'templateId': {
					'fieldType': 'int',
					'maxlength': 20,
					'req': 0
				}
			},
			'fields':
			{
				'name': {
					'fieldType': 'text',
					'maxlength': 255,
					'req': 1
				},
				'description': {
					'fieldType': 'text',
					'decorators': ['leaveuntouched'],
					'maxlength': 255,
					'req': 1
				},
				'template': {
					'fieldType': 'text',
					'decorators': ['leaveuntouched'],
					'req': 1
				}
			}
		};
	}

	async returnEmailText(id, params, message)
	{
		var me = this;
		
		try
		{
			if(typeof message == 'undefined') message = '';
			var results = await me.db.query("SELECT name, template FROM email_templates WHERE templateId=?", [id]);
			if(typeof results[0] != 'undefined')
			{
				results = await me.db.query("SELECT name, template FROM email_templates WHERE templateId=1");

				var row = results[0];

				var template = row.template;
				template = template.replace(/::p0::/g, me.config.siteUrl);
				template = template.replace(/::p1::/g, me.config.siteName);
				template = template.replace(/::p2::/g, message);

				return {template: template, name: row.name};
			}

			var row = results[0];
			var template = row.template;
			var name = row.name;

			var n = 0;
			for(var i=0;i<params.length;i++)
			{
				var value = params[i];
				var re = new RegExp('::p'+n+'::');
				template = template.replace(re, value);
				re = new RegExp('xxp'+n+'xx');
				name = name.replace(re, value);
				n++;
			}

			var vars = [];
			var dats = template.split('{#');
			if(typeof dats[0] != 'undefined') dats.splice(0, 1);
			for(var i=0;i<dats.length;i++)
			{
				var value = dats[i];
				var dat = value.split('}');
				vars.push(dat[0]);
			}

			for(var i=0;i<vars.length;i++)
			{
				var value = vars[i];
				var re = new RegExp('{#'+value+'}');
				template = template.replace(re, me.translate(value));
			}

			return {template: template, name: row.name};
		}
		catch(e)
		{
			throw(e)
		}
	}
}
