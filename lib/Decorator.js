var GeneralHandling = require('./GeneralHandling.js');

/**
 * module.exports = class providing decorating values (changing them) before entry, decorators are defined individualy in extended Object
 *
 * @author  Dario Filkovic <dfilkovi@gmail.com>
 *
 * @since 1.0
 *
 * @package CoreFw
 */
module.exports = class Decorator
{
    /**
     * Decorate object values if decorators are defined in Object subclasses
     * <code>
     *	public function tableConf(){
     *	return {
     *		'tableName': 'wiki_content',
     *		'id': {
     *			'wikiId': {
     *				'fieldType': 'int',
     *				'maxlength': 30,
     *				'req': 0
     *			)
     *		),
     *		'fields': {
     *			'content': {
     *				'fieldType': 'text',
     *				'decorators': ['leaveuntouched'],
     *				'req': 1
     *			)
     *		)
     *	);
     * </code>
     * Important!!! All values are passed through htmlspecialchars and strip_tags, for safe query, if you wan't to put value as is put 'leaveuntouched' decorator
     *
     * @todo Need to se if some decorators are defined should strip_tags and htmlspecialchars be used, cause now they are not as I see, so if you use some uppercase decorator for example, someone could put html injection??????
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param mixed[] instance Object instance
     * @param mixed[] insert Array of object values that need to be inserted or updated
     * @return void
     */
    constructor(instance, insert)
    {
        var me = this;
        me.instance = instance;
        me.insert = insert;
        var nameValues = instance.tableConf();
        for (var key in nameValues['fields'])
        {
            var field = nameValues['fields'][key];
            if (typeof me.instance[key] != 'undefined' && typeof me.instance[key] != 'object')
            {
                if (typeof field['decorators'] != 'undefined')
                {
                    for (var i = 0; i < field['decorators'].length; i++)
                    {
                        var func = field['decorators'][i];
                        me[func](key);
                        me.insert[key] = me.instance[key];
                    }
                }
                else if (field['fieldType'] == 'text' || field['fieldType'] == 'string')
                {
                    me.instance[key] = GeneralHandling.escapeHtml(GeneralHandling.returnNoHiddenTags(GeneralHandling.unescapeHtml(me.instance[key])));
                    me.insert[key] = me.instance[key];
                }
            }
        }

        for (var key in nameValues['id'])
        {
            var field = nameValues['id'][key];
            if (typeof me.instance[key] != 'undefined' && typeof me.instance[key] != 'object')
            {
                if (typeof field['decorators'] != 'undefined')
                {
                    for (var i = 0; i < field['decorators'].length; i++)
                    {
                        var func = field['decorators'][i];
                        me[func](key);
                        me.insert[key] = me.instance[key];
                    }
                }
                else if (field['fieldType'] == 'text' || field['fieldType'] == 'string')
                {
                    me.instance[key] = GeneralHandling.escapeHtml(GeneralHandling.returnNoHiddenTags(GeneralHandling.unescapeHtml(me.instance[key])));
                    me.insert[key] = me.instance[key];
                }
            }
        }
    }

    /**
     * Remove hidden tags from value
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String field Field name
     * @return void
     */
    nohiddentags(field)
    {
        var me = this;
        me.instance[field] = GeneralHandling.returnNoHiddenTags(me.instance[field]);
    }

    /**
     * Leave values untouched, this is needed cuase default is to strip_tags and htmlspecialchars
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String field Field name
     * @return void
     */
    leaveuntouched(field)
    {
        return false;
    }

    /**
     * Use safeVariableName from GeneralHandling on a value
     *
     * @see GeneralHandling::safeVariableName()
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String field Field name
     * @return void
     */
    safevarname(field)
    {
        var me = this;
        me.instance[field] = GeneralHandling.safeVariableName(me.instance[field]);
    }

    /**
     * Use safeTrans from GeneralHandling on a value
     *
     * @see GeneralHandling::safeTrans()
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String field Field name
     * @return void
     */
    safetrans(field)
    {
        var me = this;
        me.instance[field] = GeneralHandling.safeTrans(me.instance[field]);
    }

    /**
     * Uppercase value
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String field Field name
     * @return void
     */
    uppercase(field)
    {
        var me = this;
        me.instance[field] = me.instance[field].toUpperCase();
    }

    /**
     * Lowercase value
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String field Field name
     * @return void
     */
    lowercase(field)
    {
        var me = this;
        me.instance[field] = me.instance[field].toLowerCase();
    }

    /**
     * Put target="_blank" and rel="nofollow" on all links
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String field Field name
     * @return void
     */
    handleHrefTag(field)
    {
        var me = this;
        var re = new RegExp('`<a\s+[^>]*(href=([\'\"]).*\\2)[^>]*>(.*?)</a>`isU');
        me.instance[field] = me.instance[field].replace(re, '<a target="_blank" rel="nofollow" 1>3</a>');
    }

    /**
     * Remove e-mail addresses from string
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String field Field name
     * @return void
     */
    removeEmail(field)
    {
        var me = this;
        var re = new RegExp("/[^@\s]*@[^@\s]*\.[^@\s]*/");
        me.instance[field] = me.instance[field].replace(re, '');
    }

    /**
     * Remove web addresses from string
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String field Field name
     * @return void
     */
    removeWebUrl(field)
    {
        var me = this;
        var re = new RegExp("/[a-zA-Z]*[:\/\/]*[A-Za-z0-9\-_]+\.+[A-Za-z0-9\.\/%&=\?\-_]+/i");
        me.instance[field] = me.instance[field].replace(re, '');
    }

    /**
     * Change ',' to '.' prior to entry
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String field Field name
     * @return void
     */
    decimalpoint(field)
    {
        var me = this;
        var re = new RegExp("/,/i");
        me.instance[field] = me.instance[field].replace(re, '.');
    }
}