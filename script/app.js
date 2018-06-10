// Global Variables
var map;
var markers = [];
var locations = [
  {title: 'Red Robin', location: {lat: 47.750197, lng: -117.3991093}},
  {title: 'Five Guys', location: {lat: 47.7443494, lng: -117.4060594}},
  {title: 'Nudo Ramen House', location: {lat: 47.7459257, lng: -117.4043709}},
  {title: 'Olive Garden', location: {lat: 47.7488691, lng: -117.4016552}},
  {title: 'Pizza Hut', location: {lat: 47.7499196, lng: -117.4006212}}
];

function AppViewModel() {
  var self = this;

  this.searched = ko.observable('');
  this.locationsArray = ko.observableArray([]);

  self.filteredList = ko.computed(function() {
    return ko.utils.arrayFilter(locations, function(location) {
      return location.title.toLowerCase().indexOf(self.searched().toLowerCase()) !== -1;
    });
  }, self);

  this.showLocation = function(clicked) {
    map.panTo(new google.maps.LatLng(clicked.location));
  };
};

function initMap() {
  var styles = [
    {
        "elementType": "geometry",
        "stylers": [
            {
                "hue": "#ff4400"
            },
            {
                "saturation": -68
            },
            {
                "lightness": -4
            },
            {
                "gamma": 0.72
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels.icon"
    },
    {
        "featureType": "landscape.man_made",
        "elementType": "geometry",
        "stylers": [
            {
                "hue": "#0077ff"
            },
            {
                "gamma": 3.1
            }
        ]
    },
    {
        "featureType": "water",
        "stylers": [
            {
                "hue": "#00ccff"
            },
            {
                "gamma": 0.44
            },
            {
                "saturation": -33
            }
        ]
    },
    {
        "featureType": "poi.park",
        "stylers": [
            {
                "hue": "#44ff00"
            },
            {
                "saturation": -23
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "hue": "#007fff"
            },
            {
                "gamma": 0.77
            },
            {
                "saturation": 65
            },
            {
                "lightness": 99
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "gamma": 0.11
            },
            {
                "weight": 5.6
            },
            {
                "saturation": 99
            },
            {
                "hue": "#0091ff"
            },
            {
                "lightness": -86
            }
        ]
    },
    {
        "featureType": "transit.line",
        "elementType": "geometry",
        "stylers": [
            {
                "lightness": -48
            },
            {
                "hue": "#ff5e00"
            },
            {
                "gamma": 1.2
            },
            {
                "saturation": -23
            }
        ]
    },
    {
        "featureType": "transit",
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "saturation": -64
            },
            {
                "hue": "#ff9100"
            },
            {
                "lightness": 16
            },
            {
                "gamma": 0.47
            },
            {
                "weight": 2.7
            }
        ]
    }
  ];

  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 47.7476497, lng: -117.4048635},
    zoom: 15.8,
    styles: styles,
    mapTypeControl: false
  });

  var largeInfowindow = new google.maps.InfoWindow();
  var defaultIcon = makeMarkerIcon();
  var highlightedIcon = makeMarkerIconHighlight();

  for (var i = 0; i < locations.length; i++) {

    var position = locations[i].location;
    var title = locations[i].title;

    var marker = new google.maps.Marker({
      position: position,
      map: map,
      title: title,
      animation: google.maps.Animation.DROP,
      icon: defaultIcon,
      id: i
    });

    markers.push(marker);

    marker.addListener('click', function() {
      populateInfoWindow(this, largeInfowindow);
      reCenterMap(this.position);
    });
    marker.addListener('mouseover', function() {
      this.setIcon(highlightedIcon);
    });
    marker.addListener('mouseout', function() {
      this.setIcon(defaultIcon);
    });
    marker.reCenterMap = function (position) {
  		map.panTo(new google.maps.LatLng(position));
  	};
  }

  function showListings() {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
      bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
  }

  function hideListings() {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
    }
  }

  function populateInfoWindow(marker, infowindow) {

      if (infowindow.marker != marker) {

        infowindow.setContent('');
        infowindow.marker = marker;

        infowindow.addListener('closeclick', function() {
          infowindow.marker = null;
        });

        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;

        function getStreetView(data, status) {
          if (status == google.maps.StreetViewStatus.OK) {
            var nearStreetViewLocation = data.location.latLng;
            var heading = google.maps.geometry.spherical.computeHeading(
              nearStreetViewLocation, marker.position);
              infowindow.setContent('<br><div id="window-title">' + marker.title + '</div><br><div id="pano"></div><br>');
              var panoramaOptions = {
                position: nearStreetViewLocation,
                pov: {
                  heading: heading,
                  pitch: 30
                }
              };
            var panorama = new google.maps.StreetViewPanorama(
              document.getElementById('pano'), panoramaOptions);
          } else {
            infowindow.setContent('<div>' + marker.title + '</div>' +
              '<div>No Street View Found</div>');
          }
        }

        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);

        infowindow.open(map, marker);
      }

    function showListings() {
      var bounds = new google.maps.LatLngBounds();
      for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
      }
      map.fitBounds(bounds);
    }

    function hideListings() {
      for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
      }
    }
  }

  function makeMarkerIcon() {
    var markerImage = new google.maps.MarkerImage(
      'http://pedroperone.com/normal.png',
      new google.maps.Size(30, 30),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(30,30));
    return markerImage;
  }


  function makeMarkerIconHighlight() {
    var markerImage = new google.maps.MarkerImage(
      'http://pedroperone.com/highlight.png',
      new google.maps.Size(30, 30),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(30,30));
    return markerImage;
  }
};

var Location = function(data) {
	var self = this;
	this.title = data.title;
	this.lat = data.location.lat;
	this.long = data.location.long;

	this.visible = ko.observable(true);

	this.infoWindow = new google.maps.InfoWindow({content: self.contentString});

	this.showMarker = ko.computed(function() {
		if(this.visible() === true) {
			this.marker.setMap(map);
		} else {
			this.marker.setMap(null);
		}
		return true;
	}, this);

  this.pop = function(place) {
		google.maps.event.trigger(self.marker, 'click');
	};

};

ko.applyBindings(new AppViewModel());
