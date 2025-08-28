import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat"; // Heat plugin

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Heatmap component
function Heatmap({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length || !L.heatLayer) return;

    const heat = L.heatLayer(points, { radius: 25, blur: 15, maxZoom: 10 });
    heat.addTo(map);

    return () => map.removeLayer(heat);
  }, [points, map]);

  return null;
}

export default function App() {
  const [earthquakes, setEarthquakes] = useState([]);
  const [minMag, setMinMag] = useState(0);

  useEffect(() => {
    fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
    )
      .then((res) => res.json())
      .then((data) => setEarthquakes(data.features))
      .catch(console.error);
  }, []);

  const filteredQuakes = earthquakes.filter(
    (eq) => eq.properties.mag >= minMag
  );

  const heatPoints = filteredQuakes.map((eq) => {
    const [lon, lat] = eq.geometry.coordinates;
    return [lat, lon, eq.properties.mag];
  });

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <h1 style={{ textAlign: "center", margin: "10px 0" }}>
        🌍 Earthquake Visualizer with Seismic Patterns
      </h1>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        <label>Minimum Magnitude:</label>
        <input
          type="number"
          value={minMag}
          onChange={(e) => setMinMag(Number(e.target.value))}
          style={{ width: "60px", padding: "5px" }}
        />
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ flex: 1, width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Heatmap layer */}
        <Heatmap points={heatPoints} />

        {/* Markers for interactivity */}
        {filteredQuakes.map((eq) => {
          const [lon, lat] = eq.geometry.coordinates;
          return (
            <Marker key={eq.id} position={[lat, lon]}>
              <Popup>
                <b>{eq.properties.place}</b>
                <br />
                Magnitude: {eq.properties.mag}
                <br />
                Time: {new Date(eq.properties.time).toLocaleString()}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
