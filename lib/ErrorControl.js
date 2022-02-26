/**
 * module.exports = class providing methods for form validation error handling and MySQL error code manipulation
 *
 * @author  Dario Filkovic <dfilkovi@gmail.com>
 *
 * @since 1.0
 *
 * @package CoreFw
 */
module.exports = class ErrorControl
{
    /**
     * Load Language in constructor
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @return void
     */
    constructor(session)
    {
        var me = this;

        /**
         * Holding language object
         * @type Language
         */
        me.session = session;

        me.config = lib.config;
    }

    /**
     * Return translator string based on field name and error type, once an error is found in Object insertion or update method, this will be fired and returned to user
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String field Field name
     * @param String value String containing error value
     * @return String
     */
    error(field, value)
    {
        var me = this;
        switch (value)
        {
            case 'minlength':
                return me.session.translate(field.toUpperCase() + 'TOOSHORT');
                break;
            case 'maxlength':
                return me.session.translate(field.toUpperCase() + 'TOOLONG');
                break;
            case 'maxvalue':
                return me.session.translate(field.toUpperCase() + 'EXCEEDSVALUE');
                break;
            case 'minvalue':
                return me.session.translate(field.toUpperCase() + 'DECEEDSVALUE');
                break;
            case 'type':
                return me.session.translate(field.toUpperCase() + 'WRONGDATATYPE');
                break;
            case 'req':
                return me.session.translate(field.toUpperCase() + 'ISREQUIRED');
                break;
            case 'unique':
                return me.session.translate(field.toUpperCase() + 'ALLREADYINDATABASE');
                break;
            default:
                return "No default value".value;
        } // switch
    }

    /**
     * Parse table name from error string
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String error Error string
     * @return String Table name
     */
    returnTableName(error)
    {
        var tableName = error.split('`.`');
        tableName = tableName[1].split('`');
        return tableName[0].toUpperCase();
    }

    /**
     * Parse table reference for foreign key error from error string
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param String error Error string
     * @return String Table name
     */
    returnReference(error)
    {
        var tableName = error.split('REFERENCES `');
        tableName = tableName[1].split('`');
        return tableName[0].toUpperCase();
    }

    /**
     * Get error type from MySQL error code
     *
     * @author  Dario Filkovic <dfilkovi@gmail.com>
     *
     * @since 1.0
     *
     * @package CoreFw
     *
     * @param int errorCode Error string
     * @param String error Error string
     * @return String Error notice
     */
    sqlError(errorCode, error)
    {
        var me = this;
        switch (errorCode)
        {
            case 'ER_TABLEACCESS_DENIED_ERROR':
                return {
                    error: true,
                    notice: me.session.translate('NOPRIVILAGE')
                };
                break;
            case 'ER_ROW_IS_REFERENCED_2':
                return {
                    error: true,
                    notice: me.session.translate('CANNOTDELETEVALUEEXISTSIN' + me.returnTableName(error))
                };
                break;
            case 'ER_NO_REFERENCED_ROW_2':
                return {
                    error: true,
                    notice: me.session.translate('NOVALUEEXISTSIN' + me.returnReference(error))
                };
                break;
            case 'ER_DUP_ENTRY':
                var string = error.split(' for key ');
                var errors = {};
                errors[string[1].trim().replace(/\'/g, '')] = me.session.translate('PRIMARYKEYALLREADYEXISTINDATABASE');
                return {
                    error: true,
                    fieldErrors: errors
                };
                break;
            case 'ER_LOCK_DEADLOCK':
                return {
                    error: true,
                    notice: me.session.translate('DEADLOCKEXCEPTION')
                };
                break;
            default:
                return {
                    error: true,
                    notice: me.session.translate('UNKNOWNSQLERROR') + ': ' + errorCode
                };
        }
    }
}