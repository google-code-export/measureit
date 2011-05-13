<?php 

require_once( 'class.db.php' );

# in demo mode no sensor actions please
$demo = true;

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
		default:
			echo 'this is not a valid request';
		break;
	}
}

function navigation_main( ){
	$sensors = sensor_get();
	$r = array();
	foreach( $sensors as $k=>$v ){
		$r[$k]['sensor'] = $v;
	}
	print json_encode($r);
	return true;
}

function sensor_detail( $params = array( ) ){
	if( is_numeric( $params['sensor'] ) &&  $params['sensor'] > 0){
		$r['sensor'] = sensor_get( $params['sensor'] );
		print json_encode($r);
	}
	return true;
}

function summary_start( ){
	$sensors = sensor_get();
	foreach( $sensors as $k=>$v ){
		$p = end( $v['positions'] );
		$vn = sensor_values_now_get( $k );
		$r[$k]['sensor'] = $v;
		$r[$k]['tmpr'] = $vn['tmpr'];
		$r[$k]['watt'] = $vn['watt'];
		$r[$k]['daily'] = sensor_item_get( array( 'sensor'=> $k, 'table'=> 'measure_watt_daily', 'timeframe'=> 'last', 'limit' => $p['time']  ) );
		$r[$k]['hourly'] = sensor_item_get( array( 'sensor'=> $k, 'table'=> 'measure_watt_hourly', 'timeframe'=> 'last', 'order' => 'hour', 'limit' => $p['time']  ) );
		$r[$k]['weekly'] = price_sum( sensor_data_raw_get( array( 'sensor'=> $k, 'unit_value'=> 7, 'unit'=> 'day', 'table'=> 'measure_watt_daily', 'timeframe'=> 'limit', 'limit' => $p['time']  ) ) );
		$r[$k]['monthly'] = price_sum( sensor_data_raw_get( array( 'sensor'=> $k, 'unit_value'=> 30, 'unit'=> 'day', 'table'=> 'measure_watt_daily', 'timeframe'=> 'limit', 'limit' => $p['time']  ) ) );
	}
	print json_encode($r);
	return true;
}

function sensor_data_get( $params = array( ) ){
	$q = !strpos( $params['table'], 'tmpr' ) ? data_query_build( $params ) : tmpr_get_query( $params );
	if( $q ){
		$t = '';
		$db = new mydb;
		$query = $db->query( $q );
		while( $d = $db->fetch_array( $query ) ){
			$time =  preg_match('/hourly/', $params['table']) ? $d['time'].' '.$d['hour'].':00:00' : $d['time'];
			$u = $params['unit_return'] == 'timeframe' ? ( strtotime( $time ) + 7200 )*1000 : $time;
			$t .= '['. $u .', '. $d['data'] .'],';
		}
		$r = preg_replace( '/(.+),$/', "$1", $t );
		$r = '['.$r.']';
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
			$ts = strtotime( $d['time'] );
			$month = date( 'F', $ts );
			$r[$t[1]][$month][$t[3]]['data'] = $d['data'];
			$r[$t[1]][$month][$t[3]]['weekday'] = date( 'l', $ts );
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
	#$limit = isset( $params['limit'] ) ? ' AND time > '.$params['limit'] : '';
	#var_dump($params['timeframe']);
	
	switch( $params['timeframe'] ){
		case 'static':
			$unit = preg_match( '/(hour|day| month)/i', $params['unit'] ) ? $params['unit'] : error( 'unit error: '.$params['unit'] );
			$unit_value = is_numeric( $params['unit_value'] ) ? $params['unit_value'] : error( 'unit value error: '.$params['unit_value'] );
			$timeframe = " AND time > NOW( ) - INTERVAL $unit_value $unit ORDER BY $order";
		break;
		case 'last':
			$timeframe = " ORDER BY $order DESC LIMIT 1";
			# last hour watts has an extra option
			$timeframe = $params['table'] == 'measure_watt_hourly' ? 'AND time = DATE( NOW( ) ) '.$timeframe : $timeframe;
		break;
		case 'select':
			$timeframe = "AND time = '$params[select]'";
		break;
		case 'range':
			$from = preg_replace('/_/', ' ', $params[range_from]);
			$to = preg_replace('/_/', ' ', $params[range_to]);
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
		default:
			error('No timeframe to get data from');
		break;
	}
	$query = "SELECT * FROM $table WHERE sensor = '$sensor' $timeframe";
	#print "SELECT * FROM $table WHERE sensor = '$sensor' $timeframe";
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

function sensor_get( $sensor = '' ){
	$db = new mydb;
	$subselect = is_numeric( $sensor ) ? 'WHERE measure_sensors.sensor_id = '.$sensor : '';
	$query = $db->query( "
		SELECT * 
		FROM measure_sensors
		LEFT JOIN measure_positions ON measure_positions.position_sensor = measure_sensors.sensor_id
		LEFT JOIN measure_settings ON measure_sensors.sensor_id = measure_settings.measure_sensor
		$subselect
		ORDER BY measure_positions.position_id
	" );
	$r = array();
	while( $d = $db->fetch_array( $query ) ){
		foreach( $d as $k => $v){
			$item = !is_numeric( $k ) ? $k : '';
			$r[$d['sensor_id']][$item] = $d[$k];
		}
		$r[$d['sensor_id']]['positions'][$d['position_id']]['position'] = $d['position_id'];
		$r[$d['sensor_id']]['positions'][$d['position_id']]['time'] = $d['position_time'];
		$r[$d['sensor_id']]['positions'][$d['position_id']]['description'] = $d['position_description'];
	}
	return $r;
}

function sensor_position_add( $params = array() ){
	$db = new mydb;
	$db->query("INSERT INTO measure_it.measure_positions ( position_time, position_description, position_sensor ) VALUES ( now( ), '$params[sensor_position_name]', '$params[sensor_id]' )");
	return true;
}

function sensor_settings_save( $params = array() ){
	$params['sensor_price'] = preg_replace('/,/', '.', $params['sensor_price']);
	$db = new mydb;
	$db->query("UPDATE measure_it.measure_settings SET measure_history = '$params[sensor_history]', measure_currency = '$params[sensor_currency]', measure_price = '$params[sensor_price]' WHERE measure_sensor = '$params[sensor_id]'");
	return true;
}
function sensor_position_delete( $params = array() ){
	if( !is_numeric( $params[sensor_position_id] ) ){
		error('sensor position is wrong');
	}
	$db = new mydb;
	$db->query("DELETE FROM measure_it.measure_positions WHERE position_id = $params[sensor_position_id] LIMIT 1");
	return true;
}

function sensor_entry_delete( $params = array() ){
	if( !is_numeric( $params[sensor_id] ) ){
		error('sensor is wrong');
	}
	$db = new mydb;
	$db->query("DELETE FROM measure_it.measure_sensors WHERE sensor_id = $params[sensor_id] LIMIT 1");
	return true;
}

function sensor_delete( $params = array() ){
	if( !is_numeric( $params[sensor_id] ) ){
		error('sensor is wrong');
	}
	$db = new mydb;
	$db->query("DELETE FROM measure_it.measure_sensors WHERE sensor_id = $params[sensor_id] LIMIT 1");
	$db->query("DELETE FROM measure_it.measure_positions WHERE position_sensor = $params[sensor_id]");
	$db->query("DELETE FROM measure_it.measure_settings WHERE measure_sensor = $params[sensor_id]");
	$db->query("DELETE FROM measure_it.measure_watt WHERE sensor = $params[sensor_id]");
	$db->query("DELETE FROM measure_it.measure_data_now WHERE sensor = $params[sensor_id]");
	$db->query("DELETE FROM measure_it.measure_watt_daily WHERE sensor = $params[sensor_id]");
	$db->query("DELETE FROM measure_it.measure_watt_hourly WHERE sensor = $params[sensor_id]");
	$db->query("DELETE FROM measure_it.measure_watt_monthly WHERE sensor = $params[sensor_id]");
	return true;
}

function sensor_add( $params = array() ){
	$db = new mydb;
	$db->query("INSERT IGNORE INTO measure_it.measure_data_now ( sensor_id, watt, tmpr) VALUES ( '$parmams[sensor_id]', '0', '0' )");
	$db->query("INSERT INTO measure_it.measure_sensors ( sensor_id, sensor_title ) VALUES ( '$params[sensor_id]', '$params[sensor_name]' )");
	return true;
}

function error( $error = 'unknown' ){
	print 'ERROR: '.$error;
	exit;
}

?>