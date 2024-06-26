mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/light-v10', // style URL, we have changed this, there are others in the docs
    center: campground.geometry.coordinates, // [-74.5, 40], // starting position [lng, lat]
    zoom: 10, // starting zoom
});

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());

// make a marker
new mapboxgl.Marker()
    // set the lat/long of where it should go
    .setLngLat(campground.geometry.coordinates)
    // set popup on this marker when the user clicks
    .setPopup(
        new mapboxgl.Popup({offset: 25})
            .setHTML(
                `<h3>${campground.title}</h3><p>${campground.location}`
            )
    )
    // add the marker to the map
    .addTo(map);
