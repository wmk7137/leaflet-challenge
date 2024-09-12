let myMap = L.map("map", {
    center: [34.8, 74.4],
    zoom: 7
});

// Base layers
let openStreetMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

let satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; <a href="https://www.esri.com/en-us/arcgis/products/arcgis-online/overview">ESRI</a>',
    maxZoom: 18
});

let grayscaleLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/attribution">CARTO</a>',
    maxZoom: 19
});

// Add the tile layer to the map
openStreetMapLayer.addTo(myMap);

let earthquakeurl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
let plateurl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

let tectonicPlatesLayer = L.layerGroup().addTo(myMap);
let earthquakesLayer = L.layerGroup().addTo(myMap);

d3.json(plateurl).then(function(response) {
    console.log("Tectonic Plates Data:", response);
    let tectonicPlates = L.geoJSON(response, {
        style: {
            color: '#ff6600',
            weight: 2
        }
    }).addTo(tectonicPlatesLayer);
}).catch(function(error) {
    console.error('Error fetching tectonic plates data:', error);
});

d3.json(earthquakeurl).then(function(response) {
    console.log(response);
    let features = response.features;

    let heatArray = [];

    for (let i = 0; i < features.length; i++) {
        let location = features[i].geometry;
        let properties = features[i].properties;
        if (location) {
            heatArray.push([location.coordinates[1], location.coordinates[0]]);
        }

        
        let magnitude = properties.mag;
        let depth = location.coordinates[2];
        let opacity = getOpacityBasedOnDepth(depth);
        let color = getColorBasedOnDepth(depth);
        let radius = getRadius(magnitude);

        L.circleMarker([location.coordinates[1], location.coordinates[0]], {
            radius: radius,
            fillColor: color,
            color: '#000000',
            weight: 1,
            opacity: 1,       
            fillOpacity: opacity 
        }).bindPopup(`<strong>Magnitude: ${magnitude}</strong><br>
            Depth: ${depth} km<br>
            Location: ${properties.place}`)
            .addTo(earthquakesLayer);
    }

    
    L.heatLayer(heatArray, {
        radius: 20,
    }).addTo(earthquakesLayer);

    
    let legend = L.control({position: 'bottomright'});

    legend.onAdd = function (map) {
        let div = L.DomUtil.create('div', 'legend');

        
        div.innerHTML += '<h4>Depth</h4>';
        div.innerHTML += '<i style="background: #FF0000"></i><span>&gt; 90 km</span><br>';
        div.innerHTML += '<i style="background: #FF4C4C"></i><span>70 - 90 km</span><br>';
        div.innerHTML += '<i style="background: #FF8C8C"></i><span>50 - 70 km</span><br>';
        div.innerHTML += '<i style="background: #FFC0C0"></i><span>30 - 50 km</span><br>';
        div.innerHTML += '<i style="background: #E0FFE0"></i><span>10 - 30 km</span><br>';
        div.innerHTML += '<i style="background: #00FF00"></i><span>&lt; 10 km</span><br>'; 

        return div;
    };

    legend.addTo(myMap);
}).catch(function(error) {
    console.error('Error fetching the earthquake data:', error);
});


function getColorBasedOnDepth(depth) {
    if (depth > 90) return '#FF0000'; 
    if (depth > 70) return '#FF4C4C'; 
    if (depth > 50) return '#FF8C8C'; 
    if (depth > 30) return '#FFC0C0'; 
    if (depth > 10) return '#E0FFE0'; 
    return '#00FF00'; 
}


function getOpacityBasedOnDepth(depth) {
    return depth > 90 ? 1.0 :
           depth > 70 ? 0.8 :
           depth > 50 ? 0.6 :
           depth > 35 ? 0.4 :
           depth >= 10 ? 0.2 :
                         0.1;
}


function getRadius(magnitude) {
    return magnitude * 2.25; 
}
// Layer control
L.control.layers({
    "OpenStreetMap": openStreetMapLayer,
    "Satellite": satelliteLayer,
    "Grayscale": grayscaleLayer
}, {
    "Tectonic Plates": tectonicPlatesLayer,
    "Earthquakes": earthquakesLayer
}).addTo(myMap);