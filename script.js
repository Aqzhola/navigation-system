let map, directionsService, directionsRenderer;
let markers = [];
let gasStations = [];
let cafes = [];

function initMap() {
    const astana = { lat: 51.169392, lng: 71.449074 };
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: astana
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true });
    directionsRenderer.setMap(map);
    directionsRenderer.setPanel(document.getElementById('directionsPanel'));

    map.addListener('click', (event) => {
        addMarker(event.latLng);
    });
}

function addMarker(location) {
    if (markers.length >= 2) {
        alert("You can only add two markers.");
        return;
    }
    const marker = new google.maps.Marker({
        position: location,
        map: map
    });
    markers.push(marker);
    if (markers.length === 2) {
        calculateRoute();
    }
}

function clearMarkers() {
    for (let marker of markers) {
        marker.setMap(null);
    }
    markers = [];
    for (let station of gasStations) {
        station.setMap(null);
    }
    gasStations = [];
    for (let cafe of cafes) {
        cafe.setMap(null);
    }
    cafes = [];
    directionsRenderer.set('directions', null);
    document.getElementById('route-details').style.display = 'none';
    document.getElementById('places-details').style.display = 'none';
}

function calculateRoute() {
    if (markers.length < 2) {
        alert("Please select at least two points on the map.");
        return;
    }
    const start = markers[0].getPosition();
    const end = markers[1].getPosition();
    const request = {
        origin: start,
        destination: end,
        travelMode: 'DRIVING'
    };
    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            document.getElementById('route-details').style.display = 'block';
            showNearbyPlaces();
        } else {
            alert('Directions request failed due to ' + status);
        }
    });
}

function showNearbyPlaces() {
    const path = directionsRenderer.getDirections().routes[0].overview_path;
    const bounds = new google.maps.LatLngBounds();
    for (let i = 0; i < path.length; i++) {
        bounds.extend(path[i]);
    }
    searchPlaces(bounds, 'gas_station', gasStations);
    searchPlaces(bounds, 'cafe', cafes);
}

function searchPlaces(bounds, type, collection) {
    const service = new google.maps.places.PlacesService(map);
    service.nearbySearch({
        bounds: bounds,
        type: type
    }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            for (let place of results) {
                if (google.maps.geometry.spherical.computeDistanceBetween(place.geometry.location, map.getCenter()) <= 2000) {
                    const marker = new google.maps.Marker({
                        map: map,
                        position: place.geometry.location,
                        title: place.name
                    });
                    collection.push(marker);
                    addToPlacesList(place);
                }
            }
        }
    });
}

function addToPlacesList(place) {
    const placesList = document.getElementById('places-list');
    const li = document.createElement('li');
    li.textContent = `${place.name} (${place.vicinity}) - ${google.maps.geometry.spherical.computeDistanceBetween(place.geometry.location, markers[0].getPosition()).toFixed(2)} km`;
    placesList.appendChild(li);
}

function closeRouteDetails() {
    document.getElementById('route-details').style.display = 'none';
}

function closePlacesDetails() {
    document.getElementById('places-details').style.display = 'none';
}

function showGasStations() {
    document.getElementById('places-details').style.display = 'block';
    document.getElementById('places-list').innerHTML = '';
    for (let station of gasStations) {
        addToPlacesList({ name: station.title, vicinity: '', geometry: { location: station.position } });
    }
}

function showCafes() {
    document.getElementById('places-details').style.display = 'block';
    document.getElementById('places-list').innerHTML = '';
    for (let cafe of cafes) {
        addToPlacesList({ name: cafe.title, vicinity: '', geometry: { location: cafe.position } });
    }
}
