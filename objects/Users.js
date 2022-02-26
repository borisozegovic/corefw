var UsersData = require('./UsersData.js'),
	md5 = require('md5');
/**
 * user object
 *
 * @version $Id$
 * @copyright 2008
 */

module.exports = class Users extends CfwObject
{
	constructor(session)
	{
		var proxy = super(session);

		return proxy;
	}

	tableConf()
	{
		return {
			'tableName': 'users',
			'id': {
				'userId': {
					'fieldType': 'int',
					'maxlength': 20,
					'req': 0
				}
			},
			'ownerField': 'userId',
			'companyField': 'companyId',
			'fields': {
				'companyId': {
					'fieldType': 'int',
					'maxlength': 20,
					'req': 0
				},
				'username': {
					'fieldType': 'text',
					'maxlength': 255,
					'minlength': 1,
					'req': 1
				},
				'password': {
					'fieldType': 'text',
					'maxlength': 255,
					'minlength': 5,
					'req': 1
				},
				'userEmail': {
					'fieldType': 'email',
					'maxlength': 255,
					'minlength': 5,
					'req': 1
				},
				'groupId': {
					'fieldType': 'int',
					'maxlength': 20,
					'minlength': 1,
					'req': 0
				},
				'dateEntered': {
					'fieldType': 'dateTime',
					'req': 1
				},
				'status': {
					'fieldType': 'text',
					'maxlength': 255,
					'req': 1
				}
			}
		};
	}

	async selectRow(param)
	{
		var me = this;
		try
		{
			var data = [];

			if(typeof param['sort'] != 'undefined') var sort = 'u.'+me.db.escape(param['sort']);
			else var sort = 'u.'+Object.keys(me.idField)[0];

			if(typeof param['dir'] != 'undefined') var dir = me.db.escape(param['dir']);
			else var dir = 'DESC';

			var limit = '';
			if(typeof param['start'] != 'undefined' && typeof param['limit'] != 'undefined')
			{
				var start = me.db.escape(parseInt(param['start']));
				var end = me.db.escape(parseInt(param['limit']));
				limit = ' LIMIT '+start+', '+end+' ';
			}

			var whereSearch = '';
			var params = {};
			if(typeof param['query'] != 'undefined' && param['query'] != '')
			{
				var searchString = [];
				for(var key in me.tableConfig['fields'])
				{
					var value = me.tableConfig['fields'][key];
					if(value['fieldType'] == 'date' || value['fieldType'] == 'dateTime') continue;
					searchString.push(' u.'+key+' LIKE :'+key+' ');
					params[key] = '%'+param['query']+'%';
				}
				if(searchString.length > 0)
				{
					whereSearch = ' AND ('+(searchString.join(' OR '))+') ';
				}
			}

			if(typeof param['conditions'] != 'undefined' && param['conditions'] != '')
			{
				for(var key in param['conditions'])
				{
					var value = me.db.escape(param['conditions'][key]);
					whereSearch += ' AND u.'+value+' = :'+value+' ';
					params[value] = param['bind'][key];
				}
			}

			if(typeof param['filter'] != 'undefined' && param['filter'] != '')
			{
				var filters = JSON.parse(param['filter']);
				for(var key in filters)
				{
					var value = filters[key];
					var keySec = me.db.escape(value['property']);
					whereSearch += ' AND u.'+keySec+' LIKE :'+keySec+' ';
					params[keySec] = '%'+value['value']+'%';
				}
			}

			var ownerWhere = '';
			if(me.ownerActionGlob == true)
			{
				ownerWhere = ' AND u.'+me.tableConfig['ownerField']+'=:sessionUserId ';
				params.sessionUserId = me.session.userId;
			}

			if(me.companyActionGlob == true)
			{
				ownerWhere += ' AND u.'+me.tableConfig['companyField']+'=:sessionCompanyId ';
				params.sessionCompanyId = me.session.companyId;
			}

			var results = await me[me.dbName].query("SELECT ud.*, u.*, uc.companyName FROM `"+me.tableName+"` u LEFT JOIN users_data ud ON ud.userId=u.userId LEFT JOIN user_companies uc ON uc.companyId=u.companyId WHERE 1=1 "+ownerWhere+" "+whereSearch+" ORDER BY "+sort+" "+dir+" "+limit, params)

			for(var result of results)
			{
				data.push(result);
			}

			if(typeof param['initialId'] != 'undefined')
			{
				data = await me.findInitialId(data, param['initialId']);
			}

			results = await me[me.dbName].query("SELECT COUNT(*) AS cnt FROM `"+me.tableName+"` u WHERE 1=1 "+ownerWhere+" "+whereSearch, params)

			var numRows = results[0].cnt;

			return {'root': data, 'totalCount': numRows};
		}
		catch(e)
		{
			throw(e);
		}
	}

	async insertRow(param)
	{
		var me = this;
		try
		{
			me.db = await me.db.begin(me.session);
			me.username = param.username;
			me.password = await me.session.getHashedPassword(param.password);
			me.userEmail = param.userEmail;
			me.dateEntered = GeneralHandling.datetimeNow();
			me.groupId = 2;
			me.status = 'active';
			me.userId = false;
			var val = await me.insert();

			param.id = {userId: val.lastId};
			var userData = new UsersData(me.session);
			userData.db = me.db;
			await userData.insertRow(param);
			await me.db.commit();
			return {error: false, notice: me.translate('SUCCESS')}
		}
		catch(e)
		{
			me.db.rollback();
			throw(e);
		}
	}

	async updateRow(param)
	{
		var me = this;
		try
		{
			me.db = await me.db.begin(me.session);
			if(param.password != '')
			{
				param.password = await me.session.getHashedPassword(param.password);
			}
			else delete(param.password);

			for(var key in param)
			{
				me[key] = param[key];
			}
			await me.update();
			var userData = new UsersData(me.session);
			userData.id = param.id;
			try 
			{
				await userData.select();
				await userData.updateRow(param);
			} 
			catch(error)
			{
				var secParams = Object.assign({}, param);
				secParams.id = { userId: param.id };
				await userData.insertRow(secParams);
			}

			await me.db.commit();
			return {error: false, notice: me.translate('SUCCESS')}
		}
		catch(e)
		{
			me.db.rollback();
			throw(e);
		}
	}

	async registerUser(param)
	{
		var me = this;
		try
		{
			me.username = param.username;
			me.password = await me.session.getHashedPassword(param.password);
			me.userEmail = param.email;
			me.groupId = '2';
			me.dateEntered = GeneralHandling.datetimeNow();
			me.status = 'inactive';

			var userdata = new UsersData(me.session);
			userdata.name = param.name;
			userdata.surname = param.surname;
			userdata.address = param.address;
			userdata.city = param.city;
			userdata.postalCode = param.postalCode;
			userdata.phone = param.phone;
			userdata.countryId = param.countryId;

			me.db = await me.db.begin(me.session);

			var val = await me.insert();

			userdata.id = {'userId': val.lastId};
			await userdata.insert();

			var subject = me.config.siteName+" "+me.translate('USERACCOUNTACTIVATION');
			var mailTable = me.translate('USERACTIVATIONPREMAILTEXT')+'<br /><a href="'+me.config.siteUrl+'/register.html?activate='+me.password+'">'+me.config.siteUrl+'/register.html?activate='+me.password+'</a>';
			var message = "From: "+me.config.siteEmail+", Message: "+me.translate('USERACCOUNTACTIVATION')+"<br />"+mailTable;
			var headers = me.config.siteEmail;
			var mail = new MailMe;
			mail.sendMail(me.userEmail, subject, headers, me.config.siteName, message);

			me.db.commit();
			return val;
		}
		catch(e)
		{
			me.db = me.db.rollback();
			throw(err);
		}
	}

	async activateUser(pass)
	{
		var me = this;
		try
		{
			await me.db.query("UPDATE users SET `status`='active' WHERE password=?", [pass]);
			return {error: false, notice: me.translate('SUCCESS')}
		}
		catch(e)
		{
			throw(e);
		}
	}

	async editPassword(param)
	{
		var me = this;
		try 
		{
			me.password = await me.session.getHashedPassword(param.password);
			me.id = param.id;
			var val = await me.update();
			return val;
		}
		catch(error)
		{
			throw(error);
		}
	}

	async changePassword(param)
	{
		var me = this;
		try
		{
			var results = await me.db.query("SELECT * FROM users WHERE userId=?", [me.session.userId])

			var row = results[0];
			if(row.password != await me.session.getHashedPassword(param.password)) throw({'error': true, 'notice': me.translate("OLDPASSWORDINVALID")});

			if(param.password != param.password2) throw({'error': true, 'notice': me.translate("PASSWORDSDONOTMATCH")});

			me.password = await me.session.getHashedPassword(param.password);
			me.id = me.session.userId;
			var val = await me.update();
			return val;
		}
		catch(e)
		{
			throw(e);
		}
	}

	async resetPassword(param)
	{
		var me = this;
		try
		{
			if(md5(param.verify) != param.code) reject({'error': true, 'notice': me.translate('VERIFICATIONCODEENTEREDWRONG')});
			var results = await me.db.query("SELECT userId, userEmail FROM users WHERE userEmail=:query OR username=:query", {query: param.string})

			if(typeof results[0] != 'undefined')
			{
				var row = results[0];
				var subject = me.config.siteName+" "+me.translate('PASSWORDRESET');
				var mailTable = me.translate('PASSWORDRESETTEXT')+'<br /><a href="'+me.config.siteUrl+'/register-changepassword-'+md5(param.verify)+'/register.html">'+me.config.siteUrl+'/register-changepassword-'+md5(param.verify)+'/register.html</a>';
				var message = "From: "+me.config.siteEmail+", Message: "+me.translate('PASSWORDRESET')+"<br />"+mailTable;
				var headers = me.config.siteEmail;
				var mail = new MailMe;
				await mail.sendMail(row.userEmail, subject, headers, me.config.siteName, message)

				var expireDate = moment().add(10800, 'seconds');

				await me.db.query("INSERT INTO reset_password (userId, verifyCode, expireDate) VALUES(:userId, :verifyCode, :expireDate) ON DUPLICATE KEY UPDATE verifyCode=:verifyCode, expireDate=:expireDate", {userId: row.userId, verifyCode: md5(param.verify), expireDate: expireDate.format('YYYY-MM-DD HH:mm:ss')});

				return {error: false, notice: me.translate('SUCCESS')}
			}
			throw({error: true, notice: me.translate('ACCOUNTNOTFOUND')})
		}
		catch(e)
		{
			throw(e);
		}
	}
}
