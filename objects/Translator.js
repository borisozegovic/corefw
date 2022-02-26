/**
 * Translator object
 *
 * @version $Id$
 * @copyright 2008
 */
module.exports = class Translator extends CfwObject
{
	constructor(session)
	{
		var proxy = super(session);

		var me = this;

		me.alreadyChecked = [];

		me.preventLogging = true;
		me.languages = false;

		return proxy;
	}

	tableConf()
	{
		return {
			'tableName': 'translator',
			'id': {
				'key': {
					'fieldType': 'text',
					'maxlength': 255,
					'req': 1
				},
				'langId': {
					'fieldType': 'int',
					'maxlength': 20,
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

	async getLanguageTranslations(param)
	{
		var me = this;
		try
		{
			var results = await me.db.query("SELECT * FROM trans_lang");

			var languages = {};
			for(var i=0;i<results.length;i++)
			{
				var result = results[i];
				languages[result.langId] = me.translate(result.langName.toUpperCase());
			}

			var limit = '';
			if(typeof param['start'] != 'undefined' && typeof param['limit'] != 'undefined')
			{
				var start = me.db.escape(parseInt(param['start']));
				var end = me.db.escape(parseInt(param['limit']));
				limit = ' LIMIT '+start+', '+end+' ';
			}

			var params = {},
				where = '',
				data = [];

			if(typeof param.queryTranslated != 'undefined' && param.queryTranslated != '')
			{
				where = ' AND (`key` LIKE :query OR `value` LIKE :query) ';
				params.query = '%'+param.queryTranslated+'%';

				results = await me.db.query("SELECT COUNT(DISTINCT `key`) AS cnt FROM translator WHERE 1=1 "+where, params)

				var totalCount = 0;
				if(typeof results[0] != 'undefined') totalCount = results[0].cnt;

				results = await me.db.query("SELECT MAX(`key`) AS `key`, MAX(langId) AS langId, MAX(`value`) AS `value` FROM translator WHERE 1=1 "+where+" GROUP BY `key` "+limit, params)

				for(var res of results)
				{
					for(var langId in languages)
					{
						var val = await me.getTranslationByKeyAndLangId(res.key, langId)
						res[langId] = val;
					}
					data.push(res);
				}

				return {root: data, totalCount: totalCount, languages: languages}
			}
			else
			{
				if(typeof param.queryUntranslated != 'undefined' && param.queryUntranslated != '')
				{
					where = ' AND (`key` LIKE :query) ';
					params.query = '%'+param.queryUntranslated+'%';
				}

				results = await me.db.query("SELECT COUNT(DISTINCT `key`) AS cnt FROM untranslated WHERE 1=1 "+where, params)

				var totalCount = 0;
				if(typeof results[0] != 'undefined') totalCount = results[0].cnt;

				results = await me.db.query("SELECT MAX(`transId`) AS `transId`, MAX(`key`) AS `key`, MAX(`page`) AS `page` FROM untranslated WHERE 1=1 "+where+" GROUP BY `key` "+limit, params)

				for(var res of results)
				{
					for(var langId in languages)
					{
						var val = await me.getTranslationByKeyAndLangId(res.key, langId)
						res[langId] = val;
					}
					data.push(res);
				}

				return {root: data, totalCount: totalCount, languages: languages}
			}
		}
		catch(e)
		{
			throw(e);
		}
	}

	async getTranslationByKeyAndLangId(key, langId)
	{
		var me = this;
		try
		{
			var results = await me.db.query("SELECT * FROM translator WHERE langId=? AND `key`=?", [langId, key])

			if(typeof results[0] != 'undefined')
			{
				return results[0].value;
			}
			return '';
		}
		catch(e)
		{
			throw(e);
		}
	}

	async saveTrans(param)
	{
		var me = this;
		try
		{
			me.db = await me.db.begin(me.session);
			var results = await me.db.query("SELECT * FROM trans_lang")

			var languages = {};
			for(var result of results)
			{
				languages[result.langId] = true;
			}

			for(var langId in languages)
			{
				if(typeof param[langId] != 'undefined')
				{
					if(param[langId] == '') continue;
					me.id = {key: param.key, langId: langId};
					me.value = param[langId];
					await me.insert();
				}
			}

			me.db.query("DELETE FROM untranslated WHERE `key`=?", [param.key]);

			me.db = me.db.commit();

			return {error: false, notice: me.translate('SUCCESS')}
		}
		catch(e)
		{
			me.db = me.db.rollback();
			throw(e);
		}
	}

	async deleteTrans(param)
	{
		var me = this;
		try 
		{
			await me.db.query("DELETE FROM translator WHERE `key`=?", [param.key]);
			await me.db.query("DELETE FROM untranslated WHERE `key`=?", [param.key]);
			return {error: false, notice: me.translate('SUCCESS')}
		} 
		catch(err)
		{
			throw(err)
		}
	}

	async emptyUntranslated(param)
	{
		var me = this;
		try 
		{
			await me.db.query("DELETE FROM untranslated");
			return {error: false, notice: me.translate('SUCCESS')}
		} 
		catch(err)
		{
			throw(err)
		}
	}

	/**
	 * check untranslated key
	 *
	 */
	async checkTrans(param)
	{
		var me = this;
		try
		{
			if(me.alreadyChecked.indexOf(param['key']) == -1)
			{
				me.alreadyChecked.push(param['key']);
				me.db.query("SELECT COUNT(*) AS cnt FROM `untranslated` WHERE `key`=?", [param['key']], function (error, results, fields)
				{
					if(results[0].cnt == 0)
					{
						me.db.query("REPLACE INTO `untranslated` (`key`, `page`) VALUES (?, ?)", [param['key'], '']);
					}
				});
			}
			return {error: false, notice: 'Word inserted'}
		}
		catch(e)
		{
			throw(e)
		}
	}

	async getLanguage()
	{
		var me = this;
		try
		{
			var results = await me.db.query("SELECT * FROM trans_lang")

			for(var result of results)
			{
				me.languages[result.langId] = me.translate(result.langName.toUppercase());
			}

			return {'translator': me.lang.trans, 'languages': me.languages, 'currentLang': me.lang.lang}
		}
		catch(e)
		{
			throw(e);
		}
	}

	/**
	 * get languages codes
	 *
	 */
	async getLangCode(lang)
	{
		var me = this;
		try
		{
			var data = {};
			var results = await me.db.query("SELECT langId, langCode FROM trans_lang")

			for(var result of results)
			{
				data[result.langId] = result.langCode;
			}

			if(typeof data[lang] != 'undefined') return(data[lang]);
			else return('HR');
		}
		catch(e)
		{
			throw(e);
		}
	}

	/**
	 * get languages id
	 *
	 */
	async getLangDefs()
	{
		var me = this;
		try
		{
			var data = {},
				codes = {};
				
			var results = await me.db.query("SELECT langId, langCode FROM trans_lang")

			for(var result of results)
			{
				data[result.langCode.toLowerCase()] = result.langId;
				codes[result.langId] = result.langCode.toLowerCase();
			}

			return({langDefs: data, langCodes: codes});
		}
		catch(e)
		{
			throw(e);
		}
	}

	/**
	* get language translation
	*
	*/
	async getTranslation()
	{
		var me = this;
		try
		{
			var data = {};
			var results = await me.db.query("SELECT * FROM `translator`")

			for(var result of results)
			{
				if(typeof data[result.langId] == 'undefined') data[result.langId] = {};
				data[result.langId][result.key] = result.value;
			}

			return data;
		}
		catch(e)
		{
			throw(e);
		}
	}
}
