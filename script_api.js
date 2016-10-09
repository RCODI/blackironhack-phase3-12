var QuickDataTool = (function () {
    var quickDataTool = {};

    quickDataTool.ViewModel = function() {
        var self = this,
			now = new Date();
		now.setDate(now.getDate()-15);

        /* public fields */
		//	App status / messages
		self.errorMessages = ko.observableArray([]);
		self.loading = ko.observable(false);
		self.firstLoad = ko.observable(true);
		self.settingsOpen = ko.observable(false);
		self.infowindowOpen = ko.observable(false);
		self.datepickerOpen = ko.observable(false);

		// Available datasets
		//todo: flush out idea of multiple datasets
		//		* Have datatypes array
		//		* Ex: [{id:'TMIN', unit:'TEMP'}, ...]
		//		* Available Units array
		//		* Ex: [{id:'TEMP', options:['C', 'F']}, ...]
		//		* SelectedUnitId observable for each avaibale unit
		//		* Ex: self['selected'+unit.id]()
		//		* ScaleValue function (datatype, value)
		self.availableDatasets = [{id:'GHCND', product:'GHCND_DAILY_FORM'}];
		self.availableDatatypes = ['PRCP','SNOW','TMAX','TMIN','TAVG'];
		self.availableUnits = [{id:'TEMP', options:['C','F']}, {id:'PRCP', options:['mm','in']}];

		// Selected values
		self.selectedInfowindow = ko.observable();
		self.selectedStation = ko.observable();
		self.selectedMarker = ko.observable();
		self.selectedData = ko.observableArray([]);
		self.selectedDate = ko.observable(now.toISOString().substring(0,10));
		self.selectedDataset = ko.observable(self.availableDatasets[0]);
		self.selectedTEMP = ko.observable('C');
		self.selectedPRCP = ko.observable('mm');

		// Map variables
		self.results = ko.observableArray([]);
		self.markers = ko.observableArray([]);
		self.extent = ko.observable();

		// Misc config
		self.resultsLimit = ko.observable(25);
		self.resultsOffset = ko.observable(1);
		self.dataSet = ko.observable('GHCND');
		self.maxDate = ko.observable();

		// Date-at-a-glance computables
		self.getYear = ko.pureComputed(function() {
           var year;
            if (self.selectedDate()) {
                year = self.selectedDate().substring(0,4);
            } else {
                year = now.getFullYear();
            }
            return year;
        });

		self.getMonth = ko.pureComputed(function() {
            var month;
            if (self.selectedDate()) {
                month = Number(self.selectedDate().substring(5,7));
            } else {
                month = now.getMonth() + 1;
            }
            return monthNames[month-1];
        });

		self.getDay = ko.pureComputed(function() {
           var day;
            if (self.selectedDate()) {
                day = Number(self.selectedDate().substring(8,10));
            } else {
                day = now.getDate() - 5;
            }
            return day;
        });


        /* private fields */
        var monthNames = ["JAN","FEB","MAR","APR","MAY","JUN","JLY","AUG","SEP","OCT","NOV","DEC"],
			datepicker = $('#datepicker').datepicker({
				dateFormat: 'yy-mm-dd',
				altField: "#selectedDate",
				changeMonth: true,
				changeYear: true,
				showButtonPanel: true,
				onSelect: function(dateText) {
					self.selectedDate(dateText);
					self.datepickerOpen(false);
				}
			}).datepicker( "setDate", self.selectedDate() ),
			map,
			autocomplete,
			cdoToken = 'IdNEXjwZWEjvmkHMrRgJLNfxijCdyzFC',
			cdoApi = {
				base: 'http://www.ncdc.noaa.gov/cdo-web/api/v2',
				stations: '/stations',
				datasets: '/datasets',
				data: '/data'
			},
			cdoRequest;


        /* public methods */
		self.setSelectedTEMP = function(value) {
			self.selectedTEMP(value);
		};

		self.setSelectedPRCP = function(value) {
			self.selectedPRCP(value);
		};

		self.showDatepicker = function() {
            self.datepickerOpen(true);
        };

		self.toggleDatepicker = function(data, event) {
			// If click came from datepicker, do not toggle
			//		TODO: This is a poor solution, find a better one
			if (event.target.className.indexOf('datepicker') == -1
				&& event.target.className.indexOf('ui-icon-circle-triangle') == -1) {
				self.datepickerOpen(!self.datepickerOpen());
			}
		};

		self.toggleSettings = function() {
			self.settingsOpen(!self.settingsOpen());
		};

		self.composeQuickDataUrl = function(station) {
			// "/cdo-web/quickdatapdf/GHCND:USC00168941_2005-8-1.pdf?datasetId=GHCND&amp;productId=GHCN_DAILY_FORM&amp;stationId=GHCND:USC00168941&amp;year=2005&amp;month=8&amp;day=1"
			var base = "http://www.ncdc.noaa.gov/cdo-web/quickdatapdf/",
				pdfname = station.id + "_" + self.selectedDate() + '.pdf',
				dataset = "datasetId=" + self.dataSet(),
				product = "productId=GHCN_DAILY_FORM",
				station = "stationId=" + station.id,
				year = "year=" + self.selectedDate().substring(0,4),
				month = "month=" + self.selectedDate().substring(5,7),
				day = "day=" + self.selectedDate().substring(8,10);

			return base + pdfname + '?' + [dataset, product, station, year, month, day].join('&');
		};

        /* private methods */
		var scaleValue = function(result) {
			var datum = {
				name: result.datatype,
				value: Number(result.value)
			};

			//TEMP value
			if (['TMAX','TMIN','TAVG'].indexOf(datum.name) != -1) {
				//scale value, set unit
				datum.value = datum.value/10;
				datum.units = "(C)";
					if (self.selectedTEMP() == 'F') {
						//Convert from c to f
						datum.value = datum.value * (9/5) + 32;
						datum.units = "(F)";
					}
				datum.value = Math.round(datum.value * 100) / 100
				return datum;
			} else {
				datum.units = "(mm)";
				//scale prcp value, leave snow alone
				if (datum.name == 'PRCP') {
					datum.value = datum.value/10;
				}
				if (self.selectedPRCP() == 'in') {
					datum.value = datum.value * 0.039370;
					datum.units = "(in)";
				}
				datum.value = Math.round(datum.value * 100) / 100
				return datum;
			}
		};

		var composeStationsUrl = function() {
			var url = cdoApi.base + cdoApi.stations,
				parameters = [
					'datasetid=' + self.dataSet(),
					'extent=' + self.extent(),
					'startdate=' + self.selectedDate() + 'T00:00:00',
					'enddate=' + self.selectedDate() + 'T23:59:59',
					'sortfield=name',
					'limit=' + self.resultsLimit(),
					'offset=' + self.resultsOffset(),
					'includemetadata=false'
				];
			return url + '?' + parameters.join("&");
		}

		var composeDataUrl = function(station) {
			var url = cdoApi.base + cdoApi.data,
				parameters = [
					'datasetid=' + self.dataSet(),
					'stationid=' + station.id,
					'startdate=' + self.selectedDate() + 'T00:00:00',
					'enddate=' + self.selectedDate() + 'T23:59:59',
					'datatypeid=PRCP',
					'datatypeid=SNOW',
					'datatypeid=TMAX',
					'datatypeid=TMIN',
					'datatypeid=TAVG',
					'includemetadata=false'
				];
			return url + '?' + parameters.join("&");
		};

		var clearMarkers = function() {
			if (self.markers()) {
				self.markers().forEach(function(marker) {
					if (marker.setMap) {
						marker.setMap(null);
					} else {
						console.log("this marker is broken " + typeof marker);
						console.log(marker);
					}
				});
			}
		};

		var safelyCloseInfowindow = function(node) {
			//http://stackoverflow.com/a/25274909
			//google maps will destroy this node and knockout will stop updating it
			//add it back to the body so knockout will take care of it
			$("body").append(node);

			self.infowindowOpen(false);
			if (self.selectedMarker()) {
				self.markers.push(self.selectedMarker());
				self.selectedMarker(false);
			}
			self.selectedInfowindow().close();
		};

		var getStations = function() {
			if (!self.firstLoad()) {
				self.loading(true);
				clearMarkers();
				self.extent(map.getBounds().toUrlValue());
				if (cdoRequest) {cdoRequest.abort();}

				cdoRequest = $.ajax({
					url:composeStationsUrl(),
					headers: {
						token: cdoToken
					}
				}).done(function(response) {
					self.results(response.results);
				}).fail(function() {
					console.log("stations failed!");
				}).always(function() {
					self.loading(false);
				});
			} else {
				self.firstLoad(false);
			}
		};

		var getData = function(station) {
			self.loading(true);
			$.ajax({
				url:composeDataUrl(station),
				headers: {
					token: cdoToken
				}
			}).done(function(response) {
				var data = [];
				if (Object.getOwnPropertyNames(response).length > 0) {
					response.results.forEach(function(result) {
						data.push(scaleValue(result));
					});
				} else {
					data.push({name:'Sorry,', value:' no data', units:' :('});
				}
				self.selectedData(data);
			}).fail(function() {
				console.log("data failed!");
			}).always(function() {
				self.loading(false);
			});
		};

		var handleMarkerClick = function(marker, result) {
			// Close current info window if any
			if (self.selectedInfowindow()) {
				self.selectedInfowindow().setContent($("#infowindow-closing").html());
			}

			// Remove marker so that when we clear markers, this one stays
			self.selectedMarker(self.markers.remove(marker)[0]);
			self.selectedStation(result);
			var $node = $('#infowindow');
			var infowindow = new google.maps.InfoWindow({
				content: $node[0]
			});

			// Clear data and get new data
			self.selectedData([]);
			getData(result);

			infowindow.open(map,marker);
			self.infowindowOpen(true);
			self.selectedInfowindow(infowindow);

			google.maps.event.addListener(infowindow, "closeclick", function () {
				safelyCloseInfowindow($node);
			});

			google.maps.event.addListener(infowindow, "content_changed", function () {
				// Because there is no closed event for info window, I'm setting the
				// content and hooking into that event here.
				safelyCloseInfowindow($node);
			});
		};

		var fetchMaxDate = function() {
			var url = cdoApi.base + cdoApi.datasets + "/" + self.dataSet();
			$.ajax({
				'url':url,
				headers: {
					token: cdoToken
				}
			}).done(function(response) {
				var currentdate = self.selectedDate().split('-').join(''),
					maxdate = response.maxdate.substring(0,10).split('-').join('');
				self.maxDate(response.maxdate.substring(0,10));
				datepicker.datepicker( "option", "maxDate", response.maxdate );

				/* if (currentdate > maxdate) {
					currentdate = new Date(Date.UTC(self.maxDate()));
					currentdate.setUTCDate(currentdate.getUTCDate() -5);
					datepicker.datepicker( "setDate", currentdate );
					self.selectedDate(currentdate.toISOString().substring(0,10));
				}	 */
			}).fail(function(response) {
				console.log("fetchMaxDate has failed");
			}).always(function() {

			});
		}

        /* initialize */
		// Clear geolocator input
		$("#google_geolocator").val("");

		// Get maxdate of datset and set datepicker maxdate
		fetchMaxDate();

		// Init the map
		var mapOptions = {
			center: { lat: 39.10102067020093, lng: -101.07749658203123 },
			zoom: 4,
			disableDefaultUI: true,
			zoomControl: true,
			zoomControlOptions: {
				position: google.maps.ControlPosition.LEFT_CENTER
			}
		};
		map = new google.maps.Map(document.getElementById('gmap'), mapOptions);

		// Set map idle event. This is when we look up stations
		google.maps.event.addListener(map, 'idle', function() {
			getStations();
		});

		// Init autocomplete
		autocomplete = new google.maps.places.Autocomplete(document.getElementById('google_geolocator'));
		autocomplete.setTypes(['geocode']);

		// Set up place changed event
		google.maps.event.addListener(autocomplete, 'place_changed', function() {
			var place = autocomplete.getPlace();
			if (place.geometry.viewport) {
				map.fitBounds(place.geometry.viewport);
			} else {
				map.setCenter(place.geometry.location);
			}

		});


		/* events */
		self.results.subscribe(function() {
			// Create a marker for each result
			if (self.results() && self.results().length > 0) {
				self.results().forEach(function(result) {
					var marker = new google.maps.Marker({
						position:{lat: result.latitude, lng: result.longitude},
						map: map,
						title: result.id
					});
					self.markers.push(marker);

					// Create a click event for each marker
					google.maps.event.addListener(marker, 'click', function() {
						handleMarkerClick(marker, result);
					});
				});
			}
		});

		self.selectedDate.subscribe(function() {
			getStations();
			if (self.infowindowOpen()) {
				safelyCloseInfowindow();
			}
		});

		self.selectedTEMP.subscribe(function() {
			if (self.infowindowOpen()) {
				safelyCloseInfowindow();
			}
		});

		self.selectedPRCP.subscribe(function() {
			if (self.infowindowOpen()) {
				safelyCloseInfowindow();
			}
		});

    };

    return quickDataTool;
})();