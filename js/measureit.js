if( pc === 1 ){
	// load navi
	$.getJSON('php/measureit_functions.php', { 'do' : 'navigation_main' }, function(data) {
		navigation_main( data );
	})

	var timer = setTimeout(hist_update, 10000);
	$('.ui-tabs').click(function(){ $('.ui-tabs').css( 'height', '100%' ) });
}


// functions

// data from start page
function hist_update(stop){
	clearTimeout(timer);
	if( stop == '1'){ return true; }
	$.getJSON('php/measureit_functions.php', { 'do' : 'summary_start' }, function(data) {
		$.each(data, function(d){
			if(data[d].sensor.sensor_id < 9){
				$('#'+data[d].sensor.sensor_id).remove();
				$('#summary').append('<div id="'+data[d].sensor.sensor_id+'">');
				$('#'+data[d].sensor.sensor_id).addClass('ui-widget-content ui-corner-all sensor').append('<h5 class="ui-widget-header ui-corner-all">' + data[d].sensor.position_description + '</h5>');
				$('#'+data[d].sensor.sensor_id).append( '<div id="tmpr'+data[d].sensor.sensor_id+'" class="ui-widget-content ui-corner-all sensor-inner"><div class="title"><h5 class="ui-widget-header ui-corner-all inner">temperature</h5></div><div class="data refresh">'+data[d].tmpr+' C</div></div>' );
				$('#'+data[d].sensor.sensor_id).append( '<div id="watt'+data[d].sensor.sensor_id+'" class="ui-widget-content ui-corner-all sensor-inner"><div class="title"><h5 class="ui-widget-header ui-corner-all inner">current watt</h5></div><div class="data refresh">'+data[d].watt + 'W</div></div>' );
				$('#'+data[d].sensor.sensor_id).append( '<div id="hourly"'+data[d].sensor.sensor_id+'" class="ui-widget-content ui-corner-all sensor-inner"><div class="title"><h5 class="ui-widget-header ui-corner-all inner">last hour</h5></div><div class="data">'+data[d].hourly+' '+data[d].sensor.measure_currency+'</div></div>' );
				$('#'+data[d].sensor.sensor_id).append( '<div id="daily"'+data[d].sensor.sensor_id+'" class="ui-widget-content ui-corner-all sensor-inner"><div class="title"><h5 class="ui-widget-header ui-corner-all inner">last day</h5></div><div class="data">'+data[d].daily+' '+data[d].sensor.measure_currency+'</div></div>' );
				$('#'+data[d].sensor.sensor_id).append( '<div id="weekly"'+data[d].sensor.sensor_id+'" class="ui-widget-content ui-corner-all sensor-inner"><div class="title"><h5 class="ui-widget-header ui-corner-all inner">last 7 days</h5></div><div class="data">'+data[d].weekly+' '+data[d].sensor.measure_currency+'</div></div>' );
				$('#'+data[d].sensor.sensor_id).append( '<div id="monthly"'+data[d].sensor.sensor_id+'" class="ui-widget-content ui-corner-all sensor-inner"><div class="title"><h5 class="ui-widget-header ui-corner-all inner">last 30 days</h5></div><div class="data">'+data[d].monthly+' '+data[d].sensor.measure_currency+'</div></div>' );
			}
		});
	})
	$('.refresh').css('background-color','darkred');
	timer = setTimeout(hist_update, 10000)
}

function navigation_main( data ) {
	hist_update('0');
	$('#tabcontainer li').remove();
	$('#tabcontainer').append('<li class="ui-state-default ui-corner-top" value="1000"><a href="#tabs-1000" name="1000">Home</a></li>');
	
	$.each( data, function(d){
		if( data[d].sensor.sensor_id < 9 ){
			$('#tabcontainer').append('<li class="tab ui-state-default ui-corner-top" value="'+data[d].sensor.sensor_id+'" id="submenu'+data[d].sensor.sensor_id+'"><a href="#tabs-' + data[d].sensor.sensor_id + '" name="'+data[d].sensor.sensor_id+'">' + data[d].sensor.position_description + '</a></li>');
			$('#tabs').append('<div id="tabs-'+data[d].sensor.sensor_id+'"><div id="menu'+data[d].sensor.sensor_id+'" class="menu" /><div id="det'+data[d].sensor.sensor_id+'" class="det"><div class="placeholder" id="placeholder' +data[d].sensor.sensor_id+'" /><div class="overview" id="overview' +data[d].sensor.sensor_id+'" /></div></div>');
			sensor_clamps(data[d].sensor.clamps,d);

		}
			
		});
	$('#tabcontainer').append('<li class="ui-state-default ui-corner-top" value="1011"><a href="#tabs-1011" name="1011">Setup</a></li>');
	$('#tabs,#foo').tabs({
	    select: function(event, ui){
			$('.tooltip').hide();
			if($(ui.tab).attr('name') != '1000' && $(ui.tab).attr('name') != '1011' ){
				sensor_detail($(ui.tab).attr('name'));
				hist_update('1');
				return true;
			}
			if($(ui.tab).attr('name') == '1000'){
				hist_update('0');
				return true;
			}
			if($(ui.tab).attr('name') == '1011'){
				measureit_admin( data );
				hist_update('1');
				return true;
			}
	    }
	});
};

function sensor_statistic( data, sensor ){
	// there are no clamp details from the current cost device
	//if(sensor < 10){
		$('#statistic'+sensor).remove();
		container_get('#menu'+ sensor, 'statistic'+sensor,'statistic');
		button_get('#statistic'+sensor,'sensor_statistic'+sensor,'costs');
		button_get('#statistic'+sensor,'sensor_statistic_multiple_week'+sensor,'last 7 days');
		button_get('#statistic'+sensor,'sensor_statistic_multiple_year'+sensor,'last 12 months');
		button_get('#statistic'+sensor,'sensor_statistic_datetime'+sensor,'day / time usage');
		//button_get('#statistic'+sensor,'sensor_statistic_comparison'+sensor,'comparison');
		$('#sensor_statistic'+sensor).click(function( ) { 
			$('#placeholder'+sensor).empty();
			$('#overview'+sensor).empty();
			$('#placeholder'+sensor).unbind();
			$('.tooltip').remove();
			$('.sensor_legend').remove();
			
			$.each( data, function(d){
				div_get('#placeholder'+sensor,'sensor_position'+d,'');
				div_get('#sensor_position'+d,'sensor_position_statistic'+d,'>> '+data[d].description,'pointer statistic_position');
				$('#sensor_position_statistic'+d).click(function( ){
					$('.sensor_statistic_table').remove();
					sensor_statistic_generate(data, sensor, d);	
				});
			});
			
		});
		
		$('#sensor_statistic_multiple_week'+sensor).click( function(){ sensor_history_get( sensor, 'week' ); });
		$('#sensor_statistic_multiple_year'+sensor).click( function(){ sensor_history_get( sensor, 'month' ); });
		$('#sensor_statistic_datetime'+sensor).click( function(){ sensor_statistic_datetime( sensor ) });
		//$('#sensor_statistic_comparison'+sensor).click( function(){ sensor_statistic_comparison( sensor ) });	
	//}
}

function sensor_clamps( data, sensor ){
	if($(data).length > 0){
		$('#submenu'+sensor).append('<ul class="sensor_hide_helper"><li class="sensor_hide_helper"><a href="#tab" id="sensor_hide'+sensor+'"><span class="ui-icon ui-icon-circle-plus sensor_hide"></span></a></li></ul>');
		$('#submenu'+sensor).addClass('menu_clamp_with_sensor');
		$.each(data, function(d){
			$('#tabcontainer').append('<li class="tab ui-state-default ui-corner-top sensor_clamp_menu sensor_clamp_menu'+sensor+'"><a href="#tabs-' + d + '" name="'+d+'">' + data[d] + '</a></li>');
			$('#tabs').append('<div id="tabs-'+d+'" name="'+d+'"><div id="menu'+d+'" class="menu" /><div id="det'+d+'" class="det"><div class="placeholder" id="placeholder' +d+'" /><div class="overview" id="overview' +d+'" /></div></div>');
		});
		$('#sensor_hide'+sensor).toggle(
				function(){
					$('.sensor_clamp_menu'+sensor).fadeIn('slow');
				},
				function(){
					$('.sensor_clamp_menu'+sensor).fadeOut('slow');
				}
			);
	}
}

function sensor_statistic_comparison( sensor ){
    $.getJSON('php/measureit_functions.php', { 'do' : 'sensor_statistic_comparison', 'sensor' : sensor, 'timeframe' : 'all' }, function(d){
    	//graph_draw_comparison( d, sensor);
    	var dataset = []; var tmp=[]; var cnt = 0;
    	$.each(d, function(dat){
    		//console.log('1',d[dat]);
    		$.each(d[dat], function(f){
    			if(typeof(d[dat][f]) == 'object'){
    				//console.log(d[dat][f]);
        			tmp.push({ label: dat+'-'+f,  data: d[dat][f]['data'] });
    			} 
			});
			dataset[cnt] = tmp;
			cnt = cnt+1;
    	});
    	console.log(dataset);
    });
}

function sensor_statistic_datetime( sensor ){
	$.getJSON('php/measureit_functions.php', { 'do' : 'sensor_detail_statistic', 'sensor' : sensor }, function(d){
	    $('#placeholder'+sensor).empty();
	    $('#overview'+sensor).empty();
	    $('#container-legend').remove();
	    $('.sensor_legend').remove();
	    
	    $.each( d, function(dat){
			var dataset = []; var cnt = 0;
			
			div_get('#placeholder'+sensor,dat+''+cnt+'containerset'+sensor,'','ui-corner-all');
			div_get('#'+dat+''+cnt+'containerset'+sensor,dat+''+sensor, '<div class="button datetime-container-button" id="'+dat+'title'+sensor+'" />', 'datetime-container-button-class spbutton');
			
			// yearly graphs
			if(typeof(d[dat]) == 'object' && ( dat == 'yearhours' || dat == 'yeardays' ) ){
				var l = dat == 'yearhours' ? ':00' : '';
				var val = dat == 'yearhours' ? 'Usage last 12 months per hour' : 'Usage last 12 months per day';
				$('#'+dat+'title'+sensor).append(val);
				$.each( d[dat], function(p){
					dataset[cnt] = { label: p+''+l,  data: d[dat][p] };
					cnt = cnt+1;
				});

				$('#'+dat+'title'+sensor).click(function(){
					$('#data-container'+sensor).empty();
					div_get('#data-container'+sensor, 'loading'+sensor,'','loader');
					sensor_detail_statistic_draw( '#data-container'+sensor, dataset);
					$('.loader').fadeOut();
				});
			}
			
			// monthly graphs
			if(typeof(d[dat]) == 'object' && ( dat == 'yearsdaysdetail' ) || dat == 'monthshoursdetail' ){
				var datasetdetail = []; var cnt = 0;
				var val = dat == 'monthshoursdetail' ? 'Detailed usage last 12 months per hour' : 'Detailed usage last 12 months per day';
				$('#'+dat+'title'+sensor).append(val);
				$.each( d[dat], function(p){
					var l = dat == 'monthshoursdetail' ? ':00' : '';
					var tmp = [];
					tmp.push({'lb': p });
					$.each(d[dat][p], function(f){
						tmp.push({ label: f+''+l,  data: d[dat][p][f] });
					});
					datasetdetail[cnt] = tmp;
					cnt = cnt+1;
				});
				
				$('#'+dat+'title'+sensor).click(function(){
					$('#data-container'+sensor).empty();
					$('#'+dat+'container'+sensor).empty();
					div_get('#data-container'+sensor, 'loading'+sensor,'','loader');
					var cnt = 1;
					$.each(datasetdetail, function(set){
						div_get('#data-container'+sensor,dat+''+cnt+'containerset'+sensor,'','ui-widget-content ui-corner-all');
						div_get('#'+dat+''+cnt+'containerset'+sensor,dat+'title'+cnt+'container'+sensor,datasetdetail[set][0]['lb'],'padding5 ui-state-default ui-corner-all');
						div_get('#'+dat+''+cnt+'containerset'+sensor,dat+''+cnt+'container'+sensor,'','padding15');
						$('#'+dat+''+cnt+'container'+sensor).css('height','100%');
						div_get('#data-container'+sensor,dat+''+cnt+'container'+sensor,'','spacer');
						sensor_detail_statistic_draw( '#'+dat+''+cnt+'container'+sensor, datasetdetail[set]);
						cnt = cnt+1;
					});
					$('#data-container'+sensor).css('padding','15px');
					$('.loader').fadeOut();
				});
			} 
		});
	    div_get('#placeholder'+sensor, 'data-container'+sensor,'','sensor-detail-statistic-data-container padding15');
		$('#data-container'+sensor).css('height','100%');div_get('#placeholder'+sensor, 'data-container'+sensor,'','sensor-detail-statistic-data-container padding15');
		
	});
}


function sensor_detail_statistic_draw( placeholder, data){
	$.plot($(placeholder), data,{
		 series: {
           pie: {
               show: true,
               radius: 1,
               tilt: 0.5,
				stroke: {
					color: '#D8D8D8',
					width: 1
				},
               label: {
                   show: true,
                   radius: 1,
                   formatter: function(label, series){
                       return '<div style="font-size:8pt;text-align:center;padding:2px;color:#000;background-color:#E6E6E6; border: 1px solid #585858;">'+label+'<br/>'+parseFloat( series.data[0][1] ).toFixed(2)+'</div>';
                   },
                   background: { opacity: 0.8 }
               },
               combine: {
                   threshold: -1
               }
           }
       },
       legend: {
           show: false
       }
	});
}

function sensor_statistic_generate( data, sensor, position ){
	var price_kwh = cost_month = 0;
	var currency = '';
	$.getJSON('php/measureit_functions.php', { 'do' : 'sensor_detail', 'sensor' : sensor }, function(d){
		price_kwh = d.sensor[sensor].measure_price;
		currency = d.sensor[sensor].measure_currency;
	} );
	$.getJSON('php/measureit_functions.php', {
		'do' : 'sensor_statistic',
		'sensor_position': position,
		'sensor' : sensor,
		'table' : 'measure_watt_hourly',
		'timeframe' : 'position',
		'range_from' : data[position].time.substr( 0, 10 ),
		'order' : 'hour_id',
		'turn' : 'desc' 
		}, function(d) {
			$.each( d, function( v ){
				div_get('#sensor_position'+position, 'sensor_statistic_table'+v, v+span_get('sensor_statistic_year_watt'+v, '', 'float_right statistic_year_watt statistic_data'), 'sensor_statistic_table level1');
				
				// year
				$.each( $(d[v]), function( y ){
					var kwh_year = costs_year = 0;
					$('#sensor_statistic_table'+y).remove();
					div_get('#sensor_statistic_table'+v, 'sensor_statistic_year'+v, '', 'level2');
					// month
					$.each( this, function( m ){
						var statistics_val_month = button_get();
						div_get('#sensor_statistic_year'+v, 'sensor_statistic_month'+v+m, '', 'level3 pointer');
						div_get('#sensor_statistic_month'+v+m,'','> '+m+span_get('sensor_statistic_month_watt'+v+m, '', 'float_right statistic_month_watt statistic_data'), 'month_header');
						div_get('#sensor_statistic_month'+v+m, 'sensor_statistic_month_container'+v+m, '', 'level3 hidden');
						
						var kwh_month = cost_month = 0;
						$('#sensor_statistic_month'+v+m).click(function(){
							$('#sensor_statistic_month_container'+v+m).toggle('slow');
							$('#tabs').css('height','100%');
							$('#overview'+sensor).css('display','none');
							});
						//days
						$.each( this, function( d ){
							div_get('#sensor_statistic_month_container'+v+m, 'sensor_statistic_day'+v+m+d, '', 'level4');
							div_get('#sensor_statistic_day'+v+m+d,'',d+' '+this.weekday+span_get('sensor_statistic_day_watt'+v+m+d, '', 'float_right statistic_day_data statistic_data'),'day_header');
							$('#sensor_statistic_day_watt'+v+m+d).append( this.price.toFixed(2).replace('.',',') + ' ' + currency );
							kwh_month = kwh_month + parseFloat(this.data);
							cost_month = cost_month + parseFloat(this.price);
							});
							$('#sensor_statistic_month_watt'+v+m).append( kwh_month.toFixed(2).replace('.',',') + ' kwh - ' );
							$('#sensor_statistic_month_watt'+v+m).append( ( cost_month.toFixed(2).replace('.',',') ) + ' ' + currency );
							kwh_year += kwh_month;
							costs_year += cost_month;
						});
					
						$('.level4:even').addClass('even');
						$('#sensor_statistic_year_watt'+v).append( kwh_year.toFixed(2).replace('.',',') + ' kwh - ' );
						$('#sensor_statistic_year_watt'+v).append( ( costs_year.toFixed(2).replace('.',',') ) + ' ' + currency );
					});
				});
		});
}

function sensor_positions( data, sensor ){
	$('#positions'+sensor).remove();
	container_get('#menu'+ sensor, 'positions'+sensor,'positions');
	$.each( data, function(d){
		button_get('#positions'+sensor,'sensor_position'+sensor,data[d].description);
	});
}

function sensor_data_selection( sensor ){
	$('#date'+ sensor).remove();
	// choose day
	container_get('#menu'+sensor,'date'+sensor,'Sensor details');
	$('#date'+ sensor).append( '<button id="reload'+sensor+'" class="date button">refresh</button><br />' );
	
	//if(sensor<10){
		$('#date'+ sensor).append( '<input id="date_picker'+sensor+'" class="date button" value="choose day"/>' );

		$('#date_picker'+sensor).datepicker({
			maxDate: '+0D',
			showButtonPanel : true,
			onSelect: function(dateText, inst) {
				sensor_data_selected( inst, sensor, inst.selectedDay+'-'+inst.selectedMonth+'-'+inst.selectedYear+' Kwh' );
				$('.ui-datepicker-inline').hide();
		 	}
		});

		var datepicker_from = 'date_picker_from'+sensor;
		var datepicker_to = 'date_picker_to'+sensor;	
		$('#date'+ sensor).append( '<br /><input id="'+datepicker_from+'" class="date dateselect button" value="day from" /><input id="'+datepicker_to+'" class="date dateselect button" value="day to" />' );

		$('.dateselect').datepicker({
			maxDate: '+0D',
			showButtonPanel : true,
			onSelect: function() {
				var from_str = $('#'+datepicker_from).val();
				var to_str = $('#'+datepicker_to).val();
				if( from_str !== 'day from' && to_str !== 'day to'){
						var from = from_str.split('/');
						var to = to_str.split('/');
						var data = {
							'range_to' : to[2]+'-'+to[0]+'-'+to[1]+'_0',
							'range_from' : from[2]+'-'+from[0]+'-'+from[1]+'_0',
							'day_range' : true
							}
						sensor_data_selected( data, sensor, from[2]+'-'+from[0]+'-'+from[1]+' - '+to[2]+'-'+to[0]+'-'+to[1]+' Kwh' );
					};
		 	}
		});
		$('#date'+ sensor).append( '<br /><button id="select_output_'+sensor+'" class="button"><span id="w'+sensor+'" class="active_element">Watt</span> / <span id="t'+sensor+'">Temperature</span></button><input type="hidden" class="current_display" id="show'+sensor+'" value="w" />' );
		$('#date'+ sensor).append( '<input type="hidden" class="current_display" id="show'+sensor+'" value="w" />' );
		
		$('#select_output_'+sensor).toggle(
				function() {
				$('#show'+sensor).val('t');
				$('#t'+sensor).addClass('active_element');
				$('#w'+sensor).removeClass('active_element');
				$('#'+ datepicker_from).fadeOut('slow');
				$('#'+ datepicker_to).fadeOut('slow');
				$('#reload'+sensor).fadeOut('slow');
			}, function() {
				$('#show'+sensor).val('w');
				$('#w'+sensor).addClass('active_element');
				$('#t'+sensor).removeClass('active_element');
				$('#'+ datepicker_from).fadeIn('slow');
				$('#'+ datepicker_to).fadeIn('slow');
				$('#reload'+sensor).fadeIn('slow');
			});
	//}
	
	$('#reload'+sensor).click( function(){ sensor_detail(sensor) } );
	$(".button").button();
}

function sensor_data_selected( data, sensor, info ){
	var unit_value = $('#show'+sensor).val() === 't' ? '24' : '2';
	var unit = 'HOUR';
	var table = $('#show'+sensor).val() === 't' ? 'measure_tmpr' : 'measure_watt';
	var timeframe = 'static';
	var select = 'time';
	var xaxis = 'time';
	var lines = true;
	var points = false;
	var bars = false;
	var range_from = false;
	var range_to = false;
	var hoverable = false;
	var clickable = false;
	var selection = 'x';
	var query = false;
	var options = false;
	var info = info !== undefined ? info : 'Watt last 2 hours';

	if(data.selectedDay){
		var unit = 'DAY';
		var month = data.selectedMonth + 1;
		var select = data.selectedYear + '-' + month + '-' + data.selectedDay;
		if($('#show'+sensor).val() === 't'){
			var table = 'measure_tmpr_hourly';
			var unit_value = '1';
			var info = select+' C hourly';
		}else{
			var table = 'measure_watt_hourly';
			var info = select+' W 2 hourly';
		}
		var timeframe = 'select';
		var clickable = true;
		var hoverable = true;
		var points = true;	
		
	}else if(data.day_range){
		var unit = 'DAY';
		var timeframe = 'range';
		var clickable = true;
		var hoverable = true;
		var points = true;
		var range_from = data.range_from;
		var range_to = data.range_to;
		
		if($('#show'+sensor).val() === 't'){
			var table = 'measure_tmpr_hourly';
			var unit_value = '1';	
			var info = select+' C hourly';
		}else{
			var table = 'measure_watt_daily';
		}
	}else if(data.range_from){
		var timeframe = $('#show'+sensor).val() === 't' ? 'static' : 'range';
		var range_from = data.range_from;
		var range_to = data.range_to;
	}

	var query = {
		"do" : "summary_sensor",
		"sensor" : sensor,
		"timeframe" : timeframe,
		"unit" : unit,
		"unit_return" : "timeframe",
		"unit_value" : unit_value,
		"table" : table,
		"select" : select,
		"range_from" : range_from,
		"range_to" : range_to
	}
	
	var options = {
        xaxis: { mode: xaxis },
        selection: { mode: selection },
        lines: { show: lines, lineWidth: 0.5, fill: true, fillColor: "rgba(255, 255, 255, 0.7)" },
        points: { show: points, radius: 2 },
        select : select,
        grid: { hoverable: hoverable,
            	clickable: clickable,
            	backgroundColor: { colors: ["#fff", "#888"] } }
	};
	graph_draw(sensor,query,options, info);
	$('#placeholder'+sensor).unbind();
}

function sensor_detail(data){
	$.getJSON('php/measureit_functions.php', { 'do' : 'sensor_detail', 'sensor' : data }, function(d){
		if(  d === null ){ return true; }
		sensor_data_selected(false, data);
		sensor_statistic( d.sensor[data].positions, data );
		sensor_data_selection( data, 'last 2 hour watt' );
	});
};

function graph_draw(sensor, query, options, info){
	$('.tooltip').remove();
	$('#switch-placeholder'+sensor).remove();
	$('.sensor_legend').empty();
	$('#overview'+sensor).css('display','inline');
	$.getJSON('php/measureit_functions.php', query, function(d) {
				var plot = false;
	    		var placeholder = '#placeholder'+sensor;
			    var timeline = '#overview'+sensor;
			    var overview = '#overview'+sensor;
			    $(placeholder).empty();
			    $(timeline).empty();
			    var plot = $.plot($(placeholder), [d], options);
			    var overview = $.plot($(timeline), [d], {
			        series: {
			            lines: { show: true, lineWidth: 1, steps: true },
			            shadowSize: 0
			        },
			        xaxis: { ticks: [], mode: "time" },
			        yaxis: { ticks: [], min: 0, autoscaleMargin: 0.1 },
			        selection: { mode: "x" },
			        legend: { show: true, position: 'no' },
			        grid: { hoverable: true, clickable: true }
			    });

			    $(placeholder).bind("plothover", function (e, pos, item) {
			        $("#x").text(pos.x.toFixed(2));
			        $("#y").text(pos.y.toFixed(2));
			            if (item) {
		                    $("#tooltip"+sensor).remove();
		                    var x = item.datapoint[0].toFixed(2),
		                        y = item.datapoint[1].toFixed(2);
		                    showTooltip(item.pageX, item.pageY, y, sensor);
			            }
			    });

			    date_switch_generate(sensor, query, options);
			    
			    if( $('#show'+sensor).val() !== 't' ){
				    	$(placeholder).bind("plotclick", function (e, pos, item) {
					        if (item) {
								$("#tooltip"+sensor).remove();
								if(options.select !== 'time'){
					        		var d = new Date(item.datapoint[0]);
						        	var hour_from = d.getHours()-2;
						        	var hour_to = d.getHours()-1;
									var dat = {
											"range_from" : options.select+'_'+hour_from,
											"range_to" : options.select+'_'+hour_to
										}
									var info = options.select+' '+hour_from+'-'+hour_to;
								}else if(options.select === 'time'){
					        		var d = new Date(item.datapoint[0]);
									var dat = {
											"selectedDay" : d.getDate(),
											"selectedMonth" : d.getMonth(),
											"selectedYear" : d.getFullYear()
										}
								}
								sensor_data_selected( dat, sensor, info );
								$(placeholder).unbind();
					        }
					    });
				    }
			    
			    $(placeholder).bind("plotselected", function (event, ranges) {
			        plot = $.plot($(placeholder), [d],
			                      $.extend(true, {}, options, {
			                          xaxis: { min: ranges.xaxis.from, max: ranges.xaxis.to }
			                      }));
			        overview.setSelection(ranges, true);
			    });
			    
			    $(timeline).bind("plotselected", function (event, ranges) {
			        plot.setSelection(ranges);
			    });

			    infobox(placeholder, info);
		});
}

function graph_draw_comparison( d, sensor){
	$('#placeholder'+sensor).empty();
	$('.sensor_legend').empty();
	$('#overview'+sensor).empty();
	$('.tooltip').remove();
	div_get('#placeholder'+sensor,'sensor_comparison'+sensor,'');
	div_get('#tabs-'+sensor,'sensor_comparison_legend'+sensor,'','sensor_legend');
	div_get('#sensor_comparison_legend'+sensor,'container-legend','','legend-container float_left');
	div_get('#sensor_comparison_legend'+sensor,'container-selection','','selection-container float_left');
	
	var dataset = [];
	var cnt = 1;
	var label = '';
	
	console.log(d);
}

function graph_draw_multiple( d, sensor, range, exclude){
	$('#placeholder'+sensor).unbind();
	$('.sensor_legend').empty();
	$('#overview'+sensor).empty();
	$('.tooltip').remove();
	div_get('#placeholder'+sensor,'sensor_usage'+sensor,'');
	div_get('#tabs-'+sensor,'sensor_legend'+sensor,'','sensor_legend');
	div_get('#sensor_legend'+sensor,'container-legend','','legend-container float_left');
	div_get('#sensor_legend'+sensor,'container-selection','','selection-container float_left');
	
	var dataset = [];
	var cnt = 1;
	var label = '';
	
	$.each(d, function(dat){
		var label = range == 'week' ? day_get(dat) : month_get(dat);
		var tmp = [];
		div_get('#container-selection','container-'+dat,'','check-container float_left');
		checkbox_get('#container-'+dat,dat,'displaythis',dat+' sensor_legend',dat,1);
		$('#container-'+dat).append(dat+' '+label);
		$.each( d[dat], function( set ){
			tmp.push([parseFloat(set), parseFloat(d[dat][set].data)]);
		});
		var day = {
            label: dat+' '+label,
            id: dat,
            data: tmp,
            yaxes: cnt
        };
		dataset.push(day);
		cnt++;
	});

	$("#placeholder"+sensor).bind("plothover", function (e, pos, item, sensor) {
        $("#x").text(pos.x.toFixed(2));
        $("#y").text(pos.y.toFixed(2));
            if (item) {
            	var description = dataset.length == 8 ? item.series.label+'<br />'+item.datapoint[0]+':00 ' : item.series.label+' day: '+item.datapoint[0]+'<br />';
                $("#tooltip"+sensor).remove();
                var x = item.datapoint[0].toFixed(2),
                    y = item.datapoint[1].toFixed(2);
                showTooltip(item.pageX, item.pageY, description+' '+y+' kwh', sensor);
            }
    });
	$.plot($("#placeholder"+sensor), dataset, {
        selection: { mode: "x" },
        grid: { hoverable: true },
        lines: { show: true, lineWidth: 1 },
        points: { show: true, radius: 2 },
        legend: { show: true, container: $('#container-legend') }
    });
	
	$('#tabs').css('height','100%');
	
	$('.check-container').find('input.sensor_legend').click(function(){
		$('.tooltip').remove();
		var selection = [];
		var dataset = [];
		var cnt = 1;
		$('.check-container').find('input:checked').each(function(){ 
			selection.push($(this)[0].id);
		});
			
		$.each(d, function(dat){
			if( $.inArray(dat, selection) != -1 ){
				var label = range == 'week' ? day_get(dat) : month_get(dat);
				var tmp = [];
				$.each( d[dat], function( set ){
					tmp.push([parseFloat(set), parseFloat(d[dat][set].data)]);
				});
				var day = {
		            label: dat+' '+label,
		            id: dat,
		            data: tmp,
		            yaxes: cnt
		        };
				dataset.push(day);
				cnt++;
			}
			
		});
		
		$("#placeholder"+sensor).bind("plothover", function (e, pos, item, sensor, range) {
	        $("#x").text(pos.x.toFixed(2));
	        $("#y").text(pos.y.toFixed(2));
	            if (item) {
	            	var description = dataset.length == 8 ? item.series.label+'<br />'+item.datapoint[0]+':00 ' : item.series.label+' day: '+item.datapoint[0]+'<br />';
	                $("#tooltip"+sensor).remove();
	                var x = item.datapoint[0].toFixed(2),
	                    y = item.datapoint[1].toFixed(2);
	                showTooltip(item.pageX, item.pageY, description+' '+y+' kwh', sensor);
	            }
	    });
		$.plot($("#placeholder"+sensor), dataset, {
	        selection: { mode: "x" },
	        grid: { hoverable: true },
	        lines: { show: true, lineWidth: 1 },
	        points: { show: true, radius: 2 },
	        legend: { show: true, container: $('#container-legend') }
	    });
	});
}

function sensor_history_get( sensor, range ){
	var days = range == 'week' ? 8 : 365;
	var table = range == 'week' ? 'measure_watt_hourly' : 'measure_watt_daily';
	var arrange = range == 'week' ? false : 'month';
	var call = range == 'week' ? 'sensor_history_week' : 'sensor_history_year';
	$.getJSON('php/measureit_functions.php', {
		"do" : call,
		"sensor" : sensor,
		"timeframe" : 'static',
		"unit" : 'day',
		"unit_return" : "timeframe",
		"unit_value" : days,
		"table" : table,
		'arrange' : arrange
	}, function( d ) {
		graph_draw_multiple( d, sensor, range );
	});	
}

function sensor_prices_set( sensor ){
	sensor_settings_detail_clean();
	container_get('#adminmenu','sensor_prices_container','Prices', 'sensor_settings_prices sensor_settings_detail');
	button_get('#sensor_prices_container', 'sensor_price_date_add','Add new price','button');
	$('#sensor_price_date_add').click(function(){ sensor_price_date_add(sensor) });
	
	$.getJSON('php/measureit_functions.php', {
		"do" : 'sensor_prices_get',
		"sensor" : sensor
	}, function( d ) {
		$.each(d, function(date){
			div_get('#sensor_prices_container', 'sensor_price_date'+date,'Price since: '+date,'padding10 margin10 ui-widget-content ui-corner-all sensor_price_date title');
			$('#sensor_price_date'+date).append( '<span id="sensor_price_date_toggle'+date+'" class="ui-icon ui-icon-arrowthick-2-n-s sensor_price_date_toggler"></span>' );
			input_get('#sensor_price_date'+date,'sensor_price_date_value'+date,'','hidden');
			
			div_get('#sensor_price_date'+date, 'sensor_price_date_container'+date,'','hidden');
			$.each(d[date], function(pos){
				hours = hours_get();
				div_get('#sensor_price_date_container'+date, 'sensor_price_date_container'+date+pos,'');
				button_get('#sensor_price_date_container'+date+pos, 'sensor_price_date'+date+'from'+pos,hours[this.costs_from]+' - '+hours[this.costs_to]+'<br />Price: '+this.costs_price+'<br />','price_time_range');
				var costs_id = this.costs_id;
				button_get('#sensor_price_date_container'+date+pos, 'sensor_price_date'+date+'del'+pos, 'Delete time range', '');
				$('#sensor_price_date'+date+'del'+pos).click(function(){
					$('#sensor_price_date_container'+date+pos).remove();
					$.getJSON('php/measureit_functions.php', { "do" : 'sensor_price_delete', "id" : costs_id });
				});
			});
			button_get('#sensor_price_date_container'+date, 'sensor_price_date_range_add'+date,'Add time range','sensor_prices_container_admin price_time_range');
			$('#sensor_price_date_range_add'+date).click(function(){ sensor_price_range_add(date,sensor); });
			button_get('#sensor_price_date_container'+date, 'sensor_price_date_del'+date,'Delete date','sensor_prices_container_admin');
			$('#sensor_price_date_del'+date).click(function(){
				$('#sensor_price_date'+date).remove();
				$.getJSON('php/measureit_functions.php', { "do" : 'sensor_prices_delete', "date" : date });
			});
			$('#sensor_price_date_toggle'+date).toggle(
					function(){$('#sensor_price_date_container'+date).fadeIn('slow');},
					function(){$('#sensor_price_date_container'+date).fadeOut('slow');}
				);
		});
	});
}

function sensor_price_date_add(sensor){
		var d = new Date(); 
		// js is broken by design... 
		var m = d.getMonth() + 1;
		var day = d.getDate();
		m = m < 10 ? '0'+m : 0;
		day = day < 10 ? '0'+day : 0;
		var date = d.getFullYear()+'-'+m+'-'+day;
		
		$('.sensor_price_date').remove();
		div_get('#sensor_prices_container', 'sensor_price_date_container'+date,'','sensor_price_date_container');
		div_get('#sensor_price_date_container'+date, 'sensor_price_date','','padding10 margin10 ui-widget-content ui-corner-all sensor_price_date');
		$('#sensor_price_date').append( '<input id="datepicker" class="date dateselect sensor_price_dateselect pointer" value="Price since: '+date+'" />' );
		input_get('#sensor_price_date','sensor_price_date_value',date,'hidden');
		$('.dateselect').datepicker({
			maxDate: '+0D',
			showButtonPanel : true,
			onSelect: function() {
				var from_str = $('#datepicker').val();
				var from = from_str.split('/');
				$('#sensor_price_date_value').attr('value', from[2]+'-'+from[0]+'-'+from[1]);
				$('#datepicker').val('Price since: '+from[2]+'-'+from[0]+'-'+from[1]);
				sensor_price_range_add('',sensor);
		 	}
		});
		sensor_price_range_add('',sensor);
}

function sensor_price_range_add(date,sensor){
	prcontainer = '#sensor_price_date_container'+date;
	
	if(date == ''){
		prcontainer = '.sensor_price_date_container';
		var date = $('#sensor_price_date_value').val();
	}
	
	$('#sensor_price_range_add').remove();
	div_get(prcontainer, 'sensor_price_range_add','');
	div_get('#sensor_price_range_add', 'sensor_price_datefrom','');
	hour_dropdown_get(hours_get(), 'sensor_price_datefrom');
	div_get('#sensor_price_range_add', 'sensor_price_dateto','');
	hour_dropdown_get(hours_get(), 'sensor_price_dateto');
	div_get('#sensor_price_range_add', 'sensor_price_datecosts','<br /><br />Price: ');
	input_get('#sensor_price_datecosts', 'sensor_price_datecosts_input');
	button_get('#sensor_price_range_add', 'sensor_price_date_range_add','Save','sensor_prices_container_admin');
	$('#sensor_price_date_range_add').click(function(){
		sensor_price_add(date,sensor);
	});
	
}

function sensor_price_add(date,sensor){
	var p = $('#sensor_price_datecosts_input').val();
	var f = $('#sensor_price_datefrom :selected').val();
	var t = $('#sensor_price_dateto :selected').val();
	if( p == '') return false;

	$.getJSON('php/measureit_functions.php', {
		'do' : 'sensor_price_add',
		'sensor' : sensor,
		'from' : f,
		'to' : t,
		'price' : p,
		'date' : date
	}, function() {
		sensor_prices_set( sensor );
	});
}

function showTooltip(x, y, contents, sensor ) {
	$('.tooltip').remove();
	$('<div class="tooltip">' + contents + '</div>').css( {
		position: 'absolute',
		display: 'none',
		top: y + 5,
		left: x + 5,
		border: '1px solid #fdd',
		padding: '2px',
		'background-color': '#fee',
		opacity: 0.80
	}).appendTo("body").fadeIn(200);
}

function infobox(placeholder, info){
	$(placeholder).append('<div id="infobox" class="ui-widget-content ui-corner-all" style="display: none;">'+info+'</div>');
	$("#infobox").show('clip',{},100,function(){
		setTimeout(function(){ 
			$("#infobox:visible").removeAttr('style').hide().fadeOut(); 
			}, 3000);
		});
};

function date_switch_generate( sensor, query, options ){
	if(query.table != 'measure_watt') return true;
	div_get('#placeholder'+sensor, 'switch-placeholder'+sensor, '', 'switch-link-container');
	div_get('#switch-placeholder'+sensor, 'switch-link-left'+sensor, '<div id="switch-link-left'+sensor+'" />', 'switch-link switch-link-left float_left');
	div_get('#switch-placeholder'+sensor, 'switch-link-right'+sensor, '<div id="switch-link-right'+sensor+'" />', 'switch-link switch-link-right float_right');
	
	
	$('#switch-link-left'+sensor).click(function(){
		query.unit_value = query.table == 'measure_watt_daily' ? parseFloat(query.unit_value) +12 : parseFloat(query.unit_value) +2;
		graph_draw(sensor, query, options, 'Watt last '+query.unit_value+' hours');
	});
	
	if( query.unit_value == 2 ){
		$('#switch-link-right'+sensor).css('visibility','hidden');
	}else{
		$('#switch-link-right'+sensor).click(function(){
			query.unit_value = query.table == 'measure_watt_daily' ? parseFloat(query.unit_value) -12 : parseFloat(query.unit_value) -2;
			graph_draw(sensor, query, options, 'Watt last '+query.unit_value+' hours');
		});
	}
}

function price_format( d,u ){
	return d + ' ' + c;
}

function div_empty_get(parent,id,css){
	$(parent).append('<div id="'+id+'" class="'+css+'" />');
}

function div_get(parent,id,value,css){
	$(parent).append('<div id="'+id+'" class="'+css+'">'+value+'</div>');
}

function input_get(parent,id,value,css){
	var css = typeof(css) != 'undefined' ? css : '';
	var value = typeof(value) != 'undefined' ? value : '';
	$(parent).append( '<input id="'+id+'" class="input '+css+'" value="'+value+'" />');
}

function input_get_button(parent,id,value,css){
	var css = typeof(css) != 'undefined' ? css : '';
	var value = typeof(value) != 'undefined' ? value : '';
	$(parent).append( '<input id="'+id+'" class="date dateselect button '+css+'" value="'+value+'" />');
	$("button, input:submit, a", ".button").button();
}
function span_get(id,value,css){
	return '<span id="'+id+'" class="'+css+'">'+value+'</span>';
}

function button_get(parent,id,title,css,value){
	var css = typeof(css) != 'undefined' ? css : '';
	$(parent).append( '<button id="'+id+'" class="button '+css+'" value="'+value+'">'+title+'</button>' );
	$("button, input:submit, a", ".button").button();
}

function checkbox_get(parent,id,name,css,value,checked){
	var css = typeof(css) != 'undefined' ? css : '';
	var checked = checked == 1 ? ' checked="checked"' : '';
	$(parent).append( '<input id="'+id+'" class="checkbox '+css+'" type="checkbox" name="'+name+'" value="'+value+'"'+checked+'>' );
	$("button, input:submit, a", ".button").button();
}

function container_get(parent,id,title,css){
	var css = typeof(css) != 'undefined' ? css : '';
	$(parent).append('<div id="'+id+'" class="ui-widget-content ui-corner-all sensor-inner '+css+'"><div class="title"><h5 class="ui-widget-header ui-corner-all inner">'+title+'</h5></div>');
}

function day_get(date){
	var d=new Date(date);
	var weekday=new Array(7);
	weekday[0]="Sunday";
	weekday[1]="Monday";
	weekday[2]="Tuesday";
	weekday[3]="Wednesday";
	weekday[4]="Thursday";
	weekday[5]="Friday";
	weekday[6]="Saturday";
	return weekday[d.getDay()];
}

function month_get(date){
	var d=new Date(date);
	var month=new Array(12);
	month[0]="January";
	month[1]="February";
	month[2]="March";
	month[3]="April";
	month[4]="May";
	month[5]="June";
	month[6]="July";
	month[7]="August";
	month[8]="September";
	month[9]="October";
	month[10]="November";
	month[11]="December";
	return month[d.getMonth()];
}

function hours_get(){
	var hours=new Array(24);
	var time = timeofday = '';
	var i = ii = 0;
	for(i=0;i<24;i++){
		// some countries does realy have weired settings ... :)
		ii = ii == 13 ? 1 : ii;
		timeofday = i<13 ? ii+' am' : ii+' pm';
		ii++;
		
		time = i<10 ? '0'+i : i;
		hours[i] = time+':00 / '+timeofday;
	}
	return hours;
}

function hour_dropdown_get(hours, parent, selected_hour){
	selected_hour = selected_hour == undefined ? 0 : selected_hour;
	$('#'+parent).append('<select name="'+parent+'" id="select'+parent+'">');
	$.each(hours, function(hour){
		selected = hour == selected_hour ? ' selected = "selected"' : '';
		$('#select'+parent).append('<option value="'+hour+'"'+selected+'>'+hours[hour]+'</option>');
	});
}

function hour_get_formatted( hour ){
	hours = hours_get();
	return hours[hour];
}

function iphone_navigation_main( data ) {
	$('#tabcontainer li').remove();
	$.each( data, function(d){
		$('#tabcontainer').append('<li class="edgetoedge" value="'+data[d].sensor.sensor_id+'"><a href="#page'+data[d].sensor.sensor_id + '" name="'+data[d].sensor.sensor_id+'" class="slideleft'+data[d].sensor.sensor_id+'">' + data[d].sensor.position_description + '</a></li>');
		//$('#contentconatainer').append('');
		$('#jqt').append('<div id="page'+data[d].sensor.sensor_id+'" class="info"><div class="toolbar"><a href="#" class="back">back</a><h1>' + data[d].sensor.position_description + '</h1></div>');
		$('#page'+data[d].sensor.sensor_id).append('<div class="info">The title for this page was automatically set from it&#8217;s referring link, no extra scripts required. Just include the extension and this happens.</div></div>');
		});
	$('#tabcontainer').append('<li class="edgetoedge" value="11"><a href="#tabs-11" name="11">Setup</a></li>');
	$('#home').addClass('current');
	
}


function measureit_admin( data ){
	$('#adminmenu').remove();
	$('#tabs-1011').append('<div id="adminmenu" />');
	sensor_list(data);
}

function sensor_settings_clean(){
	$('.sensor_settings').remove();
	$('.sensor_list_settings').remove();
	$('.system_settings').remove();
}

function sensor_settings_detail_clean(){
	$('.sensor_settings_detail').remove();
}

function sensor_positions_admin( data, sensor ){
	sensor_settings_detail_clean();
	div_empty_get('#adminmenu','sensor_positions_detail'+sensor,'sensor_settings_detail');
	container_get('#sensor_positions_detail'+sensor,'positions'+sensor,'Positions');

	$.each( data[sensor].sensor.positions, function(d){
		if(data[sensor].sensor.positions[d].description != null){
			button_get('#positions'+sensor,'sensor_position_delete'+d,data[sensor].sensor.positions[d].description+'<br />'+data[sensor].sensor.positions[d].time,'sensor_position_select',d);
			}
		
	});
	button_get('#positions'+sensor, 'position_add'+sensor, 'add position');
	$('#position_add'+sensor).click(function(){
			sensor_position_add(sensor);
		});
	$('.sensor_position_select').click(function(){
		sensor_position_delete(this,sensor);
	});
}

function sensor_position_delete(item,sensor){
	$('#'+$(item).attr('id')).dialog({
		resizable: true,
		height:400,
		modal: true,
		buttons: {
			'delete this position': function() {
				$(this).dialog('close');
				$.get('php/measureit_functions.php',{ 'do' : 'sensor_position_delete', 'sensor_position_id' : $(item).attr('value') }, function(){
					sensor_settings_clean();
					sensor_settings_detail_clean();
					delete data;
					$.getJSON('php/measureit_functions.php', { 'do' : 'navigation_main' }, function(data) {
						navigation_main( data );
						measureit_admin( data );
						sensor_admin_list_items( data, sensor );
						sensor_positions_admin( data, sensor );
						hist_update('1');
						});
					});
				},
				'cancel': function() {
					$(this).dialog('close');
					$.getJSON('php/measureit_functions.php', { 'do' : 'navigation_main' }, function(data) {
						navigation_main( data );
						measureit_admin( data );
						sensor_admin_list_items( data, sensor );
						sensor_positions_admin( data, sensor );
						hist_update('1');
						});
				}
			}
	});
}

function sensor_position_add(sensor){
	sensor_settings_detail_clean();
	div_empty_get('#adminmenu','sensor_position_add'+sensor,'sensor_settings_detail');
	container_get('#sensor_position_add'+sensor,'position_add'+sensor,'add position');
	$('#position_add'+sensor).append(span_get('#position_add'+sensor,'Title','padding5')+'<br /><input type="text" id="sensor_position_name" />');
	button_get('#position_add'+sensor,'sensor_position_add_action','Add','padding5');
	$('#sensor_position_add_action').click(function(){
			if($('#sensor_position_name').val() != ''){
					$.get('php/measureit_functions.php',{ 'do' : 'sensor_position_add', 'sensor_id' : sensor, 'sensor_position_name' : $('#sensor_position_name').val() }, function(d){
						sensor_settings_clean();
						sensor_settings_detail_clean();
						delete data;
						$.getJSON('php/measureit_functions.php', { 'do' : 'navigation_main' }, function(data) {
							navigation_main( data );
							measureit_admin( data );
							sensor_admin_list_items( data, sensor );
							sensor_positions_admin( data, sensor );
							hist_update('1');
							});
						});
				}
		});
}

function sensor_list( data ){
	sensor_settings_clean();
	sensor_settings_detail_clean();
	container_get('#adminmenu','sensor_admin','Sensor');
	$.each( data, function(d){
		if(d>9){
			data[d].sensor.sensor_title = 'Sensor '+d.substr(1,1)+' clamp: '+d.substr(0,1);
		}
		button_get('#sensor_admin','sensor_admin'+d,data[d].sensor.sensor_title);
		$('#sensor_admin'+d).click(function() {
			sensor_settings_clean();
			sensor_settings_detail_clean();
			sensor_admin_list_items(data,d);
			});
	});
	button_get('#sensor_admin','sensor_add','Add Sensor');
	button_get('#sensor_admin','clamp_add','Add Clamp');
	button_get('#sensor_admin','backup','Backup / Export');
	button_get('#sensor_admin','global_settings','System settings');
	sensor_add(data);
	clamp_add(data);
	system_backup();
	
	$('#global_settings').click(function(){
		global_settings();
	});
	
}

function sensor_admin_list_items( data, sensor ){
	sensor_settings_clean();
	container_get('#adminmenu','sensor_admin_list',data[sensor].sensor.sensor_title,'sensor_list_settings');
	button_get('#sensor_admin_list','sensor_admin_positions'+sensor,'Positions');
	button_get('#sensor_admin_list','sensor_admin_settings'+sensor,'Settings');
	button_get('#sensor_admin_list','sensor_admin_prices'+sensor,'Prices');
	button_get('#sensor_admin_list','sensor_admin_sensor_delete'+sensor,'Delete');
	$('#sensor_admin_positions'+sensor).click(function(){
		sensor_positions_admin(data,sensor);
	});
	$('#sensor_admin_settings'+sensor).click(function(){
		sensor_admin_settings(data, sensor);
	});
	$('#sensor_admin_prices'+sensor).click(function(){
		sensor_prices_set(sensor);
	});
	$('#sensor_admin_sensor_delete'+sensor).click(function(){
		sensor_delete(sensor);
	});
}

function sensor_admin_settings(data, sensor){
		sensor_settings_detail_clean();
		container_get('#adminmenu','sensor_settings_container','Settings', 'sensor_settings_detail');
		div_get('#sensor_settings_container','sensor_id','difference from GMT in hours ( 2 or -2 ):','padding5');
		input_get('#sensor_settings_container','sensor_timezone_diff',data[sensor].sensor.measure_timezone_diff);
		div_get('#sensor_settings_container','sensor_id','currency (Euro/Pound/anything-you-want):','padding5');
		input_get('#sensor_settings_container','sensor_currency',data[sensor].sensor.measure_currency === undefined ? '�' : data[sensor].sensor.measure_currency);
		div_get('#sensor_settings_container','sensor_id','days keep history:','padding5 notice');
		input_get('#sensor_settings_container','sensor_history',data[sensor].sensor.measure_history === undefined ? '365' : data[sensor].sensor.measure_history);
		button_get('#sensor_settings_container','sensor_admin_settings_save'+sensor,'Save settings');
		div_get('#sensor_settings_container','sensor_settings_container_notice','You had to restart the grabbing script to activate this settings','notice_box padding5');

		$('#sensor_admin_settings_save'+sensor).click(function(){
			if($('#sensor_price').val() !== '' && $('#sensor_currency').val() !== '' && $('#sensor_history').val() !== ''){
				$.get('php/measureit_functions.php', { 
					'do' : 'sensor_settings_save',
					'sensor_id' : sensor,
					'sensor_currency' : $('#sensor_currency').val(),
					'sensor_price' : $('#sensor_price').val(),
					'sensor_timezone_diff' : $('#sensor_timezone_diff').val(),
					'sensor_history' : $('#sensor_history').val()
					}, function(sensor){
						delete data;
						$.getJSON('php/measureit_functions.php', { 'do' : 'navigation_main' }, function(data) {
							navigation_main( data );
							measureit_admin( data );
							sensor_admin_list_items( data, sensor );
							//sensor_admin_settings( data, sensor );
							hist_update('1');
							});
					});
				}
			});

}

function sensor_delete(sensor){
	sensor_settings_detail_clean();
	div_get('#main','delete_confirm','<p><span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>PLEASE NOTE: delete complete will delete all data from sensor including the positions and every stored watt and temperature data. delete entry will just remove the sensor entry and keep the data</p>');

	$("#delete_confirm").dialog({
			resizable: true,
			height:400,
			modal: true,
			buttons: {
				'delete entry': function() {
					$(this).dialog('close');
					$.get('php/measureit_functions.php', { 'do' : 'sensor_entry_delete', 'sensor_id' : sensor}, function(){
						delete data;
						$.getJSON('php/measureit_functions.php', { 'do' : 'navigation_main' }, function(data) {
							navigation_main( data );
							measureit_admin( data );
							hist_update('1');
							});
						})
				},
				'delete complete': function() {
					$(this).dialog('close');
					$.get('php/measureit_functions.php', { 'do' : 'sensor_delete', 'sensor_id' : sensor}, function(){
						delete data;
						$.getJSON('php/measureit_functions.php', { 'do' : 'navigation_main' }, function(data) {
							navigation_main( data );
							measureit_admin( data );
							hist_update('1');
							});
						})
				}
			}
		});
}

function sensor_add(data){
	$('#sensor_add').click(function(){
		sensor_settings_clean();
		sensor_settings_detail_clean();
		container_get('#adminmenu','sensor_add_container','Sensor', 'sensor_settings');
		div_get('#sensor_add_container','sensor_id',span_get('sensor_id_select_text','Sensor ID: ','float_left padding5'));
		for( i=0;i<10;i++){
				if(!data[i]){
						div_get('#sensor_id','',i,'sensor_id');
					}
			}
		$('.sensor_id').click(function(){
			$('.sensor_id').removeClass('selected');
			$(this).addClass('selected');
		});

		div_get('#sensor_add_container','sensor_title_text',span_get('sensor_title_text','Title:<br /> <input type="text" id="sensor_name" />','float_left padding5'));
		button_get('#sensor_add_container','sensor_add_action','Add','padding5');
		$('#sensor_add_action').click(function(){
				if($('#sensor_name').val() != '' && $('.selected').html() != null){
						$.get('php/measureit_functions.php',{ 'do' : 'sensor_add', 'sensor_id' : $('.selected').html(), 'sensor_name' : $('#sensor_name').val() }, function(){
							delete data;
							$.getJSON('php/measureit_functions.php', { 'do' : 'navigation_main' }, function(data) {
								navigation_main( data );
								measureit_admin( data );
								hist_update('1');
								});
							});
					}
			});
		});
}

function clamp_add(data){
	$('#clamp_add').click(function(){
		sensor_settings_clean();
		sensor_settings_detail_clean();
		container_get('#adminmenu','clamp_add_container','Clamp', 'sensor_settings');
		div_get('#clamp_add_container','sensor_id',span_get('sensor_id_select_text','Sensor: <select id="sensor_select_box" name="sensor_select_box"><option selected="selected" value="x">Please choose Sensor</option></select>','float_left padding5 block'));
		div_get('#clamp_add_container','clamp_id',span_get('sensor_id_select_text','Clamp: ','float_left padding5 block'));

		for( i=0;i<10;i++){
				if(data[i]){
					$('#sensor_select_box').append('<option value="'+i+'">'+data[i].sensor.sensor_title+'</option>');	
					}
			}
		$('.sensor_id').click(function(){
			$('.sensor_id').removeClass('selected');
			$(this).addClass('selected');
		});
		
		$('#sensor_id').change(function(){
			available_clamps_get($('#sensor_select_box').val(), data);
		});

		div_get('#clamp_add_container','sensor_title_text',span_get('sensor_title_text','Title:<br /> <input type="text" id="sensor_name" />','float_left padding5'));
		button_get('#clamp_add_container','clamp_add_action','Add','padding5');
		$('#clamp_add_action').click(function(){
			if( $('#sensor_select_box').val() != 'x' && $('#sensor_select_box').val() != 'null' && $('.clamp_selected').html() != null){
					$.get('php/measureit_functions.php',{ 'do' : 'clamp_add', 'sensor_id' : $('#sensor_select_box').val(), 'clamp_id' : $('.clamp_selected').html(), 'sensor_name' : $('#sensor_name').val() }, function(){
						delete data;
						$.getJSON('php/measureit_functions.php', { 'do' : 'navigation_main' }, function(data) {
							navigation_main( data );
							measureit_admin( data );
							hist_update('1');
							});
						});
				}
			});
		
		});
}

function available_clamps_get(sensor, data){
	$('.clamp_id').remove();
	for( i=1;i<4;i++){
		var sensor_clamp = i+sensor;
		if(!data[sensor_clamp]){
			div_get('#clamp_id','',i,'clamp_id');
		}
	}
	$('.clamp_id').click(function(){
		$('.clamp_id').removeClass('clamp_selected');
		$(this).addClass('clamp_selected');
	});
}

function system_backup(){
	$('#backup').click(function(){
		sensor_settings_clean();
		sensor_settings_detail_clean();
		container_get('#adminmenu','admin_backup_container','Database backups', 'sensor_settings center');
		div_get('#admin_backup_container','backup',span_get('sensor_id_select_text',' ','float_left padding5'));
		
		$.getJSON('php/measureit_functions.php', { 'do' : 'backup_list_get' }, function( data ){
			$.each(data, function(d){
				$('#admin_backup_container').append(span_get( data[d].file, data[d].day+' '+data[d].time+' '+data[d].size, 'padding5 button center')+span_get(data[d].time,'<a href="'+data[d].file+'" class="padding5">Download</a>  <a href="javascript: void(0);" onclick="javascript: backup_delete(\''+data[d].filename+'\')">Delete</a><hr />', 'padding5'));
			});
		});
		
		button_get('#admin_backup_container','backup_create','Create backup');
		$('#backup_create').click(function(){
			$.get('php/measureit_functions.php', { 'do' : 'backup_create' });
			div_get('#main','backup_create_dialog','Backup was startet. This can take some time dependent from your database size');
			$("#backup_create_dialog").dialog({
				resizable: true,
				height:200,
				modal: true,
				buttons: {
					'OK': function() {
						$(this).dialog('close');
						sensor_settings_clean();
						sensor_settings_detail_clean();
					}
				}
			});
		});

		
	});

}

function global_settings( ){
	sensor_settings_clean();
	sensor_settings_detail_clean();
	
	container_get('#adminmenu','admin_settings_container','System settings', 'system_settings');
	div_get('#admin_settings_container','system_settings_container','','padding5');

	button_get('#system_settings_container','sensor_admin_prices400','Prices','button');

	$('#sensor_admin_prices400').click(function(){
		sensor_prices_set(400);
	});
	
	$('#system_settings_container').append(span_get('system_settings_timezone','Use global timezone settings for all sensors instead of one setting per sensor<br />difference from GMT in hours ( 2 or -2 ):<br />',''));
	input_get('#system_settings_container','system_settings_timezone_value','');
	$('#system_settings_container').append(span_get('system_settings_cron','<br />Use global setting for data delete<br />Days to hold detail data:<br />','notice'));
	input_get('#system_settings_container','system_settings_cron_value','');
	//$('#system_settings_container').append(span_get('system_settings_hosting','<br /><br />Push data to a external hosting provider<br />http://www.domain.tld','notice'));
	//input_get('#system_settings_container','system_settings_hosting_value','');
	//$('#system_settings_container').append(span_get('system_settings_database','<br /><br />Stop local data storing (f.e. if you are using a remote provider to store the data)<br />No local data: ','notice'));
	//checkbox_get('#system_settings_container','system_settings_database_value','','','0');
	button_get('#system_settings_container','system_settings_save','Save settings');
	div_get('#admin_settings_container','system_settings_container_notice','You had to restart the grabbing script to activate this settings','notice_box padding5');
	$.getJSON('php/measureit_functions.php', { 'do' : 'global_settings_get' }, function(system_data) {
		
		if(system_data.global_timezone_use){
			$('#system_settings_timezone_value').val(system_data.global_timezone_use);
		}
		if(system_data.cron_delete_use){
			$('#system_settings_cron_value').val(system_data.cron_delete_use);
		}
		if(system_data.hosting_value_use){
			//$('#system_settings_hosting_value').val(system_data.hosting_value_use);
		}
		if(system_data.local_database_use){
			//$('#system_settings_database_value').attr('checked', true);
		}
		
		});

	$('#system_settings_save').click(function(){
		var system_settings = {};
		var system_item = false;
		if( $.isNumeric( $('#system_settings_timezone_value').val() ) ){
			system_settings['global_timezone_use'] =  $('#system_settings_timezone_value').val();
			system_item = true;
		}
		if( $.isNumeric( $('#system_settings_cron_value').val() ) ){
			system_settings['cron_delete_use'] =  $('#system_settings_cron_value').val();
			system_item = true;
		}
		if( $('#system_settings_hosting_value').val() != '' ){
			system_settings['hosting_value_use'] =  $('#system_settings_hosting_value').val();
			system_item = true;
		}
		if( $('#system_settings_database_value').attr('checked') ){
			system_settings['local_database_use'] =  0;
			system_item = true;
		}
		
		if(system_item){
			$.getJSON('php/measureit_functions.php', { 'do' : 'global_settings_set', 'data' : system_settings }, function(){});
		}
		sensor_settings_clean();
		sensor_settings_detail_clean();
		
	});
	
}

function backup_delete( file ){
	$.get('php/measureit_functions.php', { 'do' : 'backup_delete', 'filename' : file });
	sensor_settings_clean();
	sensor_settings_detail_clean();
}


