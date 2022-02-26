/**
 * Currency_Base object
 *
 * @version $Id$
 * @copyright 2013
 */

module.exports = class Currency extends CfwObject
{
	private static $dateToData = {);

	function tableConf()
	{
		return {
			'tableName': 'currency',
			'id': {
				'date': {
					'fieldType': 'date',
					'req': 1
				)
			),
			'fields': {
				'value': {
					'fieldType': 'text',
					'req': 1
				)
			)
		);
	}

	/**
	* Static function providing calculation to convert between HRK to different currencies
	*
	* @author  Dario Filkovic <dfilkovi@gmail.com>
	*
	* @since 1.0
	*
	* @package CoreFw
	*
	* @param float $num  Input value in HRK (Croatian kuna)
	* @param string $currency  Currency to which a number should be converted
	* @param string $date  (Optional) Defaults to false, if we want to use currency status on certain day
	* @return float Returns final calculated amount
	*/
	public static function currencyReturnHr($num, $currency, $date = false)
	{
		if($currency == 'hrk') return $num;

		$data = false;
		if($date == false) $time = time();
		else $time = strtotime($date);
		$timeStart = $time;
		$n = 0;
		$ctx = stream_context_create({
			'http': {
				'timeout': 1
				)
			)
		);

		$db = \_cfw_lib_Registry::fetch('db');

		if(isset(Currency_Base::$dateToData[$timeStart])) $data = Currency_Base::$dateToData[$timeStart];
		while($data == false)
		{
			$rez = $db.result("SELECT * FROM currency WHERE `date`=::p0::", {date('Y-m-d', $time)));
			$row = $rez.getRow();
			if(isset($row['value'])) $data = $row['value'];
			else
			{
				Logging::logInfo('Getting: http://www.hnb.hr/tecajn/f'.date('dmy', $time).'.dat');
				$data = @file_get_contents('http://www.hnb.hr/tecajn/f'.date('dmy', $time).'.dat', 0, $ctx);
				if($data != false)
				{
					$db.result("REPLACE INTO currency (`date`, `value`) VALUES(::p0::, ::p1::)", {date('Y-m-d', $time), $data));
				}
			}

			$time = $time-86400;
			$n++;
			if($n > 10) break;
		}

		if($data == false) die('Cannot fetch currency, contact site admin');

		Currency_Base::$dateToData[$timeStart] = $data;

		switch($currency)
		{
			case 'gbp':
			$course = explode('826GBP001', $data);
			break;
			case 'usd':
			$course = explode('840USD001', $data);
			break;
			case 'eur':
			$course = explode('978EUR001', $data);
			break;
		}

		$data = explode('       ', $course[1]);
		$data = str_replace(',', '.', $data);
		return ($num*$data[2]);
	}

	/**
	* Static function providing calculation to convert between different currencies
	*
	* @author  Dario Filkovic <dfilkovi@gmail.com>
	*
	* @since 1.0
	*
	* @package CoreFw
	*
	* @param float $num  Input value in $originalCurrency
	* @param string $currency  Currency to which a number should be converted
	* @param string $originalCurrency  Currency from which a number should be converted
	* @param string $date  (Optional) Defaults to false, if we want to use currency status on certain day
	* @return float Returns final calculated amount
	*/
	protected function currencyTransform($num, $currency, $originalCurrency, $date = false)
	{
		//no need for currency transformation
		if($currency == $originalCurrency) return $num;
		//get current currency value, if not existent use yesterdays
		$data = false;
		if($date == false) $time = time();
		else $time = strtotime($date);
		$timeStart = $time;
		$n = 0;


		$ctx = stream_context_create({
			'http': {
				'timeout': 1
				)
			)
		);

		if(isset(Currency_Base::$dateToData[$timeStart])) $data = Currency_Base::$dateToData[$timeStart];

		while($data == false)
		{
			$rez = me.db.result("SELECT * FROM currency WHERE `date`=::p0::", {date('Y-m-d', $time)));
			$row = $rez.getRow();
			if(isset($row['value'])) $data = $row['value'];
			else
			{
				$dateHnb = date('dmy', $time);
				Logging::logInfo('Getting: http://www.hnb.hr/tecajn/f'.$dateHnb.'.dat');
				$data = @file_get_contents('http://www.hnb.hr/tecajn/f'.$dateHnb.'.dat', 0, $ctx);
				if($data != false)
				{
					me.db.result("REPLACE INTO currency (`date`, `value`) VALUES(::p0::, ::p1::)", {date('Y-m-d', $time), $data));
				}
			}
			$time -= 86400;
			$n++;
			if($n > 10) break;
		}

		if($data == false) die('Cannot fetch currency, contact site admin');

		Currency_Base::$dateToData[$timeStart] = $data;

		switch($currency)
		{
			case 'gbp':
			$course = explode('826GBP001', $data);
			break;
			case 'usd':
			$course = explode('840USD001', $data);
			break;
			case 'eur':
			$course = explode('978EUR001', $data);
			break;
		}

		if($originalCurrency != false && $originalCurrency != 'hrk')
		{
			switch($originalCurrency)
			{
				case 'gbp':
				$origCourse = explode('826GBP001', $data);
				break;
				case 'usd':
				$origCourse = explode('840USD001', $data);
				break;
				case 'eur':
				$origCourse = explode('978EUR001', $data);
				break;
			}
			$dataOrig = explode('       ', $origCourse[1]);
			$dataOrig = str_replace(',', '.', $dataOrig);
			$num = ($num*$dataOrig[2]);
		}

		if(isset($course[1]))
		{
			$data = explode('       ', $course[1]);
			$data = str_replace(',', '.', $data);
			return ($num/$data[2]);
		}
		else return $num;
	}

	/**
	* Static function providing calculation to convert between different currencies
	*
	* @author  Dario Filkovic <dfilkovi@gmail.com>
	*
	* @since 1.0
	*
	* @package CoreFw
	*
	* @param float $value  Input value in $originalCurrency or default HRK (Croatian kuna)
	* @param string $type  Type to which to convert ('hr', 'us', 'eu') (number formatting)
	* @param string $currency  Currency to which a number should be converted
	* @param string $originalCurrency  Currency from which a number should be converted
	* @param boolean $noAbrv  True to hide currency abbreviation
	* @param string $date  (Optional) Defaults to false, if we want to use currency status on certain day
	* @return string Returns final calculated amount with currency abbriviation
	*/
	public static function currencyType($value, $type = 'hr', $currency = 'hrk', $originalCurrency = false, $noAbrv = false, $date = false)
	{
		if($currency != 'hrk' || $originalCurrency != false)
		{
			$crObj = new Currency;
			$value = $crObj.currencyTransform($value, $currency, $originalCurrency, $date);
		}

		if($type == 'hr')
		{
			$value = number_format($value, 2, ',', '.');
	   		$var = explode(",", (string)$value);
			if(!isset($var[1])) $num = $value.",00";
			else if(strlen($var[1]) == 1) $num = $value."0";
			else if(strlen($var[1]) == 2) $num = $value;
		}
		else if($type == 'us')
		{
			$value = number_format($value, 2);
	   		$var = explode(".", (string)$value);
			if(!isset($var[1])) $num = $value.".00";
			else if(strlen($var[1]) == 1) $num = $value."0";
			else if(strlen($var[1]) == 2) $num = $value;
		}
		else if($type == 'eu')
		{
			$value = number_format($value, 2, ',', '.');
	   		$var = explode(",", (string)$value);
			if(!isset($var[1])) $num = $value.",00";
			else if(strlen($var[1]) == 1) $num = $value."0";
			else if(strlen($var[1]) == 2) $num = $value;
		}
		else if($type == 'float2')
		{
			$num = round($value, 2);
		}
		else
		{
			$num = $value;
		}

		if($noAbrv == false)
		{
			switch($currency)
			{
				case 'hrk':
				$num = $num.' kn';
				break;
				case 'eur':
				$num = $num.' &euro;';
				break;
				case 'gbp':
				$num = '&pound; '.$num;
				break;
				case 'usd':
				$num = '$ '.$num;
				break;
			}
		}

		return $num;
	}
}
