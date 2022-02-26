var WikiTemplates = require('../objects/WikiTemplates.js'),
	GeneralHandling = require('../lib/GeneralHandling.js'),
	config = require('config');
/**
  * Wiki = class for all static (database) text that site uses, provides parsing functionalities
  *
  * @author  Dario Filkovic <dfilkovi@gmail.com>
  *
  * @since 1.0
  * @todo This all things should go to Wiki Object, not here
  * @package CoreFw
  */
module.exports = class Wiki 
{
	/**
	* Constructor setting needed object and fetching wiki
	* Set admin to true if you want to enable inline editing (on-site editing) for super administrators
	*
	* @author  Dario Filkovic <dfilkovi@gmail.com>
	*
	* @since 1.0
	*
	* @package CoreFw
	* @param String wikiName
	* @param boolean admin
	* @return void
	*/
	constructor(session, wikiName, fallback = false)
	{
		var me = this;
		/**
		* Fallback to default language if article in requested language not found
		* @type boolean
		*/
		me.fallback = fallback;
		/**
		* Resulting content Array
		* @type Array
		*/
		me.content = {};

		me.session = session;
		me.db = session.db;
		me.lang = session.lang;
	}
	
	/**
	* Prepare wiki name
	*
	* @author  Dario Filkovic <dfilkovi@gmail.com>
	*
	* @since 1.0
	*
	* @package CoreFw
	* @param String wikiName
	* @return String
	*/
	prepareWikiName(wikiName)
	{
		if(wikiName == undefined) return '';
		return wikiName.replace(/ /g, '-', wikiName).toLowerCase();
	}
	
	/**
	* Get wiki
	*
	* Returns:
	* <code>
	*	return {
	*		'id': '',
	*		'header': '',
	*		'date': '',
	*		'name': '',
	*		'categoryId': '',
	*		'content': ''
	*	);
	* </code>
	* @author  Dario Filkovic <dfilkovi@gmail.com>
	*
	* @since 1.0
	*
	* @package CoreFw
	* @return Array
	*/
	async getWiki(wikiName)
	{
		var me = this;
		try 
		{
			me.wikiName = me.prepareWikiName(wikiName);
			var results = await me.db.query("SELECT wc.*, wct.categoryName FROM wiki_content wc JOIN wiki_category wct ON wct.categoryId=wc.categoryId WHERE wc.name=? AND wc.langId=?", [me.wikiName, me.session.langId]);
			var row = results[0];
			
			if(row != undefined && me.lang.lang != me.session.langId && me.fallback == true)
			{
				results = await me.db.query("SELECT wc.*, wct.categoryName FROM wiki_content wc JOIN wiki_category wct ON wct.categoryId=wc.categoryId WHERE wc.name=? AND wc.langId=?", [me.wikiName, me.session.langId]);
				row = results[0];
			}
			
			if(row == undefined)
			{
				me.content = {'header': '', 'name': '', 'date': '', 'content': me.session.translate('NOWIKIFOUND')};
				return;
			}
			
			var modularData = {},
				content;

			if(row['templateId'] != null)
			{
				content = await me.returnContentByTemplate(row['templateId'], row);
				modularData = JSON.parse(row['modularData']);
			}
			else
			{
				if(row['parsedContent'] != '' && row['parsedContent'] != null && me.session.groupId != 1) content = row['parsedContent'];
				else
				{
					content = row['content'];
					me.cacheContent(content);
				}

			}
			
			me.content = {
				'id': row['wikiId'],
				'header': row['header'],
				'date': row['dateTime'],
				'name': row['name'],
				'featured': row['featured'],
				'categoryId': row['categoryId'],
				'categoryName': row['categoryName'],
				'templateId': row['templateId'],
				'content': content,
				'rowdata': row,
				'modularData': modularData
			};
		} 
		catch(error)
		{
			throw(error);
		}
	}
	
	async returnContentByTemplate(templateId, wikiData)
	{
		var me = this;
		try 
		{
			var results = await me.db.query("SELECT * FROM wiki_templates WHERE templateId=?", [templateId]);
			var row = results[0];
			
			if(row == undefined) throw new Exception('Wiki template not found');
			
			var modularData = JSON.parse(wikiData.modularData);
			
			var html = row['content'];
			
			var vars = [];
			var dats = html.split('{#');
			if(dats[0] != undefined) dats.shift();
			for(var value of dats)
			{
				var dat = value.split('}');
				vars.push(dat[0]);
			}
			
			for(var value of vars)
			{
				var re = new RegExp('{#'+value+'}', "g");
				html = html.replace(re, me.session.translate(value));
			}

			var re = new RegExp('{mod:header}', "g");
			html = html.replace(re, wikiData.header);

			var re = new RegExp('{mod:date}', "g");
			html = html.replace(re, wikiData.dateTime);

			var re = new RegExp('{mod:name}', "g");
			html = html.replace(re, wikiData.name);

			var re = new RegExp('{mod:category}', "g");
			html = html.replace(re, wikiData.categoryName);

			var datOne = html.split('{mod');
			datOne.shift();
			var modules = {};
			var n = 1;
			
			for(var value of datOne)
			{
				var datSec = value.split('}');
				var datTrd = datSec[0].split(':');
	
				var re = new RegExp('{mod'+datSec[0]+'}', "g");
				if(datTrd[1] == 'linkfield' && modularData[datTrd[2]+'_link'] != undefined)
				{
					html = html.replace(re, '<a href="'+modularData[datTrd[2]+'_link']+'" alt="'+modularData[datTrd[2]+'_alt']+'" '+((modularData[datTrd[2]+'_check'] != undefined) ? 'checked="checked"' : '')+'>'.modularData[datTrd[2]+'_text']+'</a>');
				}
				else
				{
					var rep = (modularData[datTrd[2]] != undefined) ? modularData[datTrd[2]] : '';
					html = html.replace(re, rep);
				}
			}
			return html;
		} 
		catch(error)
		{
			throw(error);
		}	
	}
	
	async getModules(templateId, initialId = false)
	{
		var me = this;
		try 
		{
			var modules = [],
				initialValues = {};

			if(initialId != false)
			{
				var results = await me.db.query("SELECT * FROM wiki_content WHERE wikiId=?", [initialId]);
				var row = results[0];
				
				initialValues = JSON.parse(row['modularData']);
			}
			
			if(templateId != '')
			{
				var categories = [];
				var results = await me.db.query("SELECT * FROM images_category ORDER BY categoryId DESC");
				for(var row of results)
				{
					categories.push(row);
				}
				
	
				var wt = new WikiTemplates(me.session);
				wt.id = templateId;
				await wt.select();
				var datOne = wt.content.split('{mod');

				datOne.shift();

				var alreadySetModules = [];
				var n = 1;
				for(var value of datOne)
				{
					var datSec = value.split('}');
					var datTrd = datSec[0].split(':');
	
					if(alreadySetModules.indexOf(datTrd[2]) !== -1) continue;
					
					alreadySetModules.push(datTrd[2]);

					switch(datTrd[1])
					{
						case 'textfield':
							modules.push({
								type: 'textfield',
								name: datTrd[2],
								title: me.session.translate(GeneralHandling.safeTrans('INPUT_'+datTrd[2])),
								value: (initialValues[datTrd[2]] != undefined) ? initialValues[datTrd[2]] : ''
							});
							break;
						case 'linkfield':
							modules.push({
								type: 'linkfield',
								name: datTrd[2],
								namelink: datTrd[2],
								namecheck: datTrd[2],
								namealt: datTrd[2],
								nametext: datTrd[2],
								title: me.session.translate(GeneralHandling.safeTrans('INPUT_'+datTrd[2])),
								valuetext: (initialValues[datTrd[2]+'_text'] != undefined) ? initialValues[datTrd[2]+'_text'] : '',
								valuelink: (initialValues[datTrd[2]+'_link'] != undefined) ? initialValues[datTrd[2]+'_link'] : '',
								valuealt: (initialValues[datTrd[2]+'_alt'] != undefined) ? initialValues[datTrd[2]+'_alt'] : '',
								checked: (initialValues[datTrd[2]+'_check'] != undefined) ? 'checked' : ''
							});
							break;
						case 'imagescat':
							modules.push({
								type: 'imagescat',
								name: datTrd[2],
								title: me.session.translate(GeneralHandling.safeTrans('INPUT_'+datTrd[2])),
								repeatoptions: (categories != undefined) ? categories : false
							});
							break;
						case 'textarea':
							modules.push({
								type: 'textarea',
								name: datTrd[2],
								title: me.session.translate(GeneralHandling.safeTrans('INPUT_'+datTrd[2])),
								value: (initialValues[datTrd[2]] != undefined) ? initialValues[datTrd[2]] : ''
							});
							break;
						case 'location':
							modules.push({
								type: 'location',
								name: datTrd[2],
								title: me.session.translate(GeneralHandling.safeTrans('INPUT_'+datTrd[2])),
								value: (initialValues[datTrd[2]] != undefined) ? initialValues[datTrd[2]] : ''
							});
							break;
						case 'wysiwyg':
							modules.push({
								type: 'wysiwyg',
								num: n,
								name: datTrd[2],
								title: me.session.translate(GeneralHandling.safeTrans('INPUT_'+datTrd[2])),
								value: (initialValues[datTrd[2]] != undefined) ? initialValues[datTrd[2]] : ''
							});
							break;
						case 'fileupload':
							modules.push({
								type: 'fileupload',
								num: n,
								name: datTrd[2],
								title: me.session.translate(GeneralHandling.safeTrans('INPUT_'+datTrd[2])),
								value: (initialValues[datTrd[2]] != undefined) ? initialValues[datTrd[2]] : '',
								displayhref: 'display: none;',
								displayimg: 'display: none;',
								imagetype: datTrd[3]
							});
							break;
						case 'imgupload':
							modules.push({
								type: 'imgupload',
								num: n,
								name: datTrd[2],
								title: me.session.translate(GeneralHandling.safeTrans('INPUT_'+datTrd[2])),
								value: (initialValues[datTrd[2]] != undefined) ? initialValues[datTrd[2]] : '/css/images/ui-bg_diagonals-thick_20_666666_40x40.png'
							});
							break;
					}
					n++;
				}
			}
			
			return modules;
		}
		catch(error)
		{
			throw(error);
		}
	}

	/**
	* Cache wiki content to database
	*
	* @author  Dario Filkovic <dfilkovi@gmail.com>
	*
	* @since 1.0
	*
	* @package CoreFw
	* @param String content
	* @return Array Array of 'error' boolean 'notice' message
	*/
	async cacheContent(content)
	{
		var me = this;
		try 
		{
			if(config.cacheWiki && config.cacheWiki == false) return;
			await me.db.query("UPDATE wiki_content SET parsedContent=? WHERE name=? AND langId=?", [content, me.wikiName, me.lang.lang]);
		}
		catch(error) 
		{
			throw(error);
		}		
	}
}