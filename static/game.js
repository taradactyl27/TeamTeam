function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function distance(lat1,lon1,lat2,lon2) {
var R = 6371; // Radius of the earth in km
var dLat = deg2rad(lat2-lat1);  // deg2rad below
var dLon = deg2rad(lon2-lon1); 
var a = 
  Math.sin(dLat/2) * Math.sin(dLat/2) +
  Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
  Math.sin(dLon/2) * Math.sin(dLon/2)
  ; 
var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
var d = R * c; // Distance in km
return d;
}

function deg2rad(deg) {
return deg * (Math.PI/180)
}

var sv;
var map;
var panorama;
var marker;

var latitude;
var longitude;
var landed_lat;
var landed_lng;
var user_score;
var count = 0;
var place;

var on_land; // to know if the random coordinate is a land coordinate

function initMap() {
  latitude = getRandomFloat(-45,66); // avoiding the arctic circles and then some
  longitude = getRandomFloat(-180,180);

  place = {lat: latitude, lng: longitude};
  console.log("the beginning: " + place.lat + ", " + place.lng);
  var geocoder = new google.maps.Geocoder;
  geocoder.geocode({'location': place}, function(results, status){
    if (status != 'OK'){
      //redirec to some place in Eurasia
      console.log("redirecting to Eurasia bc I landed in water");
      place.lng = getRandomFloat(60, 130);
      place.lat = getRandomFloat(20, 70);
    }
  }
  )

  var place2 = {lat: 0, lng: 0}; // for the map        
  sv = new google.maps.StreetViewService();

  panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'));

  // Set up the map.
  map = new google.maps.Map(document.getElementById('map'), {
    center: place2,
    zoom: 2,
    streetViewControl: false
  });

  TryRandomLocation(processSVData);

  //when the user clicks on the map
  map.addListener('click', marking);
}

function TryRandomLocation(callback) {
  // Try to find a panorama within 50 metres 
  sv.getPanorama({
      location: new google.maps.LatLng(latitude, longitude),
      radius: 15000
  }, callback);
}

// putting the marker down at where the user clicks
function marking(event) {
  if (marker == undefined){
    marker = new google.maps.Marker({
        position: event.latLng,
        map: map, 
        animation: google.maps.Animation.DROP, // just to be extra
    });
}
else{
    marker.setAnimation(google.maps.Animation.DROP);
    marker.setPosition(event.latLng);
}

  // distance from user click to actual place
  var distance_to_goal = distance(event.latLng.lat(), event.latLng.lng(), landed_lat, landed_lng);
  // scoring (half of Earth's circumference in km minus user click distance)
  user_score = 20037.5 - distance_to_goal;

  // putting a marker down activates the submit button
  document.getElementById("submit").disabled = false;
}

$( "button" ).click(function() {
  // so they can't submit again
  $( "button" ).remove();
  // making a marker at the correct spot, marked "B"
  var endMark = new google.maps.Marker({
	position: {lat: landed_lat, lng: landed_lng},
	map:map,
	label: "B",
});
  google.maps.event.clearInstanceListeners(map);

  // determining the score
  var score = document.getElementById("score");
  console.log( 'score: ' + user_score );
  score.innerHTML = 'you scored ' + user_score;

  // sending how much score to add to the user
  $.ajax({
    url: '/addScore',
    type: 'GET',
    data: {"score": user_score},
    success: function(response){
      console.log(response);
    },
    error: function(error){
      console.log(error);
    }
  });

});

function processSVData(data, status) {
  if (status === 'OK') {
    panorama.setPano(data.location.pano);
    landed_lat = data.location.latLng.lat();
    landed_lng = data.location.latLng.lng();
    panorama.setVisible(true);
    panorama.set('addressControl', false);

    console.log("YAY! " + data.location.latLng.lat() + ", " + data.location.latLng.lng());
    console.log("took " + count + " tries");
  } else {
    longitude++;
    count++;
    console.log("getting a good location...");
    TryRandomLocation(processSVData);
  }
}
