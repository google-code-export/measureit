<?php 

require_once( 'class.db.php' );

# in demo mode no sensor actions please
$demo = false;

if( isset( $_REQUEST['do'] ) ){
	switch( $_REQUEST['do'] ){
		case 'navigation_main':
			navigation_main();
		break;
		case 'summary_start':
			summary_start();
		break;
		case 'sensor_detail':
			sensor_detail( $_REQUEST );
		break;
		case 'summary_sensor':
			sensor_data_get( $_REQUEST );
		break;
		case 'sensor_detail_statistic':
			sensor_detail_statistic( $_REQUEST );
		break;
		case 'sensor_history_week':
			sensor_history_week( $_REQUEST );
		break;
		case 'sensor_history_year':
			sensor_history_year( $_REQUEST );
		break;
		case 'sensor_statistic_comparison':
			sensor_statistic_comparison( $_REQUEST );
		break;
		case 'sensor_statistic':
			sensor_statistic( $_REQUEST );
		break;
		case 'sensor_add':
			if($demo){ return true; }
			sensor_add( $_REQUEST );
		break;
		case 'sensor_delete':
			if($demo){ return true; }
			sensor_delete( $_REQUEST );
		break;
		case 'clamp_add':
			if($demo){ return true; }
			clamp_add( $_REQUEST );
		break;
		case 'sensor_position_add':
			if($demo){ return true; }
			sensor_position_add( $_REQUEST );
		break;
		case 'sensor_settings_save':
			if($demo){ return true; }
			sensor_settings_save( $_REQUEST );
		break;
		case 'sensor_position_delete':
			if($demo){ return true; }
			sensor_position_delete( $_REQUEST );
		break;
		case 'sensor_entry_delete':
			if($demo){ return true; }
			sensor_entry_delete( $_REQUEST );
		break;
		case 'backup_list_get':
			if($demo){ return true; }
			backup_list_get();
		break;
		case 'backup_create':
			if($demo){ return true; }
			backup_create();
		break;
		case 'backup_delete':
			if($demo){ return true; }
			backup_delete( $_REQUEST );
		break;
		case 'sensor_prices_get':
			sensor_prices_get( $_REQUEST );
		break;
		case 'sensor_prices_set':
			if($demo){ return true; }
			sensor_prices_set( $_REQUEST );
		break;
		case 'sensor_price_delete':
			if($demo){ return true; }
			sensor_price_delete( $_REQUEST );
		break;
		case 'sensor_prices_delete':
			if($demo){ return true; }
			sensor_prices_delete( $_REQUEST );
		break;
		case 'sensor_price_add':
			if($demo){ return true; }
			sensor_price_add( $_REQUEST );
		break;
		case 'global_settings_get':
			if($demo){ return true; }
			global_settings_get( );
		break;
		case 'global_settings_set':
			if($demo){ return true; }
			global_settings_set( $_REQUEST );
		break;
		default:
			echo 'this is not a valid request';
		break;
	}
}

function navigation_main( ){
	$sensors = sensors_get();
	$r = array();
	foreach( $sensors as $k=>$v ){
		$r[$k]['sensor'] = $v;
		if( $clamps = sensor_clamps_get( $k ) ){
			$r[$k]['sensor']['clamps'] = $clamps;
		}
	}
	print json_encode($r);
	return true;
}

function sensor_detail( $params = array( ) ){
	if( is_numeric( $params['sensor'] ) ){
		$r['sensor'] = sensor_get( $params['sensor'] );
		$r['sensor']['clamps'] = sensor_clamps_get( $params['sensor'] );
		print json_encode($r);
	}
	return true;
}

function sensor_clamps_get( $sensor ){
	$sensors = sensors_get();
	$clamps = array();
	foreach( $sensors as $k => $v){
		for( $i=1; $i<4; $i++){
			if( $v['sensor_id'] == $i.$sensor ){
				$clamps[$v['sensor_id']] = $v['position_description'];
			}
		}
	}
	if( count( $clamps ) > 0 ){
		return $clamps;
	}
	return false;
}

function sensor_detail_statistic( $params = array( ) ){
	if( is_numeric( $params['sensor'] ) ){
		$params['timeframe'] = 'static';
		$params['table'] = 'measure_watt_daily';
		$params['unit_value'] = '1';
		$params['unit'] = 'YEAR';
		$q = data_query_build( $params );
		$db = new mydb;
		$query = $db->query( $q );
		while( $d = $db->fetch_array( $query ) ){
			$r['yeardays'][@date( l, @strtotime( $d['time'].' 00:00' ) )] += $d['data'];
			$r['yearsdaysdetail'][@date( F, @strtotime( $d['time'].' 00:00' ) )][@date( l, @strtotime( $d['time'].' 00:00' ) )] += $d['data'];
			ksort($r['yearsdaysdetail'][@date( F, @strtotime( $d['time'].' 00:00' ) )]);
		}
		
		$params['table'] = 'measure_watt_hourly';
		$q = data_query_build( $params );
		$db = new mydb;
		$query = $db->query( $q );
		while( $d = $db->fetch_array( $query ) ){
			$r['yearhours'][$d['hour']] += $d['data'];
			ksort($r['yearhours']);
			$r['monthshoursdetail'][@date( F, @strtotime( $d['time'].' 00:00' ) )][$d['hour']] += $d['data'];
			ksort($r['monthshoursdetail'][@date( F, @strtotime( $d['time'].' 00:00' ) )]);
		}
		print json_encode($r);
		return true;
	}
	return true;
}

function summary_start( ){
	$sensors = sensors_get();
	foreach( $sensors as $k=>$v ){
		$p = end( $v['positions'] );
		$vn = sensor_values_now_get( $k );
		$r[$k]['sensor'] = $v;
		$r[$k]['tmpr'] = $vn['tmpr'];
		$r[$k]['watt'] = $vn['watt'];
		$r[$k]['daily'] = sensor_item_get( array( 'sensor'=> $k, 'table'=> 'measure_watt_daily', 'timeframe'=> 'last', 'limit' => $p['time']  ) );
		$r[$k]['hourly'] = sensor_item_get( array( 'sensor'=> $k, 'table'=> 'measure_watt_hourly', 'timeframe'=> 'last', 'order' => 'hour', 'limit' => $p['time']  ) );
		$r[$k]['weekly'] = price_sum( sensor_data_raw_get( array( 'sensor'=> $k, 'unit_value'=> 7, 'unit'=> 'day', 'table'=> 'measure_watt_daily', 'timeframe'=> 'limit-last' ) ) );
		$r[$k]['monthly'] = price_sum( sensor_data_raw_get( array( 'sensor'=> $k, 'unit_value'=> 30, 'unit'=> 'day', 'table'=> 'measure_watt_daily', 'timeframe'=> 'limit-last' ) ) );
	}
	print json_encode($r);
	return true;
}

function sensor_history_week( $params = array( ) ){
	$ret = '';
	$q = data_query_build( $params );
	$db = new mydb;
	$query = $db->query( $q );
	while( $d = $db->fetch_array( $query ) ){
		$r[$d['time']][$d['hour']]['data'] = $d['data'];
		ksort($r[$d['time']]);
	}
	print json_encode($r);
	return true;
}

function sensor_statistic_comparison( $params ){
	$params['table'] = 'measure_watt_monthly';
	$q = data_query_build( $params );
	$db = new mydb;
	$query = $db->query( $q );
	while( $d = $db->fetch_array( $query ) ){
		preg_match( '/(\d\d\d\d)-(\d\d)-(\d\d)/', $d['time'], $ret );
		$r[$ret[1]][$ret[2]]['data'] = $d['data'];
	}
	$params['table'] = 'measure_watt_daily';
	$q = data_query_build( $params );
	$query = $db->query( $q );
	while( $d = $db->fetch_array( $query ) ){
		preg_match( '/(\d\d\d\d)-(\d\d)-(\d\d)/', $d['time'], $ret );
		$r[$ret[1]][$ret[2]][$ret[3]]['data'] = $d['data'];
	}
	$params['table'] = 'measure_watt_hourly';
	$q = data_query_build( $params );
	$query = $db->query( $q );
	while( $d = $db->fetch_array( $query ) ){
		preg_match( '/(\d\d\d\d)-(\d\d)-(\d\d)/', $d['time'], $ret );
		$r[$ret[1]][$ret[2]][$ret[3]][$d['hour']]['data'] = $d['data'];
	}
	print json_encode($r);
	return true;
}

function sensor_history_year( $params = array( ) ){
	$ret = '';
	$q = data_query_build( $params );
	$db = new mydb;
	$query = $db->query( $q );
	while( $d = $db->fetch_array( $query ) ){
		preg_match( '/(\d\d\d\d)-(\d\d)-(\d\d)/', $d['time'], $ret );
		$r[$ret[1].'-'.$ret[2]][$ret[3]]['data'] += $d['data'];
	}
	print json_encode($r);
	return true;
}

function sensor_data_get( $params = array( ) ){
	$q = !strpos( $params['table'], 'tmpr' ) ? data_query_build( $params ) : tmpr_get_query( $params );
	if( $q ){
		$t = ''; $use_diff = false;
		$db = new mydb;
		$query = $db->query( $q );
		if( $diff = timezone_diff_get( $params ) ) $use_diff = false;
		while( $d = $db->fetch_array( $query ) ){
			$time =  $ts = preg_match('/hourly/', $params['table']) ? $d['time'].' '.$d['hour'].':00:00' : $d['time'];
			if( isset( $use_diff ) ){
				$ts = isset( $diff['prefix'] ) ? @strtotime( $time ) + $diff['diff'] : @strtotime( $time ) - $diff['diff'];
			}
			$u = $params['unit_return'] == 'timeframe' ? $ts*1000 : $time;
			$t .= '['. $u .', '. $d['data'] .'],';
		}
		$r = preg_replace( '/(.+),$/', "$1", $t );
		$r = '['.$r.']';
		#echo '<pre>';var_dump($r);exit;
		print $r;
	}
}

function sensor_values_now_get( $sensor ){
	if( is_numeric( $sensor ) ){
		$db = new mydb;
		$query = $db->query( "SELECT * FROM measure_data_now WHERE sensor_id = $sensor" );
		return $db->fetch_array( $query );
	}
	return true;
}

function sensor_prices_get( $params = array( ) ){
	$subselect = ( isset( $params['sensor'] ) && preg_match( '/[0-9]/', $params['sensor'] ) ) ? ' WHERE costs_sensor = '.$params['sensor'] : '';
	$db = new mydb;
	$query = $db->query( 'SELECT * from measure_costs'.$subselect.' ORDER BY costs_since desc' );
	$r = array();
	$cnt = 0;
	while( $d = $db->fetch_array( $query ) ){
		if( !is_numeric( $params['sensor'] ) ) continue;
		$r[$d['costs_since']][$cnt]['costs_id'] = $d['costs_id'];
		$r[$d['costs_since']][$cnt]['costs_sensor'] = $d['costs_sensor'];
		$r[$d['costs_since']][$cnt]['costs_from'] = $d['costs_from'];
		$r[$d['costs_since']][$cnt]['costs_to'] = $d['costs_to'];
		$r[$d['costs_since']][$cnt]['costs_price'] = $d['costs_price'];
		$cnt++;
	}
	print json_encode( $r );
}

function sensor_price_delete( $params = array( ) ){
	if( !isset( $params['id'] ) && !preg_match( '/[0-9]/', $params['id'] ) ) return true;
	$db = new mydb;
	$query = $db->query( 'DELETE from measure_costs WHERE costs_id = '.$params['id'] );
	return true;
}

function sensor_prices_delete( $params = array( ) ){
	if( !isset( $params['date'] ) ) return true;
	$db = new mydb;
	$query = $db->query( 'DELETE from measure_costs WHERE costs_since = "'.$params['date'].'"' );
	return true;
}

function sensor_price_add( $params = array( ) ){
	preg_match( '/\d{4,4}-\d{2,2}-\d{2,2}/', $params['date'], $r );
	if( !is_numeric( $params['price'] ) || !is_numeric( $params['from'] ) || !is_numeric( $params['to'] ) || strlen( $r['0'] ) != 10 ) return true;
	$q = 'INSERT INTO measure_costs (costs_sensor, costs_from, costs_to, costs_price, costs_since) VALUES ( '.$params['sensor'].', '.$params['from'].', '.$params['to'].', '.$params['price'].', "'.$params['date'].'")';
	$db = new mydb;
	$query = $db->query( $q );
	return true;
}

function sensor_statistic( $params = array( ) ){
	$params['range_to'] = sensor_position_next_date_get( $params );
	sensor_statistic_get( $params );
}

function sensor_data_raw_get( $params = array( ) ){
	if( data_query_build( $params ) ){
		$db = new mydb;
		$query = $db->query( data_query_build( $params ) );
		$r = array();
		while( $d = $db->fetch_array( $query ) ){
			$r[] = $d['data'];
		}
	}
	return $r;
}

function sensor_statistic_get( $params = array( ) ){
	if( data_query_build( $params ) ){
		$r = '';
		$db = new mydb;
		$query = $db->query( data_query_build( $params ) );
		while( $d = $db->fetch_array( $query ) ){
			preg_match( '/(\d\d\d\d)-(\d\d)-(\d\d)/', $d['time'], $t);
			$ts = @strtotime( $d['time'] );
			$month = @date( 'F', $ts );
			$r[$t[1]][$month][$t[3]]['data'] = $d['data'];
			$r[$t[1]][$month][$t[3]]['weekday'] = @date( 'l', $ts );
			$r[$t[1]][$month][$t[3]]['dayid'] = $d['day_id'];
		}
		print json_encode($r);
	}
}

function sensor_item_get( $params = array( ) ){
	if( data_query_build( $params ) ){
		$db = new mydb;
		$query = $db->query( data_query_build( $params ) );
		$r = array();
		while( $d = $db->fetch_array( $query ) ){
			$r = $d['data'];
		}
	}
	return $r;
}

function tmpr_get_query( $params = array( )){
	if( !strpos( $params['table'], 'tmpr' ) ){ return false; }
	$query = "SELECT * FROM $params[table] WHERE time = '$params[select]'";
	return $query;
}

function data_query_build( $params = array( ) ){
	$table = preg_match( '/(measure_watt|measure_watt_hourly|measure_watt_daily|measure_watt_monthly)/', $params['table'] ) ? $params['table'] : error( 'no database table selected: '.$params['table'] );
	$sensor = is_numeric( $params['sensor'] ) ? $params['sensor'] : error( 'no sensor error: '.$params['sensor'] );
	$order = isset( $params['order'] ) ? $params['order'] : 'time';
	$turn = isset( $params['turn'] ) ? $params['turn'] : '';
	
	switch( $params['timeframe'] ){
		case 'static':
			$unit = preg_match( '/(hour|day|month|year)/i', $params['unit'] ) ? $params['unit'] : error( 'unit error: '.$params['unit'] );
			$unit_value = is_numeric( $params['unit_value'] ) ? $params['unit_value'] : error( 'unit value error: '.$params['unit_value'] );
			$timeframe = " AND time > NOW( ) - INTERVAL $unit_value $unit ORDER BY $order";
		break;
		case 'last':
			$timeframe = " ORDER BY $order DESC LIMIT 1";
			# last hour watts has an extra option
			$timeframe = $params['table'] == 'measure_watt_hourly' ? 'AND time = DATE( NOW( ) ) '.$timeframe : $timeframe;
		break;
		case 'limit-last':
			$unit_value = is_numeric( $params['unit_value'] ) ? $params['unit_value'] : error( 'unit value error: '.$params['unit_value'] );
			$timeframe = " ORDER BY $order DESC LIMIT $unit_value";
		break;
		case 'select':
			$timeframe = "AND time = '$params[select]'";
		break;
		case 'range':
			$from = preg_replace('/_/', ' ', $params['range_from']);
			$to = preg_replace('/_/', ' ', $params['range_to']);
			$timeframe = "AND time BETWEEN '$from:00:00' and '$to:00:00'";
		break;
		case 'position':
			$timeframe = "AND time BETWEEN '$params[range_from]' and $params[range_to] ORDER BY $order $turn";
		break;
		case 'limit':
			$unit = preg_match( '/(hour|day| month)/i', $params['unit'] ) ? $params['unit'] : error( 'unit error: '.$params['unit'] );
			$unit_value = is_numeric( $params['unit_value'] ) ? $params['unit_value'] : error( 'unit value error: '.$params['unit_value'] );
			$timeframe = ' AND time > "'.$params['limit'].'"';
		break;
		case 'all':
			$timeframe = '';
		break;
		default:
			error('No timeframe to get data from');
		break;
	}
	$query = "SELECT * FROM $table WHERE sensor = '$sensor' $timeframe";
	#print "SELECT * FROM $table WHERE sensor = '$sensor' $timeframe<br />";
	return $query;
}

function price_sum( $params ){
	$d = '';
	foreach( $params as $k=>$v ){
		$d += $v;
	}
	$r = "$d";
	return $r;
}

function sensor_position_next_date_get( $params = array( ) ){
	$db = new mydb;
	$query = $db->query("SELECT position_time FROM measure_positions WHERE position_id > $params[sensor_position] AND position_sensor = $params[sensor]");
	$date = $db->fetch_row( $query );
	$r = is_array( $date ) ? sprintf( "'%s'", substr( $date[0], 0, 10) ) : 'now()';
	return $r;
}

function sensor_position_last_get( $sensor ){
	$db = new mydb;
	$query = $db->query("SELECT * FROM `measure_positions` WHERE position_sensor = $sensor  ORDER BY position_id DESC  LIMIT 1");
	$sp = $db->fetch_row( $query );
	return $sp;
}

function sensor_get( $sensor = '' ){
	if( !is_numeric( $sensor ) ) return true;
	$db = new mydb;
	$query = $db->query( "
		SELECT * 
		FROM measure_sensors
		LEFT JOIN measure_positions ON measure_positions.position_sensor = measure_sensors.sensor_id
		LEFT JOIN measure_settings ON measure_sensors.sensor_id = measure_settings.measure_sensor
		WHERE measure_sensors.sensor_id = $sensor
		ORDER BY measure_sensors.sensor_id, measure_positions.position_id
	" );
	$r = array();
	while( $d = $db->fetch_array( $query ) ){
		foreach( $d as $k => $v){
			$item = !is_numeric( $k ) ? $k : 'x';
			$r[$d['sensor_id']][$item] = $d[$k];
		}
		$r[$d['sensor_id']]['positions'][$d['position_id']]['position'] = $d['position_id'];
		$r[$d['sensor_id']]['positions'][$d['position_id']]['time'] = $d['position_time'];
		$r[$d['sensor_id']]['positions'][$d['position_id']]['description'] = $d['position_description'];
	}
	#echo '<pre>'; var_dump($r);
	return $r;
}

function sensors_get( ){
	$db = new mydb;
	$query = $db->query( "
		SELECT * 
		FROM measure_sensors
		LEFT JOIN measure_positions ON measure_positions.position_sensor = measure_sensors.sensor_id
		LEFT JOIN measure_settings ON measure_sensors.sensor_id = measure_settings.measure_sensor
		ORDER BY measure_sensors.sensor_id, measure_positions.position_id
	" );
	$r = array();
	while( $d = $db->fetch_array( $query ) ){
		foreach( $d as $k => $v){
			$item = !is_numeric( $k ) ? $k : 'x';
			$r[$d['sensor_id']][$item] = $d[$k];
		}
		$r[$d['sensor_id']]['positions'][$d['position_id']]['position'] = $d['position_id'];
		$r[$d['sensor_id']]['positions'][$d['position_id']]['time'] = $d['position_time'];
		$r[$d['sensor_id']]['positions'][$d['position_id']]['description'] = $d['position_description'];
	}
	#echo '<pre>'; var_dump($r);
	return $r;
}

function sensor_position_add( $params = array() ){
	$db = new mydb;
	$db->query("INSERT INTO measure_positions ( position_time, position_description, position_sensor ) VALUES ( now( ), '$params[sensor_position_name]', '$params[sensor_id]' )");
	return true;
}

function sensor_settings_save( $params = array() ){
	$params['sensor_price'] = preg_replace('/,/', '.', $params['sensor_price']);
	$db = new mydb;
	$db->query("UPDATE measure_settings SET measure_history = '$params[sensor_history]', measure_currency = '$params[sensor_currency]', measure_price = '$params[sensor_price]', measure_timezone_diff = '$params[sensor_timezone_diff]' WHERE measure_sensor = '$params[sensor_id]'");
	return true;
}
function sensor_position_delete( $params = array() ){
	if( !is_numeric( $params[sensor_position_id] ) ){
		error('sensor position is wrong');
	}
	$db = new mydb;
	$db->query("DELETE FROM measure_positions WHERE position_id = $params[sensor_position_id] LIMIT 1");
	return true;
}

function sensor_entry_delete( $params = array() ){
	if( !is_numeric( $params[sensor_id] ) ){
		error('sensor is wrong');
	}
	$db = new mydb;
	$db->query("DELETE FROM measure_sensors WHERE sensor_id = $params[sensor_id] LIMIT 1");
	return true;
}

function sensor_delete( $params = array() ){
	if( !is_numeric( $params[sensor_id] ) ){
		error('sensor is wrong');
	}
	$db = new mydb;
	$db->query("DELETE FROM measure_sensors WHERE sensor_id = $params[sensor_id] LIMIT 1");
	$db->query("DELETE FROM measure_positions WHERE position_sensor = $params[sensor_id]");
	$db->query("DELETE FROM measure_settings WHERE measure_sensor = $params[sensor_id]");
	$db->query("DELETE FROM measure_watt WHERE sensor = $params[sensor_id]");
	$db->query("DELETE FROM measure_data_now WHERE sensor = $params[sensor_id]");
	$db->query("DELETE FROM measure_watt_daily WHERE sensor = $params[sensor_id]");
	$db->query("DELETE FROM measure_watt_hourly WHERE sensor = $params[sensor_id]");
	$db->query("DELETE FROM measure_watt_monthly WHERE sensor = $params[sensor_id]");
	return true;
}

function sensor_add( $params = array() ){
	$db = new mydb;
	$db->query("INSERT IGNORE INTO measure_data_now ( sensor_id, watt, tmpr) VALUES ( '$parmams[sensor_id]', '0', '0' )");
	$db->query("INSERT INTO measure_sensors ( sensor_id, sensor_title ) VALUES ( '$params[sensor_id]', '$params[sensor_name]' )");
	$db->query("INSERT INTO measure_settings ( measure_sensor ) VALUES ( '$params[sensor_id]' )");
	return true;
}

function clamp_add( $_REQUEST ){
	# a clamp is internal just a sensor :)
	$_REQUEST['sensor_id'] = $_REQUEST['clamp_id'].$_REQUEST['sensor_id'];
	sensor_add( $_REQUEST );
}

function global_settings_get( ){
	$db = new mydb;
	$r = array();
	$query = $db->query("SELECT * FROM measure_system");
	while( $d = $db->fetch_array( $query ) ){
		$r[$d['measure_system_setting_name']] = stripslashes( $d['measure_system_setting_value'] );
	}
	print json_encode( $r );
}

function global_settings_set( $_REQUEST ){
	$db = new mydb;
	$db->query("DELETE FROM measure_system");
	foreach( $_REQUEST['data'] as $k => $v ){
		$db->query("INSERT INTO measure_system ( measure_system_setting_name, measure_system_setting_value ) VALUES ('$k', '$v' )");
	}
}

function backup_create(){
	if( !is_dir('../backup') ){ mkdir( '../backup', 0775 ); }
	$db = new mydb;
	$db->backup();
}

function backup_list_get(){
	$dir = opendir('../backup');
	while( false !== ( $file = readdir( $dir ) ) ){
		if ( preg_match( '/\.gz/', $file ) ) {
			$day = preg_replace( '/(\d{4,})(\d{2,})(\d{2,})/', "$1-$2-$3", substr( $file, 17, 8 ) );
			$time = preg_replace( '/(\d{2,})(\d{2,})(\d{2,})/', "$1:$2:$3", substr( $file, 26, 6 ) );
			$files[$file]['file'] = 'backup/'.$file;
			$files[$file]['filename'] = $file;
			$files[$file]['day'] = $day;
			$files[$file]['time'] = $time;
			$files[$file]['size'] = format_bytes( filesize( '../backup/'.$file ) );
		}
	}
	print json_encode($files);
}

function backup_delete( $params = array() ){
	if( isset( $params['filename'] ) && file_exists( '../backup/'.$params['filename'] ) && preg_match( '/^measureit_backup_(\d{8,8})-(\d{6,6}).gz$/', $params['filename'] ) ){
		unlink( '../backup/'.$params['filename'] );
	}
}

function timezone_diff_get( $params = array( ) ){
	$sensor = sensor_get( $params['sensor'] );
	$db = new mydb;
	$r = array();
	$query = $db->query("SELECT * FROM measure_system WHERE measure_system_setting_name = 'global_timezone_use'");
	$d = $db->fetch_array( $query );
	
	$timezone_diff = ( isset( $d['measure_system_setting_value'] ) && is_numeric( $d['measure_system_setting_value'] ) ) ? $d['measure_system_setting_value'] : $sensor[$params['sensor']]['measure_timezone_diff'];
	
	if( $timezone_diff == 0 ){
		return false;
	}
	preg_match( '/(-)?(\d+)/', $timezone_diff, $r );
	$diff['prefix'] = $r[1] != '' ? $r[1] : false;
	$diff['diff'] = ( $r[2] * 60 ) * 60;
	return $diff;
}

function format_bytes($size) {
    $units = array(' B', ' KB', ' MB', ' GB', ' TB');
    for ($i = 0; $size >= 1024 && $i < 4; $i++) $size /= 1024;
    return round($size, 2).$units[$i];
}

function error( $error = 'unknown' ){
	print 'ERROR: '.$error;
	exit;
}

?>