var ErrorControl = require('./ErrorControl.js'),
    GeneralHandling = require('./GeneralHandling.js');

/**
 * module.exports = class providing functions for object validation
 *
 * @author  Dario Filkovic <dfilkovi@gmail.com>
 *
 * @since 1.0
 *
 * @package CoreFw
 */
module.exports = class Validator
{
    /**
     * Constructor
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     * @param Array update
     */
    constructor(update)
    {
        var me = this;

        /**
         * Update values
         * @type Object|boolean
         */
        me.update = update;

        /**
         * Result messages
         * @type Array
         */

        me.result = {};
        /**
         * ErrorControl object
         * @type ErrorControl
         */
        me.error;
    }

    /**
     * Check values against their object definition
     *
     * @see Object
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     * @param Array values Values to check
     * @param nameValues Table definition
     * @param String key Value key
     * @param Array field Field definition
     * @return Array Validation array
     */
    checkValues(values, nameValues, key, field)
    {
        var me = this;
        if (typeof nameValues == 'undefined') nameValues = false;
        var maxlength = true,
            maxvalue = true,
            minlength = true,
            minvalue = true,
            type = true,
            required = true,
            minValue = true;

        if (typeof field['maxlength'] != 'undefined' && typeof values[key] != 'undefined' && values[key] !== '' && values[key] !== null) maxlength = me.checkMaxlength(values[key], field['maxlength'], field['fieldType']);
        if (typeof field['maxlength'] != 'undefined' && typeof values[key] != 'undefined' && values[key] !== '' && values[key] !== null) maxlength = me.checkMaxlength(values[key], field['maxlength'], field['fieldType']);
        if (typeof field['maxvalue'] != 'undefined' && typeof values[key] != 'undefined' && values[key] !== '' && values[key] !== null) maxvalue = me.checkMaxValue(values[key], field['maxvalue']);
        if (typeof field['minlength'] != 'undefined' && typeof values[key] != 'undefined' && values[key] !== '' && values[key] !== null) minlength = me.checkMinlength(values[key], field['minlength'], field['fieldType']);
        if (typeof field['minlength'] != 'undefined' && typeof values[key] != 'undefined' && values[key] !== '' && values[key] !== null) minlength = me.checkMinlength(values[key], field['minlength'], field['fieldType']);
        if (typeof field['minvalue'] != 'undefined' && typeof values[key] != 'undefined' && values[key] !== '' && values[key] !== null) minvalue = me.checkMinValue(values[key], field['minvalue']);
        if (typeof field['fieldType'] != 'undefined' && typeof values[key] != 'undefined' && values[key] !== '' && values[key] !== null) type = me.checkType(values[key], field['fieldType']);
        if (typeof field['req'] != 'undefined' && field['req'] == 1)
        {
            if (typeof values[key] == 'undefined' || values[key] === '' || values[key] == null)
            {
                required = false;
            }
        }

        return {
            'field': key,
            'maxlength': maxlength,
            'maxvalue': maxvalue,
            'minlength': minlength,
            'minvalue': minvalue,
            'type': type,
            'req': required,
            'minValue': minValue
        };
    }

    /**
     * Validate fields
     *
     * @see Object
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     * @param Array values Values to check
     * @param instance Pointer to object instance
     * @return Array Array of 'error' boolean and 'notice' messages or only 'error' boolean if no error
     */
    validate(values, instance)
    {
        var me = this,
            result = [];

        me.error = new ErrorControl(instance.session);

        var nameValues = instance.tableConf();
        for (var key in nameValues['fields'])
        {
            var field = nameValues['fields'][key];
            if (typeof values[key] != 'undefined' && typeof values[key] == 'object' && values[key] !== null) continue;
            result.push(me.checkValues(values, nameValues, key, field));
        }

        for (var key in nameValues['id'])
        {
            var field = nameValues['id'][key];
            if (typeof values[key] != 'undefined' && typeof values[key] == 'object' && values[key] !== null) continue;
            result.push(me.checkValues(values, nameValues, key, field));
        }

        var resultOut = {
            'error':
            {}
        };
        for (var field in result)
        {
            var value = result[field];
            for (var key in value)
            {
                var second = value[key];
                if (second == false)
                {
                    resultOut['error']['error'] = true;
                    if (typeof resultOut['error']['fieldErrors'] == 'undefined') resultOut['error']['fieldErrors'] = {};
                    resultOut['error']['fieldErrors'][result[field]['field']] = me.error.error(result[field]['field'], key);
                }
            }
        }

        if (typeof resultOut['error'] != 'undefined') return resultOut['error'];

        resultOut['error']['error'] = false;
        return resultOut['error'];
    }

    /**
     * Check max length
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     * @param String value
     * @param int maxValue
     * @param String fieldType
     * @return boolean
     */
    checkMaxlength(value, maxValue, fieldType)
    {
        if (fieldType == 'float') value = value.toString().replace('.', '');
        if (value.length > maxValue) return false;
        return true;
    }

    /**
     * Check max value
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     * @param String value
     * @param int maxValue
     * @return boolean
     */
    checkMaxValue(value, maxValue)
    {
        if (parseInt(value) > maxValue) return false;
        return true;
    }

    /**
     * Check min length
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     * @param String value
     * @param int minValue
     * @param String fieldType
     * @return boolean
     */
    checkMinlength(value, minValue, fieldType)
    {
        if (fieldType == 'float') value = value.toString().replace('.', '');
        if (value.length < minValue) return false;
        return true;
    }

    /**
     * Check min value
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     * @param String value
     * @param int minValue
     * @return boolean
     */
    checkMinValue(value, minValue)
    {
        if (parseInt(value) < minValue) return false;
        return true;
    }

    /**
     * Check field type
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     * @param String value
     * @param String type
     * @return boolean
     */
    checkType(value, type)
    {
        var me = this,
            res = false;

        switch (type)
        {
            case 'email':
                res = me.checkEmailAddress(value);
                break;
            case 'text':
                res = true;
                break;
            case 'string':
                res = true;
                break;
            case 'blob':
                res = true;
                break;
            case 'sc':
                res = me.checkSpecChar(value);
                break;
            case 'int':
                res = me.checkInt(value);
                break;
            case 'num':
                res = me.checkNum(value);
                break;
            case 'float':
                res = me.checkInt(value);
                break;
            case 'dateTime':
                res = me.checkDateTime(value);
                break;
            case 'date':
                res = me.checkDate(value);
                break;
            case 'time':
                res = me.checkTime(value);
                break;
            case 'file':
                res = me.checkFileName(value);
                break;
            case 'pathFile':
                res = me.checkPathFileName(value);
                break;
            case 'oib':
                res = me.checkOib(value);
                break;
        }
        return res;
    }


    /**
     * Check email
     * @param String email
     * @return boolean
     */
    checkEmailAddress(email)
    {
        return GeneralHandling.checkEmailAddress(email);
    }

    /**
     * Check for valid filename
     * @param String value
     * @return boolean
     */
    checkFileName(value)
    {
        var re = new RegExp('[^\\/]+\.[^\\/]+$');
        return !re.test(email);
    }

    /**
     * Check for valid path and filename
     * @param String value
     * @return boolean
     */
    checkPathFileName(value)
    {
        var re = new RegExp('%^[a-z0-9_\-|/]+\.[a-z0-9]+%i');
        return !re.test(value);
    }


    /**
     * Check for special character (username, password)
     * @param String value
     * @return boolean
     */
    checkSpecChar(value)
    {
        var re = new RegExp('^[a-z0-9_@]+');
        return !re.test(value);
    }

    /**
     * Check if it is a int value
     * @param String value
     * @return boolean
     */
    checkInt(value)
    {
        if (!GeneralHandling.is_numeric(value)) return false;
        return true;
    }

    /**
     * Check if it is a num value but to post as string (leading zero)
     * @param String value
     * @return boolean
     */
    checkNum(value)
    {
        if (!GeneralHandling.is_numeric(value)) return false;
        return true;
    }


    /**
     * Check for if it is an required field
     * @param String value
     * @return boolean
     */
    checkReq(value)
    {
        if (typeof value == 'undefined' || value == '') return false;
        return true;
    }

    /**
     * Check if it is a date time
     * @param String dateTime
     * @return boolean
     */
    checkDateTime(dateTime)
    {
        var re = new RegExp("^([0-2][0-9]{3})\-(0[1-9]|1[0-2])\-([0-2][0-9]|3[0-1]) ([0-1][0-9]|2[0-3]):([0-5][0-9])\:([0-5][0-9])(\.[0-9][0-9][0-9])?$");
        return re.test(dateTime);
    }

    /**
     * Check if it is a date
     * @param String date
     * @return boolean
     */
    checkDate(date)
    {
        var re = new RegExp("^([0-2][0-9]{3})\-(0[1-9]|1[0-2])\-([0-2][0-9]|3[0-1])?$");
        return re.test(date);
    }

    /**
     * Check if it is a time
     * @param String time
     * @return boolean
     */
    checkTime(time)
    {
        var re = new RegExp("^([0-1][0-9]|2[0-3]):([0-5][0-9])\:([0-5][0-9])( ([\-\+]([0-1][0-9])\:00))?$");
        return re.test(time);
    }

    /**
     * Check if it is an OIB (croatian identification number)
     * @param String oib
     * @return boolean
     */
    checkOib(oib)
    {
        if (oib.length == 11)
        {
            if (GeneralHandling.is_numeric(oib))
            {
                var a = 10;
                for (var i = 0; i < 10; i++)
                {
                    a = a + parseInt(oib.substr(i, 1), 10);
                    a = a % 10;
                    if (a == 0) a = 10;
                    a *= 2;
                    a = a % 11;
                }
                var kontrolni = 11 - a;
                if (kontrolni == 10) kontrolni = 0;
                return true;

            }
            else return false;
        }
        else return false;
    }
}