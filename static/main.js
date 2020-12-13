var map = new ol.Map({
    target: 'map',
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      })
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat([-74.006,40.7127]),
      zoom: 6,
      minZoom: 4,
    })
})

var vectorSource = new ol.source.Vector();

var markerVectorLayer = new ol.layer.Vector({
  source: vectorSource,
});

drawMarker = new ol.interaction.Draw({
    source: vectorSource,
    type: 'Point',
  })

map.addInteraction(drawMarker)
map.addLayer(markerVectorLayer)

map.on('click', function(e){
  coords = e.coordinate
  Lonlat = ol.proj.transform(coords, 'EPSG:3857', 'EPSG:4326')
  console.log(Lonlat)
  vectorSource.clear();
  document.getElementById('longitude').innerText = Lonlat[0]
  document.getElementById('latitude').innerText = Lonlat[1]

  document.getElementById('longitude1').value = Lonlat[0]
  document.getElementById('latitude1').value = Lonlat[1]

  // Adding a marker on the map
  var marker = new ol.Feature({
    geometry: new ol.geom.Point(
      e.coordinate
    ),
  });

  var iconStyle = new ol.style.Style({
    image: new ol.style.Icon(({
        anchor: [12, 41],
        anchorXUnits: 'pixels',
        anchorYUnits: 'pixels',
        opacity: 0.95,
        src: 'static/blue-marker.png'
    }))
  });

  marker.setStyle(iconStyle)

  vectorSource.addFeature(marker)

})

var slider = document.getElementById("range");
var output = document.getElementById("my_range");
output.innerHTML = slider.value + 'km'; // Display the default slider value
document.getElementById('range1').value = slider.value

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
  output.innerHTML = this.value + 'km';
  document.getElementById('range1').value = this.value
}

document.getElementById('submit').onclick = function (e) {

  btn = document.getElementById('submit')
  btn.style.backgroundColor = "#585858"
  btn.innerHTML = "<img src='static/active.gif' height=24 style='padding-bottom: 4px;'/>"
  btn.disabled = true

  range = document.getElementById('range1').value
  longitude = document.getElementById('longitude1').value
  latitude = document.getElementById('latitude1').value

  output1 = document.getElementById('result')

  var req = new XMLHttpRequest();
  req.open('POST', '/data', true);
  req.setRequestHeader('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
  req.send('longitude=' + longitude + '&latitude=' + latitude + '&range=' + range);
  req.onreadystatechange = function () {
    if(this.readyState == 4){
      if (req.status == 200) {
        var res_data = JSON.parse(this.responseText);
        output1.innerHTML = `
          <b>Name: <a href='${res_data.website}' style='color:grey'>${res_data.name}</a></b><br>
          <b>Address</b>: ${res_data.address}<br>
          <b>Telephone</b>: ${res_data.telephone}<br>
          <b>Beds</b>: ${res_data.beds}<br>
          <b>Distance</b>: ${res_data.distance}km<br>
        `

        vectorSource.clear();
        // Adding a marker on the map
        var new_marker = new ol.Feature({
          geometry: new ol.geom.Point(
            ol.proj.fromLonLat([res_data.longitude, res_data.latitude])
          ),
        });

        var iconStyle = new ol.style.Style({
          image: new ol.style.Icon(({
              anchor: [12, 41],
              anchorXUnits: 'pixels',
              anchorYUnits: 'pixels',
              opacity: 0.95,
              src: 'static/green-marker.png'
          }))
        });

        new_marker.setStyle(iconStyle)
        vectorSource.addFeature(new_marker)

        btn.disabled = false
        btn.style.backgroundColor = "#606161"
        btn.innerHTML = " Find hospital "
      } else {
        output1.innerHTML = " failed "
        btn.disabled = false
        btn.style.backgroundColor = "#606161"
        btn.innerHTML = " Find hospital "
      }
    }
  }
}
