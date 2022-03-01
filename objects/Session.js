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
}
