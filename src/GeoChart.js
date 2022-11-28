import React, { useRef, useEffect, useState } from "react";
import { select, geoPath, geoAlbersUsa, min, max, scaleLinear } from "d3";
import useResizeObserver from "./useResizeObserver";
import cities from "./us_cities.geo.json"
/**
 * Component that renders a map of Germany.
 */

function GeoChart({ data, starbucks, county }) {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const dimensions = useResizeObserver(wrapperRef);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCounty, setSelectedCounty] = useState(null);
  // will be called initially and on every data change
  const zoomOut = () => {
    if (selectedCounty) {
      setSelectedCounty(null)
    }
    else if (selectedState) {
      setSelectedState(null)
    }
  }
  useEffect(() => {
    console.log(selectedState)
    const svg = select(svgRef.current);
    svg.selectAll(".starbucks").remove();
    svg.selectAll(".county").remove();

    // use resized dimensions
    // but fall back to getBoundingClientRect, if no dimensions yet.
    const { width, height } =
      dimensions || wrapperRef.current.getBoundingClientRect();

    // projects geo-coordinates on a 2D plane

    const projection = geoAlbersUsa()
      .fitSize([width, height], selectedCounty || selectedState || data)
      .precision(100);

    // takes geojson data,
    // transforms that into the d attribute of a path element
    const pathGenerator = geoPath().projection(projection);

    // render each country
    svg
      .selectAll(".state")
      .data(data.features)
      .join("path")
      .on('click', feature => {
        setSelectedState(feature.target.__data__)
      })
      .attr("class", "state")
      .transition()
      .attr("d", feature => pathGenerator(feature));
    const points =
      starbucks;

    if (selectedState) {
      const stateCounties = county.features.filter((co) => co.properties.COUNTY_STATE_NAME.includes(selectedState.properties.NAME))
      svg.selectAll(".county")
        .data(stateCounties)
        .join("path").
        on('click', feature => {
          console.log(feature)
          setSelectedCounty(feature.target.__data__)
        })
        .attr("class", "county")
        .transition()
        .attr("d", feature => pathGenerator(feature));

    }

    console.log(points)
    if (points) {
      svg.selectAll(".starbucks")
        .data(points)
        .enter().append("circle")
        .attr("class", "starbucks")
        .attr("r", 5)
        .attr("cx", function (d) {
          var coords = projection([d.position.lng, d.position.lat])
          return coords[0]
        })
        .attr("cy", function (d) {
          var coords = projection([d.position.lng, d.position.lat])
          return coords[1]
        })
    }
  }, [data, dimensions, starbucks, selectedState, selectedCounty]);

  return (
    <>
      <button onClick={zoomOut}>zoom out </button>
      <div ref={wrapperRef} style={{ marginBottom: "2rem", width: "100%", height: "600px" }}>
        <svg ref={svgRef}></svg>
      </div>
    </>
  );
}

export default GeoChart;
