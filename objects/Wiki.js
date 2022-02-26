var GeneralHandling = require('../lib/GeneralHandling.js'),
	moment = require('moment'),
	WikiTemplates = require('./WikiTemplates.js'),
	Wiki = require('../lib/Wiki.js');

/**
 * Wiki object
 *
 * @version $Id$
 * @copyright 2008
 */

module.exports = class WikiObject extends CfwObject
{
	tableConf()
	{
		var me = this;

		return {
			'tableName': 'wiki_content',
			'id': {
				'wikiId': {
					'fieldType': 'int',
					'maxlength': 30,
					'req': 0
				}
			},
			'fields': {
				'name': {
					'fieldType': 'text',
					'maxlength': 255,
					'decorators': ['safevarname', 'lowercase'],
					'minlength': 1,
					'req': 1
				},
				'langId': {
					'fieldType': 'int',
					'maxlength': 20,
					'req': 1
				},
				'header': {
					'fieldType': 'text',
					'maxlength': 255,
					'minlength': 1,
					'req': 1
				},
				'categoryId': {
					'fieldType': 'int',
					'maxlength': 20,
					'req': 1
				},
				'content': {
					'fieldType': 'text',
					'decorators': ['leaveuntouched'],
					'req': 1
				},
				'dateTime': {
					'fieldType': 'dateTime',
					'req': 1
				},
				'parsedContent': {
					'fieldType': 'text',
					'decorators': ['leaveuntouched'],
					'req': 0
				},
				'templateId': {
					'fieldType': 'int',
					'maxlength': 20,
					'req': 0
				},
				'modularData': {
					'fieldType': 'text',
					'decorators': ['leaveuntouched'],
					'req': 0
				}
			}
		};
	}

	async insertRow(param)
	{
		var me = this;
		try
		{
			if(param['templateId'] && param['templateId'] != '')
			{
				param['modularData'] = JSON.stringify(param['modularData']);
				var wt = new WikiTemplates(me.session);
				wt.id = param['templateId'];
				await wt.select();
				param['content'] = wt.content;
			}
			else
			{
				param['templateId'] = null;
				param['modularData'] = null;
			}

			for(var key in param)
			{
				me[key] = param[key];
			}

			if(param['name'] == '')
			{
				me.name = GeneralHandling.safeFileName(param['header']);

				var found = true;
				while(found == true)
				{
					var results = await me.db.query("SELECT * FROM wiki_content WHERE name=? AND langId=?", [me.name, me.langId]);
					var row = results[0];
					if(row != undefined)
					{
						var dats = row['name'].split('-');
						if(GeneralHandling.is_numeric(dats[dats.length-1].replace(/-/g, '')))
						{
							dats[dats.length-1] = parseInt(dats[dats.length-1]+2);
							me.name = dats.join('-');
						}
						else me.name = me.name+'-1';
					}
					else found = false;
				}
			}
			else
			{
				me.name = GeneralHandling.safeFileName(param['name']);
			}
			me.dateTime = GeneralHandling.datetimeNow();
			var val = await me.insert();
			return val;
		} 
		catch(error)
		{
			throw(error);
		}		
	}

	async updateRow(param)
	{
		var me = this;
		try
		{
			if(param['templateId'] && param['templateId'] != '')
			{
				param['modularData'] = JSON.stringify(param['modularData']);
				var wt = new WikiTemplates(me.session);
				wt.id = param['templateId'];
				wt.select();
				param['content'] = wt.content;
			}
			else
			{
				param['templateId'] = null;
				param['modularData'] = null;
			}
			
			for(var key in param)
			{
				me[key] = param[key];
			}
			if(param['name'] == '') me.name = GeneralHandling.safeFileName(param['header']);
			else me.name = GeneralHandling.safeFileName(param['name']);
			var val = await me.update();
			if(val['error'] == false) await me.db.query("UPDATE wiki_content SET parsedContent='' WHERE wikiId=?", [param['wikiId']]);
			return val;
		}
		catch(error)
		{
			throw(error);
		}		
	}

	async deleteWikiCache(param)
	{
		var me = this;
		try 
		{
			await me.db.query("UPDATE wiki_content SET parsedContent=''");
			return {'error': false, 'notice': me.translate('CACHECLEARED')};
		} 
		catch(error) 
		{
			throw(error);
		}
	}

	async deleteRow(param)
	{
		var me = this;
		try 
		{
			var results = await me.db.query("SELECT * FROM wiki_content WHERE wikiId=?", [param['id']]);
			var row = results[0];
			if(row['categoryId'] == 1) return {'error': true, 'notice': me.translate('CANNOTDELETEARTICLEINSYSTEMCATEGORY')};
			return super.deleteRow(param);
		} 
		catch(error)
		{
			throw(error);
		}
	}

	async getWikiSource(param)
	{
		var me = this;
		try 
		{
			var results = await me.db.query("SELECT content FROM wiki_content WHERE wikiId=?", [param['wikiId']]);
			var row = results[0];
			if(row['content'] == undefined) return {'error': true, 'notice': me.translate('NOWIKIFOUND')};
			return {'error': false, 'data': row['content']};
		} 
		catch(error)
		{
			throw(error);
		}
	}

	async getSingleWiki(param)
	{
		var me = this;
		try 
		{
			var results = await me.db.query("SELECT * FROM wiki_content WHERE wikiId=?", [param['wikiId']]);
			var row = results[0];

			if(row['content'] == undefined) return {'error': true, 'notice': me.translate('NOWIKIFOUND')};

			try
			{
				row.modularData = JSON.parse(row.modularData);
			}
			catch(e)
			{
				row.modularData = {};
			}
			
			return {'error': false, 'data': row};
		} 
		catch(error)
		{
			throw(error);
		}
	}

	async getWikiByName(param)
	{
		var me = this;
		try 
		{
			var wiki = new Wiki(me.session);
			await wiki.getWiki(param.wikiName);
			return {'error': false, 'data': wiki.content};
		} 
		catch(error)
		{
			throw(error);
		}
	}

	async copyToLang(param)
	{
		var me = this;
		try 
		{
			var results = await me.db.query("INSERT INTO wiki_content (name, langId, header, featured, categoryId, dateTime, content, templateId, modularData) SELECT name, ?, header, featured, categoryId, ?, content, templateId, modularData FROM wiki_content WHERE wikiId=?", [param['langId'], date('Y-m-d H:i:s'), param['wikiId']]);
			return {'error': false, 'notice': me.translate('SUCCESS')};
		} 
		catch(error)
		{
			throw(error);
		}
	}

	async getWikiModules(param)
	{
		var me = this;
		try 
		{
			var wiki = new Wiki(me.session);
			var data = await wiki.getModules(param.templateId, param.wikiId);
			return {'error': false, 'data': data};
		} 
		catch(error)
		{
			throw(error);
		}
	}
}
