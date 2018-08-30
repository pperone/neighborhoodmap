var map;
var infoWindow;
var bounds;
var locations = [
  {title: 'Red Robin', location: {lat: 47.750197, lng: -117.3991093}},
  {title: 'Five Guys', location: {lat: 47.7443494, lng: -117.4060594}},
  {title: 'Nudo Ramen House', location: {lat: 47.7459257, lng: -117.4043709}},
  {title: 'Olive Garden', location: {lat: 47.7488691, lng: -117.4016552}},
  {title: 'Pizza Hut', location: {lat: 47.7499196, lng: -117.4006212}}
];

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

    infoWindow = new google.maps.InfoWindow();

    bounds = new google.maps.LatLngBounds();

    ko.applyBindings(new ViewModel());
}

function googleMapsError() {
    alert('An error occurred with Google Maps.');
}

var LocationMarker = function(locations) {
    var self = this;

    this.title = locations.title;
    this.position = locations.location;
    this.street = '',
    this.city = '',
    this.phone = '';

    this.visible = ko.observable(true);

    var defaultIcon = makeMarkerIcon();
    var highlightedIcon = makeMarkerIconHighlight();

    var clientID = 'ILHXHJ5VB1R2U55VV5WPHCEZDY5KPTLJQO1ZB3CUSWADPPT2';
    var clientSecret = 'EHB0HMPWVBDVKCRVBFHB3OHBJQY0CPEBFZ3KO3LZFZTFJX1L';
    var reqURL = 'https://api.foursquare.com/v2/venues/search?ll=' + this.position.lat + ',' + this.position.lng + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20160118' + '&query=' + this.title;

    $.getJSON(reqURL).done(function(locations) {
		var results = locations.response.venues[0];
        self.street = results.location.formattedAddress[0] ? results.location.formattedAddress[0]: 'N/A';
        self.city = results.location.formattedAddress[1] ? results.location.formattedAddress[1]: 'N/A';
        self.phone = results.contact.formattedPhone ? results.contact.formattedPhone : 'N/A';
    }).fail(function() {
        alert('An error occurred with FourSquare.');
    });

    this.marker = new google.maps.Marker({
        position: this.position,
        title: this.title,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon
    });

    self.filterMarkers = ko.computed(function () {

        if(self.visible() === true) {
            self.marker.setMap(map);
            bounds.extend(self.marker.position);
            map.fitBounds(bounds);
        } else {
            self.marker.setMap(null);
        }
    });

    this.marker.addListener('click', function() {
        this.setIcon(highlightedIcon);
        populateInfoWindow(this, self.street, self.city, self.phone, infoWindow);
        toggleBounce(this);
        map.panTo(this.getPosition());
    });

    this.show = function(location) {
        google.maps.event.trigger(self.marker, 'click');
    };

    this.bounce = function(place) {
		google.maps.event.trigger(self.marker, 'click');
	};

};

var ViewModel = function() {
    var self = this;

    this.searchItem = ko.observable('');

    this.mapList = ko.observableArray([]);

    locations.forEach(function(location) {
        self.mapList.push( new LocationMarker(location) );
    });

    this.locationList = ko.computed(function() {
        var searchFilter = self.searchItem().toLowerCase();
        if (searchFilter) {
            return ko.utils.arrayFilter(self.mapList(), function(location) {
                var str = location.title.toLowerCase();
                var result = str.includes(searchFilter);
                location.visible(result);
                location.marker.setVisible(result);
				return result;
			});
        }
        self.mapList().forEach(function(location) {
            location.visible(true);
            location.marker.setVisible(location);
        });
        return self.mapList();
    }, self);
};


function populateInfoWindow(marker, street, city, phone, infowindow) {

    var defaultIcon = makeMarkerIcon();

    if (infowindow.marker != marker) {

        infowindow.setContent('');
        infowindow.marker = marker;


        infowindow.addListener('closeclick', function() {
            marker.setIcon(defaultIcon);
            infowindow.marker = null;
        });

        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;

        var windowContent = '<h4>' + marker.title + '</h4>' +
            '<p>' + street + "<br>" + city + '<br>' + phone + "</p>";

        var getStreetView = function (data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                infowindow.setContent(windowContent + '<div id="pano"></div>');
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 20
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
                infowindow.setContent(windowContent + '<div style="color: red">No Street View Found</div>');
            }
        };

        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);

        infowindow.open(map, marker);
    }
}

function toggleBounce(marker) {
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        marker.setAnimation(null);
    }, 1400);
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
