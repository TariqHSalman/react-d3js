import React, { useRef, useEffect, useState } from "react";
import { select, geoPath, geoAlbersUsa, min, max, scaleLinear } from "d3";
import useResizeObserver from "./useResizeObserver";
import mac from './mac.json';
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
  const [isMac, setMac] = useState(false);
  const [isStar, setStar] = useState(true);
  const [r, setR] = useState(5);


  const zoomOut = () => {
    if (selectedCounty) {
      setSelectedCounty(null)
    }
    else if (selectedState) {
      setSelectedState(null)
    }
  }
  useEffect(() => {
    const svg = select(svgRef.current);
    svg.selectAll(".starbucks").remove();
    svg.selectAll(".county").remove();
    svg.selectAll(".mac").remove();


    // use resized dimensions
    // but fall back to getBoundingClientRect, if no dimensions yet.
    const { width, height } =
      dimensions || wrapperRef.current.getBoundingClientRect();

    // projects geo-coordinates on a 2D plane

    const projection = geoAlbersUsa()
      .fitSize([width, height], selectedCounty || selectedState || data)
      .precision(100)
   

    // takes geojson data,
    // transforms that into the d attribute of a path element
    const pathGenerator = geoPath().projection(projection);

    // render each country
    svg
      .selectAll(".state")
      .data(data.features)
      .join("path")
      .on('click', feature => {
        console.log(feature)
        setSelectedState(feature.target.__data__)
      })
      .attr("class", "state")
      .transition()
      .attr("d", feature => pathGenerator(feature));


    if (selectedState) {
      const stateCounties = county.features.filter((co) => co.properties.COUNTY_STATE_NAME.includes(selectedState.properties.NAME))
      svg.selectAll(".county")
        .data(stateCounties)
        .join("path").
        on('click', feature => {
          setSelectedCounty(feature.target.__data__)
       
        })
        .attr("class", "county")
        .transition()
        .attr("d", feature => pathGenerator(feature));

    }

if(isMac)
    svg.selectAll(".mac")
      .data(mac)
      .enter().append("circle")
      .attr("class", "mac")
      .attr("r", r)
      .attr("cx", function (d) {
        var coords = projection([d.lng, d.lat])
        return coords[0]
      })
      .attr("cy", function (d) {
        var coords = projection([d.lng, d.lat])
        return coords[1]
      })
      if(isStar)
      svg.selectAll(".starbucks")
        .data(starbucks)
        .enter().append("circle")
        .attr("class", "starbucks")
        .attr("r", r)
        .attr("cx", function (d) {
          var coords = projection([d.position.lng, d.position.lat])
          return coords[0]
        })
        .attr("cy", function (d) {
          var coords = projection([d.position.lng, d.position.lat])
          return coords[1]
        })

  }, [data, dimensions, starbucks, selectedState, selectedCounty, mac,isMac,isStar,r]);

  return (
    <>
      <button onClick={zoomOut}>zoom out </button>
      <div style={{display:"flex", justifyContent:"center"}}>
        <input type="checkbox" id="mac" name="mac" onClick={()=>{setMac(m=>!m)}}/>
        <label for="mac" > show mac</label>
      </div>
      <div style={{display:"flex", justifyContent:"center"}}>

        <input checked={isStar} type="checkbox" id="star" name="star" onClick={()=>{setStar(m=>!m)}}/>
        <label for="star"> show starbucks</label>
      </div>
    point radius
      <input placeholder="point radius" defaultValue={5} onChange={(v)=>{setR(parseFloat(v.target.value))}}/>

      <div ref={wrapperRef} style={{ marginBottom: "2rem", width: "100%", height: "600px" }}>
        <svg ref={svgRef}></svg>
      </div>
    </>
  );
}

export default GeoChart;
