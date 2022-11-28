import React from "react";
// import Video from "./Video";
import GeoChart from "./GeoChart";
import data from "./states.geo.json";
import county from "./county.geo.json";

import starbucks from './starbucks_us_locations.json'
import "./App.css";

function App() {
  return (
    <React.Fragment>
      <h2>World Map with d3-geo</h2>
      <GeoChart data={data} starbucks={starbucks} county={county} />
      <h2>Select property to highlight</h2>

      {/* <Video /> */}
    </React.Fragment>
  );
}

export default App;
