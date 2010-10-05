<?php 

require_once( 'class.db.php' );

if ($fp=fopen("php://stdin","r")) {
	global $sensors;
	
	# get the sensors from db
	$sensors_query = $db->query( "SELECT * FROM measure_sensors" );
	while( $dat = $db->fetch_row( $sensors_query ) ){
		$sensors[$dat[0]] = array();
		$sensors[$dat[0]]['tmpr_last'] = $sensors[$dat[0]]['watt_last'] = '0';
	}
	

	while (!feof($fp)) {
		$line = fgets($fp, 4096);
		$watts = preg_replace( '/.+<watts>(\d+)<\/.*/ism', "$1", $line );
		$tmpr = preg_replace( '/.+<tmpr>(\d+).(\d+)<\/.*/ism', "$1.$2", $line );
		$sensor = preg_replace( '/.+<sensor>(\d+)<\/.*/ism', "$1", $line );
		
	if( preg_match( '/hist/', $line ) ){
			preg_match( '/<data>.+<(\w)\d+>/Uism', $line, $unit );
			preg_match_all( '/<sensor>(\d+)<\/sensor>(.+)<\/data>/Uism', $line, $data );
		
			foreach( $data[1] as $k=>$v ){
				if( array_key_exists( $k, $sensors ) ){
					preg_match_all( '/<\w(.+)>(.+)<\/.+>/Uism', $data[2][$k], $datasets );
					foreach( $datasets[1] as $kd=>$vd ){
						$kwatts = $datasets[2][$kd];
						if( preg_match( '/(d|h)/', $unit[1] ) && is_numeric( $kwatts ) && is_numeric( $k ) && is_numeric( $vd ) ){
							history_update( $kwatts, $k, $unit[1], $vd );
						}else{
							`$line."\n" >> /tmp/measureit.log.txt`;
						}
					}
				}
			}
		}elseif( is_numeric( $watts.$sensor.$tmpr ) && array_key_exists( $sensor, $sensors ) ){
			$tmpr = preg_replace( '/\.0/', '', $tmpr );
			$sensors[$sensor]['tmpr'] = $tmpr;
			$sensors[$sensor]['watts'] = $watts;
			data_update( $tmpr, $sensor, 'tmpr_last', 'measure_tmpr' );
			data_update( $watts, $sensor, 'watt_last', 'measure_watt' );
		}
		#print $line."\n";
		
	}die('ups');

}

function data_update( $data, $sensor, $type, $table ){
	global $sensors;
	# store only when data has changed
	if( $sensors[$sensor][$type] != $data ){
		$sensors[$sensor][$type] = $data;
		$db = new mydb;
		@$db->query( "INSERT INTO $table ( sensor, data, time ) VALUES ( $sensor, $data, NOW( ) )" );
		$hour = date('H');
		$tmpr = $type == 'tmpr_last' ? $db->query( "INSERT IGNORE INTO measure_tmpr_hourly ( sensor, data, time, hour ) VALUES ( $sensor, $data, NOW( ), $hour )" ) : '';
	}
	return true;
}

function history_update( $data, $sensor, $unit, $unit_value ){
		$db = new mydb;
		if( $unit == 'h' ){
				$table = 'measure_watt_hourly';
				$unit = 'HOUR';
				$hour_query = $db->query( "SELECT NOW( ) - INTERVAL $unit_value $unit" );
				$hour = $db->fetch_row( $hour_query );
				$hour = substr( $hour[0], 11, 2 );
				$db->query( "INSERT IGNORE INTO $table ( sensor, data, hour, time ) VALUES ( $sensor, $data, $hour, NOW( ) - INTERVAL $unit_value $unit )" );
		}elseif( $unit == 'd' ){
				$table = 'measure_watt_daily';
				$unit = 'DAY';
				$db->query( "INSERT IGNORE INTO $table ( sensor, data, time ) VALUES ( $sensor, $data, NOW( ) - INTERVAL $unit_value $unit )" );
		}elseif( $unit == 'm' ){
				$table = 'measure_watt_monthly';
				$unit = 'MONTH';
		}
		return true;
}

?>