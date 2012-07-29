import serial
import re
import MySQLdb
import datetime
import warnings
import time
import threading
import sys
import platform
import simplemail

# configure this settings
database_host = 'localhost'
database_port = 3306
database_name = 'measure_it'
database_user = 'measureit'
database_passwd = 'measureitpasswd'
# email settings to send you emails when there a problems
email_address = 'your-email@address.xx'
email_smtp_server = 'YOUR-SMTP-SERVER' # something like smtp.google.com if you are using gmail f.e
email_smtp_user = 'YOUR-USER-NAME'
email_smtp_passwd = 'YOUR-PASSWORD'
email_smtp_tls = True

sensors = {}
settings = {}
db = {}
err_critical = 0
debug = False

usbport = 'COM3'
if platform.system() == 'Linux':
    usbport = '/dev/ttyUSB0'
    
try:
    mysql = MySQLdb.connect(host=database_host,port=database_port,user=database_user,passwd=database_passwd,db=database_name,reconnect=1)
    #mysql = MySQLdb.connect(host="localhost",port=3306,user="measureit",passwd="measureitpasswd",db="measure_it" )
    db = mysql.cursor()

except:
    error_handle('Can not connect to database. Is the database on and are the database settings ok?')

def sensor_list_get():
    try:
        db.execute('SELECT sensor_id FROM measure_sensors')
        r = db.fetchall()
        for row in r:
            sensor = int(row[0])
            sensors[sensor] = {'tmpr' : 0, 'watt' : 0}
        return sensors
    except:
        error_handle('Error in sensor_list_get. No sensors or broken database connection?')
        err_critical_count()


def sensor_settings_get():
    try:
        sensors_settings = {}
        db.execute('SELECT sensor_id, measure_history FROM measure_sensors LEFT JOIN measure_settings ON measure_settings.measure_sensor = measure_sensors.sensor_id')
        r = db.fetchall()
        for row in r:
            sensor = int(row[0])
            sensors_settings[sensor] = row[1]
        return sensors_settings
    except:
        error_handle('Error in sensor_settings_get. No sensors or broken database connection?')
        err_critical_count()

def system_settings_get():
    try:
        system_settings = {}
        db.execute('SELECT measure_system_setting_name, measure_system_setting_value FROM measure_system')
        r = db.fetchall()
        return r
    except:
        error_handle('Error in system_settings_get. No sensors or broken database connection?')
        err_critical_count()

def sensor_data_change( coloum, sensor, data):
    try:
        sensor = str(sensor)
        data = str(data)
        db.execute('UPDATE measure_data_now SET '+coloum+' = "'+data+'" WHERE sensor_id = '+sensor)
    except:
        error_handle('Error in sensor_data_change while try to change the current volt data')
        err_critical_count()

def sensor_watt_insert( sensor, watt ):
    try:
        sensor = str(sensor)
        watt = str(watt)
        db.execute('INSERT INTO measure_watt ( sensor, data, time) values( '+sensor+', '+watt+', NOW() ) ')
    except:
        error_handle('Error in sensor_watt_insert while inserting watt into database')
        err_critical_count()

def tmpr_insert( tmpr ):
    try:
        now = datetime.datetime.now()
        db.execute('INSERT INTO measure_tmpr ( data, time ) values( "'+str(tmpr)+'", NOW() ) ')
        db.execute('INSERT IGNORE INTO measure_tmpr_hourly ( data, time, hour ) VALUES ( "'+str(tmpr)+'", NOW(), "'+str(now.hour)+'" )')
    
    except:
        error_handle('Error in tmpr_insert while insert tmpr. Is there a connection to the database?')
        err_critical_count()

def history_update( sensor, hist ):
    try:
        date_hour = date_hour_get(hist[1])
        if hist[0] == 'm':
            query = 'INSERT IGNORE INTO measure_watt_monthly ( sensor, data, time ) VALUES ( "'+str(sensor)+'", "'+str(hist[2])+'", "'+date_hour[0]+'" )'
        if hist[0] == 'd':
            query = 'INSERT IGNORE INTO measure_watt_daily ( sensor, data, time ) VALUES ( "'+str(sensor)+'", "'+str(hist[2])+'", "'+date_hour[0]+'" )'
        if hist[0] == 'h':
            query = 'INSERT IGNORE INTO measure_watt_hourly ( sensor, data, hour, time ) VALUES ( "'+str(sensor)+'", "'+str(hist[2])+'", "'+date_hour[1]+'", "'+date_hour[0]+'" )'
        db.execute(query)
    except:
        error_handle('Error in history_update. Is there a connection to the database?')
        err_critical_count()

def cron_timer_hourly():
    global mysql
    now = datetime.datetime.now()
    day_from = datetime.date.today()
    day_to = datetime.date.today()
    hour_from = now.hour-1
    hour_to = now.hour
    if now.hour == 0:
        hour_from = 23
        day_from = datetime.date.today() - datetime.timedelta(days=1)
    date_from = str(day_from)+' '+str(hour_from)+':00:00'
    date_to = str(day_to)+' '+str(hour_to)+':00:00'
    try:
        for sensor in sensors:
            usage_sum_hourly = usage_sum_count = sum = 0
            db.execute("select sensor, data from measure_watt where time between '"+date_from+"' AND '"+date_to+"' AND sensor="+str(sensor))
            r = db.fetchall()
            for row in r:
                usage_sum_hourly += float(row[1])
                usage_sum_count += 1
            if usage_sum_count != 0:
                sum = (usage_sum_hourly/usage_sum_count)/1000
            query = 'INSERT IGNORE INTO measure_watt_hourly ( sensor, data, hour, time ) VALUES ( "'+str(sensor)+'", "'+str(sum)+'", "'+str(hour_from)+'", "'+str(day_from)+'" )'
            db.execute(query)
        usage_sum_hourly = usage_sum_count = sum = r = 0
    except:
        error_handle('Error in cron_timer_hourly. No sensors or broken database connection?')
        err_critical_count()
        
    timer_hourly = threading.Timer(3600.0, cron_timer_hourly)
    timer_hourly.start()
        
    
def cron_timer_daily():
    global mysql
    timer_daily = threading.Timer(86400.0, cron_timer_daily)
    timer_daily.start()
    try:
        for sensor in sensors:
            usage_sum_daily = usage_sum_count = sum = 0
            date_from = str(datetime.date.today() - datetime.timedelta(days=1))+' 00:00:00'
            date_to = str(datetime.date.today())+' 00:00:00'
            db.execute("select sensor, data from measure_watt where time between '"+date_from+"' AND '"+date_to+"' AND sensor="+str(sensor)) 
            r = db.fetchall() 
            try:
                for row in r:
                    usage_sum_daily += float(row[1])
                    usage_sum_count += 1
                if usage_sum_count != 0:
                    sum = ((usage_sum_daily/usage_sum_count)*24)/1000
                    
                query = 'INSERT IGNORE INTO measure_watt_daily ( sensor, data, time ) VALUES ( "'+str(sensor)+'", "'+str(sum)+'", "'+date_from+'" )'
                db.execute(query)
                usage_sum_daily = usage_sum_count = sum = r = 0
            except:
                error_handle('Error in cron_timer_daily. No sensors or broken database connection?')
                err_critical_count()
            try: # delete old watt data
                sensor_settings = sensor_settings_get()
                if sensor_settings.has_key(sensor):
                    if sensor_settings[sensor] > 0:
                        query = 'DELETE FROM measure_watt WHERE sensor = '+str(sensor)+' AND time < NOW( ) - INTERVAL '+str(sensor_settings[sensor])+' DAY'
                        db.execute(query)
            except:
                error_handle('Error in cron_timer_hourly while deleting old data')
                err_critical_count()
    except:
        error_handle('Error in cron_timer_daily. No sensors or broken database connection?')
        err_critical_count()
                
def date_hour_get( hours ):
    try:
        db.execute('SELECT NOW() - INTERVAL '+hours+' HOUR')
        date = db.fetchone()
        r = re.search(r"(\d+-\d+-\d+) (\d+):.+", str(date[0]) )
        return (r.group(1), r.group(2))
    except:
        error_handle('Error in data_hour_get. No sensors or broken database connection?')
        err_critical_count()

def sensor_data_check( sensor, watt, tmpr ):
    sensor = int(sensor)
    watt = int(watt)
    if sensors and sensors.has_key(sensor):
        if sensors[sensor]['tmpr'] != tmpr:
            sensors[sensor]['tmpr'] = tmpr
            sensor_data_change( 'tmpr', sensor, tmpr )
            tmpr_insert( tmpr )
        if sensors[sensor]['watt'] != watt:
            sensors[sensor]['watt'] = watt
            sensor_data_change( 'watt', sensor, watt )
            sensor_watt_insert( sensor, watt )
        return True    

def mail_send(email_subject, email_body):
    simplemail.Email(
        from_address = email_address,
        to_address = email_address,
        subject = email_subject,
        message = email_body,
        smtp_server = email_smtp_server,
        smtp_user = email_smtp_user,
        smtp_password = email_smtp_passwd, 
        use_tls = email_smtp_tls
    ).send()

def error_handle(message):
    print str(datetime.datetime.now())+' '+message

def err_critical_count():
    global err_critical
    err_critical += 1
    if err_critical > 3000:
        try:
            mail_send('Message from your measureit installation', 'Please take a look at your installation. It seems there is a problem...')
            err_critical = 0
        except:
            error_handle('Can not send email. Please check your settings!')

warnings.filterwarnings("ignore")
sensors = sensor_list_get()

try:
    ser = serial.Serial(port=usbport, baudrate=57600, bytesize=serial.EIGHTBITS, parity=serial.PARITY_NONE, stopbits=serial.STOPBITS_ONE, timeout=3)
except:
    error_handle('Can not connect to the com device. Please check the cable is plugged in and if the device has the correctly drivers installed')

if 'test' in sys.argv:
    debug = True

cron_timer_hourly()
cron_timer_daily()

while True:
    line = ser.readline()
    line = line.rstrip('\r\n')
    clamps = False
    if debug:
        print line
    
    # parsing from history_output 
    #r = re.search(r"<hist>", line)
    #if r:
    #    for s in sensors:
    #        r = re.search(r"<data><sensor>"+str(s)+"</sensor>(.+?)</data>", line)
    #        if r:
    #            d = re.findall(r"<(d|m|h)(\d+)>(.+?)</.+?>", r.group(1) )
    #           if d:
    #                for f in d:
    #                    history_update(s,f)
    
    r = re.search(r"<tmpr>(.+?)</tmpr><sensor>(\d)+</sensor>.+<ch1><watts>(\d+)<\/watts><\/ch1>(<ch2><watts>(\d+)<\/watts><\/ch2>)?(<ch3><watts>(\d+)<\/watts><\/ch3>)?", line)
    if r:
        #print mysql
        tmpr = r.group(1)
        watt_sum = int(r.group(3))
        # more than 1 clamp
        if r.group(5):
            sensor = '2'+r.group(2)
            watt = int(r.group(5))
            watt_sum += watt
            sensor_data_check( sensor, watt, tmpr )
            clamps = True

        if r.group(7):
            sensor = '3'+r.group(2)
            watt = int(r.group(7))
            watt_sum += watt
            sensor_data_check( sensor, watt, tmpr )
            clamps = True
            
        if clamps:
            sensor = '1'+r.group(2)
            watt = int(r.group(3))
            sensor_data_check( sensor, watt, tmpr )
           
        sensor_data_check( r.group(2), watt_sum, tmpr )
