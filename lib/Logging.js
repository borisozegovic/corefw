var CorefwLogging = require('./CorefwLogging.js'),
		LogActions = require('../objects/LogActions.js'),
		LogErrors = require('../objects/LogErrors.js');
/**
 * Logging classes file
 *
 * @package CoreFw
 */

/**
  * Logging class, extends ChromePhp to add logging to browser console, handles all error loging
  *
  * Custom exception for errors from logging (library php custom error handlers if enabled in config)
  *
  * @author  Dario Filkovic <dfilkovi@gmail.com>
  *
  * @since 1.0
  *
  * @package CoreFw
  */
module.exports = class Logging extends CorefwLogging
{
	constructor(session)
	{
		var proxy = super(session);
		var me = this;

		/**
		* Log is active
		* @type boolean
		*/
		me.active = true;

		/**
		* Number of total queries in a single request
		* @type int
		*/
		me.numQueries = 0;
		/**
		* Not known
		* @type Array
		* @todo Check if it is used
		*/
		me.data = [];
		/**
		* Total query time in ms
		* @type int
		*/

		me.queryTime = 0;
		/**
		* Not known
		* @type boolean
		* @todo Check if it is used
		*/
		me.displayUnknown = false;

		/**
		* Has in memory all logs
		* @type mixed[]
		*/
		me.logInfoData = [];
		return proxy;
	}

	/**
	* logData()
	*
	* Log data to database
	*
	* @author  Dario Filkovic <dfilkovi@gmail.com>
	*
	* @since 1.1
	*
	* @package CoreFw
	*
	*
	* @param String $module.exports = class module.exports = class that was called
	* @param String $method Method that was called
	* @param mixed[] $inParams Array of data that was given to the method
	* @param mixed[] $response Array of data that is response of the method
	* @param String $action Action
	* @return void
	*/
	logData(name, params)
	{
		var me = this;
		var logActions = new LogActions(me.session);
		logActions.name = name;
		logActions.params = JSON.stringify(params);
		logActions.userId = (me.session.userId == 0) ? null : me.session.userId;
		logActions.insert().catch(function(err)
		{
			console.log(err)
		});
	}

	/**
	* logError()
	*
	* Log error to console log (firebug)
	*
	* @author  Dario Filkovic <dfilkovi@gmail.com>
	*
	* @since 1.0
	*
	* @package CoreFw
	*
	* @param mixed[] $data Function call trace
	* @param String $error Query string
	* @return void
	*/
	logError(error, data)
	{
		var me = this;
		var logErrors = new LogErrors(me.session);
		logErrors.error = error;
		logErrors.data = JSON.stringify(data);
		logErrors.insert();

		if(typeof me.session.config.consoleLog != 'undefined' && me.session.config.consoleLog == true)
		{
			me.error(error+': '+JSON.stringify(data));
		}
	}

	/**
	* logInfo()
	*
	* Log custom user info
	*
	* @author  Dario Filkovic <dfilkovi@gmail.com>
	*
	* @since 1.0
	*
	* @package CoreFw
	*
	* @param String $info Info to show in console log
	* @return void
	*/
	logInfo(info)
	{
		var me = this;
		if(typeof me.config.logToMemory == 'undefined' && me.config.logToMemory == true)
		{
			me.logInfoData.push(info);
		}
		me.info(info);
	}

	/**
	* logWindow()
	*
	* Log page load statistics to console log
	*
	* @author  Dario Filkovic <dfilkovi@gmail.com>
	*
	* @since 1.0
	*
	* @package CoreFw
	*
	* @param int $scriptStart Start time in ms
	* @param int $headerStart Header start time in ms
	* @param int $loadTemplatesStart Load template start time in ms
	* @param int $getDataStart Get data start time in ms
	* @param int $createStart Create start time in ms
	* @param int $printStart Print start time in ms
	* @param int $scriptEnd End time in ms
	* @return void
	*/
	/*
	public function logWindow($scriptStart, $headerStart, $loadTemplatesStart, $getDataStart, $createStart, $printStart, $scriptEnd)
	{
		if(Registry::fetch('config').consoleLog == true)
		{
			$phpTime = (round($scriptEnd-$scriptStart, 5))-(round(Logging::$queryTime, 5));
			$phpTimeSec = (round($scriptEnd-$scriptStart, 5))-(round(Logging::$queryTime, 5));

			self::logInfo('Php Time: '.round($phpTime, 4).'s Query Time: '.round(Logging::$queryTime, 4).'s Query number: '.Logging::$numQueries);
		}
	}
	*/

	/**
	* deactivate()
	*
	* Deactivate logging
	*
	* @author  Dario Filkovic <dfilkovi@gmail.com>
	*
	* @since 1.0
	*
	* @package CoreFw
	*
	* @return void
	*/
	deactivate()
	{
		var me = this;
		me.active = false;
	}

	/**
	* activate()
	*
	* Activate logging
	*
	* @author  Dario Filkovic <dfilkovi@gmail.com>
	*
	* @since 1.0
	*
	* @package CoreFw
	*
	* @return void
	*/
	activate()
	{
		var me = this;
		me.active = true;
	}
}
