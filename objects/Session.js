var GeneralHandling = require('../lib/GeneralHandling.js'),
	CfwObject = require('../lib/CfwObject.js'),
	moment = require('moment'),
	crypto = require('crypto'),
	md5 = require('md5');

/**
 * Session object
 *
 * @version Id
 * @copyright 2008
 */

module.exports = class Session extends CfwObject
{
	constructor(session, req, res, callback)
	{
		var proxy = super(session);

		var me = this;

		me.preventLogging = true;

		me.groupId = 2;
		me.username;
		me.userId;
		me.companyId;
		me.langId = '1';
		me.req = req;
		me.res = res;

		if(typeof me.req == 'undefined' && typeof me.session != 'undefined') me.req = me.session.req;
		if(typeof me.res == 'undefined' && typeof me.session != 'undefined') me.res = me.session.res;

		return proxy;
	}

	tableConf()
	{
		return {
			'tableName': 'session',
			'id': {
				'sessionId': {
					'fieldType': 'text',
					'maxlength': 255,
					'req': 1
				}
			},
			'fields': {
				'userId': {
					'fieldType': 'int',
					'maxlength': 20,
					'req': 1
				},
				'companyId': {
					'fieldType': 'int',
					'maxlength': 20,
					'req': 0
				},
				'expireTime': {
					'fieldType': 'dateTime',
					'req': 1
				},
				'groupId': {
					'fieldType': 'int',
					'maxlength': 2,
					'minlength': 1,
					'req': 0
				},
				'langId': {
					'fieldType': 'int',
					'maxlength': 3,
					'minlength': 1,
					'req': 0
				}
			}
		};
	}

	async end()
	{
		var me = this;
		try 
		{
			me.log.end();
		} 
		catch(err)
		{
			throw(err)
		}
	}

	/**
	 * Checks if cookie is set and deletes expired cookies
	 *
	 */
	async initialize(lang)
	{
		var me = this,
			langId = false;

		try
		{
			me.log = new me.lib.LoggingClass(me);

			if(typeof lang != 'undefined' && lang !== false)
			{
				if(typeof me.lang.langDefs[lang] != 'undefined')
				{
					langId = me.lang.langDefs[lang];
					me.langId = langId;
				}
			}

			if(typeof me.req != 'undefined')
			{
				if(typeof me.req.cookies[me.config.cookieName] != 'undefined')
				{
					me.sessionId = me.req.cookies[me.config.cookieName];
					var val = await me.selectCookie();
					if(moment(val.expireTime) < moment())
					{
						throw('expired cookie')
					}
					else if(val.username == 'unregistered')
					{
						me.groupId = 2;
						me.langId = (langId !== false) ? langId : val.langId;
						return {error: false, notice: me.translate('SUCCESS')}
					}
					else
					{
						me.groupId = val.groupId;
						me.setLog();
						me.username = val.username;
						me.userId = val.userId;
						me.companyId = val.companyId;
						me.langId = (langId !== false) ? langId : val.langId;
						return {error: false, notice: me.translate('SUCCESS')}
					}
				}
				else
				{
					throw('no cookie');
				}
			}
			else
			{
				return {error: false, notice: me.translate('SUCCESS')}
			}
		}
		catch(e)
		{
			try 
			{
				me.res.clearCookie(me.config.cookieName);
				await me.setLoggedOutCookie();
				return {error: false, notice: me.translate('SUCCESS')}
			} 
			catch(err)
			{
				throw(err);
			}
		}
	}

	/**
	 * Change language
	 *
	 */
	async changeLang(param)
	{
		var me = this;
		try
		{
			await me.db.query('UPDATE `session` SET `langId`=? WHERE sessionId=?', [param['langId'], me.req.cookies[me.config.cookieName]]);
			me.langId = param['langId'];
			return {error: false};
		}
		catch(e)
		{
			throw(e);
		}
	}

	setLog()
	{
		//if(me.groupId == 1) \_cfw_lib_Registry::fetch('config').consoleLog = true;
	}

	/**
	 * Logs out
	 *
	 */
	async logOut()
	{
		var me = this;
		try
		{
			if(typeof me.req.cookies[me.config.cookieName] != 'undefined')
			{
				me.db.query("DELETE FROM `session` WHERE `sessionId`=?", me.req.cookies[me.config.cookieName]);

				me.res.clearCookie(me.config.cookieName);
				delete(me.groupId);
				delete(me.username);
				delete(me.userId);
				delete(me.companyId);
				await me.setLoggedOutCookie();
				return {error: false, notice: me.translate('SUCCESS')};
			}
			else throw({error: true, notice: me.translate('LOGOUTFAILURE')});
		}
		catch(e)
		{
			throw(e);
		}
	}

	async setLoggedOutCookie()
	{
		var me = this;
		try
		{
			var date = moment().add(me.config.cookieLenght, 'milliseconds');
			me.username = 'unregistered';
			me.sessionId = md5(Math.random()+' '+(new Date().getTime()));
			me.groupId = 2;
			me.userId = 0;
			me.companyId = 0;
			me.expireTime = date.format('YYYY-MM-DD HH:mm:ss');
			me.res.cookie(me.config.cookieName, me.sessionId, { maxAge: date.valueOf(), httpOnly: false });
			await me.insert()
			return me.sessionId;
		}
		catch(e)
		{
			throw({error: true, notice: me.translate('LOGGEDOUTCOOKIEFAILURE')});
		}
	}


	/**
	 * Selects session based on cookie
	 *
	 */
	async selectCookie()
	{
		var me = this;
		try
		{
			var results = await me.db.query("SELECT s.expireTime, u.username, s.groupId, s.langId, tl.langCode, u.userId, u.companyId FROM `session` s LEFT JOIN `users` u ON s.userId = u.userId LEFT JOIN trans_lang tl ON tl.langId=s.langId WHERE s.sessionId=?", [me.sessionId]);
			return results[0];
		}
		catch(e)
		{
			throw(e);
		}
	}

	async getHashedPassword(password)
	{
		var me = this;
		try
		{
			var pass = '';
			if(typeof me.config.salt != 'undefined') pass = md5(password+me.config.salt);
			else pass = md5(password);
			return pass;
		}
		catch(err)
		{
			throw(err);
		}
	}

	/**
	 * Logges user in, setting cookie and inserting into database, also deletes any existing session in database
	 *
	 */
	async loginUser(param)
	{
		var me = this;
		try
		{
			var username = param['username'];
			var password = param['password'];
			var expiredate = moment().add(me.config.cookieLenght, 'milliseconds');
			var results = await me.db.query("SELECT * FROM `users` WHERE `username`=? AND `status`='active'", [username]);
			if(typeof results[0] != 'undefined')
			{
				var rez = results[0];
				
				var pass = await me.getHashedPassword(password);

				if(rez.password == pass)
				{
					if(me.req.cookies != undefined && me.req.cookies[me.config.cookieName] != undefined) me.db.query('DELETE FROM `session` WHERE `sessionId`=?', [me.req.cookies[me.config.cookieName]]);
					me.username = rez.username;
					me.userId = rez.userId;
					me.companyId = rez.companyId;
					var sessionId = md5(rez.username+(new Date().getTime())+crypto.randomBytes(5));
					me.id = {sessionId: sessionId};
					me.groupId = rez.groupId;
					me.expireTime = expiredate.format('YYYY-MM-DD HH:mm:ss');
					me.res.cookie(me.config.cookieName, sessionId, { maxAge: expiredate.valueOf(), httpOnly: false });

					await me.insert();
					return {error: false, notice: me.translate('YOUARELOGGEDIN'), data: {sessionId: me.sessionId, userId: me.userId, companyId: me.companyId, groupId: me.groupId, expireTime: me.expireTime, username: me.username}}
				}
				else
				{
					throw({error: true, notice: me.translate('WRONGUSERNAMEORPASSWORD')})
				}
			}
			else
			{
				throw({error: true, notice: me.translate('WRONGUSERNAMEORPASSWORD')})
			}
		}
		catch(e)
		{
			throw(e);
		}
	}

	/**
	 * Logges user in, setting cookie and inserting into database, also deletes any existing session in database
	 *
	 */
	 /*
	adminLogginUser(param)
	{
		username = param['username'];
		expiredate = strftime('%Y-%m-%d %H:%M:%S', strtotime('now') + config.cookielength);
		cookielength = time() + config.cookielength;
		q = me.db.result("SELECT * FROM `users` WHERE `username`=::p0:: AND `status`='active'", {username));
		rez = q.getRow();
		if(!isset(rez['username'])) return {'error' =>true, 'notice': me.translate('USERNOTFOUND'));
		me.username = rez['username'];
		me.userId = rez['userId'];
		me.companyId = rez['companyId'];
		me.sessionId = md5(rez['username'].time().openssl_random_pseudo_bytes(5));
		me.groupId = rez['groupId'];
		me.expireTime = expiredate;
		me.langId = me.lang.lang;
		setcookie(config.cookieName, '', time() - 3600, '/', config.cookieDomain, false, true);
		setcookie(config.cookieName, me.sessionId, cookielength, '/', config.cookieDomain, false, true);
		qd = me.db.result('DELETE FROM `session` WHERE `userId`=::p0::', {me.userId));
		me.functionNameGlob = false;
		me.insert();
		error['notice'] = me.translate('LOGGEDINAS').' '.me.username;
		return error;
	}
	*/
}
