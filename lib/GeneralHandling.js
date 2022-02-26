var moment = require('moment');
/**
 * module.exports = class providing static functions for handling strings, images, common data, country data etc.
 *
 * @author  Dario Filkovic <dfilkovi@gmail.com>
 *
 * @since 1.0
 *
 * @package CoreFw
 */
module.exports = {
    /*
     * Defines image extensions
     */
    imageExtensions: ['gif', 'jpg', 'jpeg', 'png'],
    /*
     * Defines image extensions
     */
    vectorImageExtensions: ['svg'],

    is_numeric(n)
    {
        return !isNaN(parseFloat(n)) && isFinite(n);
    },

    /**
     * Static function for making a variable name safe (removing non-ascii chars and placing string before number)
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param string string  Input variable name
     * @return string Returns safe string
     */
    safeVariableName(string)
    {
        var me = this;
        string = me.remove_accents(string);
        string = me.removeSpecialChar(string, true);
        if (me.is_numeric(string.substr(0, 1))) string = string.substr(1);
        if (string.substr(0, 3).toLowerCase() == 'xml') string = string.substr(3);
        if (me.is_numeric(string.substr(0, 1))) string = '_' + string;
        string = string.replace(new RegExp('@/(\d)@', "g"), "\n");
        string = string.replace(new RegExp('/-\\1', "g"), "\n");
        var replaces = [
            [" ", "-"],
            ["!", ""],
            ["\\?", ""],
            ["\\.", ""]
        ];
        for (var replace of replaces)
        {
            var re = new RegExp(replace[0], "g");
            string = string.replace(re, replace[1]);
        }
        return string
    },

    /**
     * Static function for making a filename safe (removing non-ascii chars)
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param string string  Input variable name
     * @return string Returns safe string
     */
    safeFileName(string)
    {
        var me = this;
        string = me.remove_accents(string);

        string = me.removeSpecialChar(string);

        var string = string.toLowerCase();

        if (me.is_numeric(string.substr(0, 1))) string = '-' + string;

        var re = new RegExp('@/(\d)@', "g");
        string = string.replace(re, '/-\\1');

        var replaces = [
            [" ", "_"],
            ["!", ""],
            ["\\?", ""],
            ["\\.", ""]
        ];
        for (var replace of replaces)
        {
            var re = new RegExp(replace[0], "g");
            string = string.replace(re, replace[1]);
        }

        return string
    },

    /**
     * Static function for making a wiki name safe (removing non-ascii chars)
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param string string  Input variable name
     * @return string Returns safe string
     */
    safeURLName(string)
    {
        string = me.remove_accents(string);
        string = me.removeSpecialChar(string, true);
        var lowerstring = string.toLowerCase();
        if (me.is_numeric(string.substr(0, 1))) lowerstring = '-' + lowerstring;
        var re = new RegExp('@/(\d)@', "g");
        string = string.replace(re, '/-\\1');
        var replaces = [
            [" ", "_"],
            ["!", ""],
            ["\\?", ""],
            ["\\.", ""]
        ];
        for (var replace of replaces)
        {
            var re = new RegExp(replace[0], "g");
            string = string.replace(re, replace[1]);
        }
        return string
    },

    /**
     * Static function for making a translation variable safe (removing non-ascii chars)
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param string string  Input variable name
     * @return string Returns safe string
     */
    safeTrans(string)
    {
        var me = this;
        string = me.remove_accents(string);
        string = me.removeSpecialChar(string, true);
        string = string.toUpperCase();
        if (me.is_numeric(string.substr(0, 1))) string = 'X' + string;

        var replaces = [
            [" ", "_"],
            ["!", ""],
            ["\\?", ""],
            ["\\.", ""]
        ];
        for (var replace of replaces)
        {
            var re = new RegExp(replace[0], "g");
            string = string.replace(re, replace[1]);
        }

        return string
    },

    /**
     * Static function for removing non-ascii chars and optionali substring to return first 50 chars
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param string string  Input string
     * @param boolean nosubstr  False (default) to substring to 50 chars
     * @return string Returns safe string
     */
    removeSpecialChar(string, nosubstr = false)
    {
        string = string.replace(/ /g, '-');
        string = string.replace(/[^0-9a-zA-Z_\-]/g, '');
        if (nosubstr == false) string = string.substr(0, 50);
        return string;
    },

    /**
     * Static function for replacing Croatian characters to their non accent defaults
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param string string  Input string
     * @return string Returns safe string
     */
    remove_accents(string)
    {
        return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    },

    /**
     * Static function for safe URL, second parameter is unused (probably an error)
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param string url  Input url
     * @return string Returns safe url
     */
    safeUrl(url)
    {
        return this.safeFileName(url, replace = '%20');
    },

    /**
     * Static function providing calculation to convert between HRK to different currencies
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param float num  Input value in HRK (Croatian kuna)
     * @param string currency  Currency to which a number should be converted
     * @param string date  (Optional) Defaults to false, if we want to use currency status on certain day
     * @return float Returns final calculated amount
     */
    /*
	currencyReturnHr(num, currency, date = false)
	{
		if(currency == 'hrk') return num;

		data = false;
		if(date == false) time = time();
		else time = strtotime(date);
		n = 0;
		ctx = stream_context_create({
			'http': {
				'timeout': 1
				)
			)
		);

		while(data == false)
		{
			data = @file_get_contents('http://www.hnb.hr/tecajn/f'.date('dmy', time).'.dat', 0, ctx);
			time = time-86400;
			n++;
			if(n > 10) break;
		}

		if(data == false) die('Cannot fetch currency, contact site admin');

		switch(currency)
		{
			case 'gbp':
			course = explode('826GBP001', data);
			break;
			case 'usd':
			course = explode('840USD001', data);
			break;
			case 'eur':
			course = explode('978EUR001', data);
			break;
		}

		data = explode('       ', course[1]);
		data = str_replace(',', '.', data);
		return (num*data[2]);
	}
*/

    /**
     * Static function providing calculation to convert between different currencies
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param float num  Input value in originalCurrency
     * @param string currency  Currency to which a number should be converted
     * @param string originalCurrency  Currency from which a number should be converted
     * @param string date  (Optional) Defaults to false, if we want to use currency status on certain day
     * @return float Returns final calculated amount
     */
    /*
    public static function currencyTransform(num, currency, originalCurrency, date = false)
    {
    	//no need for currency transformation
    	if(currency == originalCurrency) return num;
    	//get current currency value, if not existent use yesterdays
    	data = false;
    	if(date == false) time = time();
    	else time = strtotime(date);
    	n = 0;

    	ctx = stream_context_create({
    		'http': {
    			'timeout': 1
    			)
    		)
    	);

    	while(data == false)
    	{
    		dateHnb = date('dmy', time);
    		data = @file_get_contents('http://www.hnb.hr/tecajn/f'.dateHnb.'.dat', 0, ctx);
    		time -= 86400;
    		n++;
    		if(n > 10) break;
    	}

    	if(data == false) die('Cannot fetch currency, contact site admin');

    	switch(currency)
    	{
    		case 'gbp':
    		course = explode('826GBP001', data);
    		break;
    		case 'usd':
    		course = explode('840USD001', data);
    		break;
    		case 'eur':
    		course = explode('978EUR001', data);
    		break;
    	}

    	if(originalCurrency != false && originalCurrency != 'hrk')
    	{
    		switch(originalCurrency)
    		{
    			case 'gbp':
    			origCourse = explode('826GBP001', data);
    			break;
    			case 'usd':
    			origCourse = explode('840USD001', data);
    			break;
    			case 'eur':
    			origCourse = explode('978EUR001', data);
    			break;
    		}
    		dataOrig = explode('       ', origCourse[1]);
    		dataOrig = str_replace(',', '.', dataOrig);
    		num = (num*dataOrig[2]);
    	}

    	if(isset(course[1]))
    	{
    		data = explode('       ', course[1]);
    		data = str_replace(',', '.', data);
    		return (num/data[2]);
    	}
    	else return num;
    }
    */

    /**
     * Static function providing calculation to convert between different currencies
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param float value  Input value in originalCurrency or default HRK (Croatian kuna)
     * @param string type  Type to which to convert ('hr', 'us', 'eu') (number formatting)
     * @param string currency  Currency to which a number should be converted
     * @param string originalCurrency  Currency from which a number should be converted
     * @param boolean noAbrv  True to hide currency abbreviation
     * @param string date  (Optional) Defaults to false, if we want to use currency status on certain day
     * @return string Returns final calculated amount with currency abbriviation
     */
    /*
	public static function currencyType(value, type = 'hr', currency = 'hrk', originalCurrency = false, noAbrv = false, date = false)
	{
		if(currency != 'hrk' || originalCurrency != false) value = _cfw_lib_GeneralHandling::currencyTransform(value, currency, originalCurrency, date);

		if(type == 'hr')
		{
			value = number_format(value, 2, ',', '.');
	   		var = explode(",", (string)value);
			if(!isset(var[1])) num = value.",00";
			else if(strlen(var[1]) == 1) num = value."0";
			else if(strlen(var[1]) == 2) num = value;
		}
		else if(type == 'us')
		{
			value = number_format(value, 2);
	   		var = explode(".", (string)value);
			if(!isset(var[1])) num = value.".00";
			else if(strlen(var[1]) == 1) num = value."0";
			else if(strlen(var[1]) == 2) num = value;
		}
		else if(type == 'eu')
		{
			value = number_format(value, 2);
	   		var = explode(".", (string)value);
			if(!isset(var[1])) num = value.".00";
			else if(strlen(var[1]) == 1) num = value."0";
			else if(strlen(var[1]) == 2) num = value;
		}

		if(noAbrv == false)
		{
			switch(currency)
			{
				case 'hrk':
				num = num.' kn';
				break;
				case 'eur':
				num = num.' &euro;';
				break;
				case 'gbp':
				num = '&pound; '.num;
				break;
				case 'usd':
				num = ' '.num;
				break;
			}
		}

		return num;
	}
*/

    /**
     * Static function providing curent datetime in Y-m-d H:i:s format
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @return string Date
     */
    datetimeNow()
    {
        return moment().format('YYYY-MM-DD HH:mm:ss');
    },

    /**
     * Get time zone difference
     */
    /*
    public static function getTimeZoneDiff()
    {
    	date_default_timezone_set('Europe/Zagreb');
    	end = strtotime(date("Y-m-d H:i:s"));
    	start = strtotime(gmdate("Y-m-d H:i:s"));
    	time = end - start;
    	date_default_timezone_set('UTC');
    	return time;
    }
    */

    /**
     * Static function for getting first wordCount words (defaults to 40)
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String text  Input string
     * @param String wordCount  Number of words to return (defaults to 40)
     * @return String Returns string
     */
    returnIntroDesc(text, wordCount)
    {
        if (typeof wordCount == 'undefined') wordCount = 40;
        text = text.replace(/<(?:.|\n)*?>/gm, '');
        var words = text.split(' ');
        var final = '';
        for (var n = 0; n < wordCount; n++)
        {
            if (typeof words[n] != 'undefined') final += ' ' + words[n];
        }
        return final.trim();
    },

    /**
     * Static function for replacing hidden html tags (injection)
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String text  Input string
     * @return String Returns string
     */
    returnNoHiddenTags(text)
    {
        return text.replace(/<(?:.|\n)*?>/gm, '');
        //TODO

        // return preg_replace({
        // // Remove invisible content
        // '@<head[^>]*?>.*?</head>@siu',
        // /*'@<style[^>]*?>.*?</style>@siu',*/
        // '@<script[^>]*?.*?</script>@siu',
        // //'@<object[^>]*?.*?</object>@siu',
        // //'@<embed[^>]*?.*?</embed>@siu',
        // '@<applet[^>]*?.*?</applet>@siu',
        // '@<noframes[^>]*?.*?</noframes>@siu',
        // '@<noscript[^>]*?.*?</noscript>@siu',
        // '@<noembed[^>]*?.*?</noembed>@siu',
        // // Add line breaks before and after blocks
        // '@</?((address)|(blockquote)|(center)|(del))@iu',
        // '@</?((div)|(h[1-9])|(ins)|(isindex)|(p)|(pre))@iu',
        // '@</?((dir)|(dl)|(dt)|(dd)|(li)|(menu)|(ol)|(ul))@iu',
        // '@</?((table)|(th)|(td)|(caption))@iu',
        // '@</?((form)|(button)|(fieldset)|(legend)|(input))@iu',
        // '@</?((label)|(select)|(optgroup)|(option)|(textarea))@iu',
        // '@</?((frameset)|(frame)|(iframe))@iu',
        // ),
        // {' ', ' ', ' ', ' ', ' ', ' ', "\n\0", "\n\0", "\n\0", "\n\0", "\n\0", "\n\0", "\n\0"), text);
    },

    /**
     * Static function for checking email validity
     *
     * Checks string validity and also domain existence
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String value  Input value
     * @return boolean Returns true if it matches
     */
    checkEmailAddress(email)
    {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    },

    /**
     * Static function for escaping html
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String value  Input value
     * @return string Returns escaped value
     */
    escapeHtml(value)
    {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return value.toString().replace(/[&<>"']/g, function(m)
        {
            return map[m];
        });
    },

    /**
     * Static function for escaping html
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String value  Input value
     * @return string Returns escaped value
     */
    unescapeHtml(value)
    {
        var map = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#039;': "'"
        };

        return value.toString().replace(/&.+;/g, function(match)
        {
            return map[match];
        });
    }
}