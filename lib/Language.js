var GeneralHandling = require('../lib/GeneralHandling.js'),
	Translator = require('../objects/Translator.js');

/**
  * Language class
  *
  * module.exports = class providing language methods, translation and language cache filling
  *
  * @author  Dario Filkovic <dfilkovi@gmail.com>
  *
  * @since 1.0
  *
  * @package CoreFw
  */
module.exports = class Language
{
	/**
	* constructor()
	*
	* Constructor initializing Translator object, Cache and filling language variables
	*
	* @author  Dario Filkovic <dfilkovi@gmail.com>
	*
	* @since 1.0
	*
	* @package CoreFw
	*
	*/
	constructor()
	{
		var me = this;

		/**
		* Translator object
		* @type Translator
		*/
		me.transObj = new Translator();
	}

	/**
	* fillTrans()
	*
	* Check cache for translation, if it doesn't exist, ask Translator object for translation and fill Cache
	*
	* @author  Dario Filkovic <dfilkovi@gmail.com>
	*
	* @since 1.0
	*
	* @package CoreFw
	*
	* @return void
	*/
	async fillTrans()
	{
		var me = this;
		try
		{
			me.trans = await me.transObj.getTranslation();

			var data = await me.transObj.getLangDefs();
			me.langDefs = data.langDefs;
			me.langCodes = data.langCodes;

			return {error: false, notice: 'Success'}
		}
		catch(e)
		{
			throw(e)
		}
	}

	/**
	* translate()
	*
	* Translate variable by key, if key was not found check translation
	*
	* @author  Dario Filkovic <dfilkovi@gmail.com>
	*
	* @since 1.0
	*
	* @package CoreFw
	*
	* @param String $key Key for translating
	* @return String Returns translated key
	*/
	translate(key, langId)
	{
		var me = this;
		key = GeneralHandling.safeTrans(key);
		if(typeof me.trans[langId] != 'undefined' && typeof me.trans[langId][key] != 'undefined')
		{
			if(me.trans[langId][key] == "") return '#'+key;
			return me.trans[langId][key];
		}
		else
		{
			if(key == '') return '#EMPTYKEY';
			me.checkTrans(key);
			return '#'+key;
		}
	}

	/**
	* _()
	*
	* @see translate
	*
	* @since 1.0
	*
	* @package CoreFw
	*
	* @param String $key Key for translating
	* @return String Returns translated key
	*/
	_(key)
	{
		return me.translate(key);
	}

	/**
	* checkTrans()
	*
	* Check translation in Translator object, Translator object should handle insertion to database if key is untranslated
	*
	* @author  Dario Filkovic <dfilkovi@gmail.com>
	*
	* @since 1.0
	*
	* @package CoreFw
	*
	* @param mixed[] $key Translation key
	* @return void
	*/
	checkTrans(key)
	{
		var me = this;
		key = GeneralHandling.safeTrans(key);
		me.transObj.checkTrans({key: key});
	}
}
