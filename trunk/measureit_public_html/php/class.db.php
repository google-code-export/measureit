<?php
require_once '/usr/local/measureit/measureit.cfg.php';

class mydb{

	function mydb(){
		global $database_host, $database_name, $database_port, $database_user, $database_passwd;
		$this->connect($database_host.':'.$database_port,$database_user,$database_passwd,$database_name);
	}

	function connect($host,$user,$pass,$datenbank){
		$this->link = mysql_connect($host,$user,$pass) or die ("Datenbankverbindung nicht moeglich!");
		$this->choosedb($datenbank);
	}

	function choosedb($datenbank){
		mysql_select_db($datenbank) or die ("Datenbank konnte nicht ausgewaehlt werden!");
	}

	function query($query){
		$res = mysql_query($query, $this->link) or die ("SQL Abfrage ist ungueltig. ".mysql_error());
		return $res;
	}

	function fetch_array($res){
		return mysql_fetch_array($res);
	}

	function fetch_row($res){
		return mysql_fetch_row($res);
	}

	function num_rows($res){
		return mysql_num_rows($res);
	}
   
	function insert_id(){
		return mysql_insert_id();
	}
	
	function backup(){
		set_time_limit(0);
		system( 'mysqldump --opt -h'.$database_host.':'.$database_port.' -u'.$database_user.' -p'.$database_passwd.' '.$database_name.' | gzip > ../backup/measureit_backup_'.date('Ymd-His').'.gz' );
	}

}

$db = new mydb;

?>
