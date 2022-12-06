import React, { useRef, useEffect, useState } from "react";
import * as d3 from 'd3'
import { select, geoPath, geoAlbersUsa, zoom, zoomTransform } from "d3";
import useResizeObserver from "./useResizeObserver";
import mac from './mac.json';
import axios from 'axios';
/**
 * Component that renders a map of Germany.
 */

function GeoChart({ data, starbucks, county }) {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const dimensions = useResizeObserver(wrapperRef);
  // will be called initially and on every data change
  const [isMac, setMac] = useState(false);
  const [firstrender, setFirstRender] = useState(true);
  const [isStatesRendered, setStatesRender] = useState(false);
  const [file, setFile] = useState('');
  const [fileData, setFileData] = useState([]);

  const [isStar, setStar] = useState(false);
  const [zoomLevel, setZoom] = useState(1);
  const [zoomLevel1, setZoom1] = useState(1);

  const [showCounty, setShowCounty] = useState(false);
  const [fileType, setFileType] = useState('point');
  const [macType, setMacType] = useState('point');
  const [starType, setStarType] = useState('point');

  function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  const appendSmallCircleToPoint = (point, fill) => {
    point.append("circle")
      .attr("class", "point")
      .attr("r", 5).attr('fill', fill)
  };

  const appendCircleToPoint = (point, fill) => {
    point
      .append('circle')
      .attr('class', "point")
      .attr('r', 5).attr('fill', fill)
    point
      .append('text')
      .text(p => p.name || makeid(8))
      .attr('class', "cityName")
      .attr('y', '-11')
  };

  const appendClusterToPoint = (point, fill) => {
    point.append('circle').attr('class', "cluster").attr('r', 26).attr('fill', fill);

    point
      .append('text')
      .text(p => p.results || Math.floor(Math.random() * 300))
      .attr('class', "centeredText");
  };
  const appendRectToPoint = (point, fill) => {
    point
      .append('rect')
      .attr('class', "rectPoint")
      .attr('width', p => {
        const length = p.results?.toString().length || Math.floor(Math.random() * 300).toString().length;
        return length > 2 ? length * 10 : 30;
      })
      .attr('height', 20)
      .attr('rx', '10px')
      .attr('x', p => {
        const length = p.results?.toString().length || Math.floor(Math.random() * 300).toString().length;
        return length > 2 ? -length * 5 : -15;
      })
      .attr('y', -11).attr('fill', fill);

    point
      .append('text')
      .text(p => p.name || makeid(8))
      .attr('class', "cityName")
      .attr('y', '-18')

    point
      .append('text')
      .text(p => p.results || Math.floor(Math.random() * 300))
      .attr('class', "centeredText")
  };


  const appendDataPointsToChart = (g, newData, projection, type, fill) => {
    // create g container for the point
    const point = g
      .selectAll('.points')
      .data(newData)
      .enter()
      .append('g')
      .attr('class', "pointContainer")
      .attr('transform', p => {
        return `translate(${projection([p.position.lng, p.position.lat])}) scale(${1 / zoomLevel > 1 ? 1 : 1 / zoomLevel})`;
      });

    if (type === "bc") {
      appendClusterToPoint(point, fill);
    } else if (type === "sfc") {
      appendRectToPoint(point, fill);
    } else if (type === "pwta") {
      appendCircleToPoint(point, fill);
    }
    else {
      appendSmallCircleToPoint(point, fill);

    }
  };




  useEffect(() => {
    const svg = select(svgRef.current);
    svg.selectAll(".points").remove();
    svg.selectAll(".pointContainer").remove();
    if (!showCounty) {
      svg.selectAll(".county").remove();

    }
    // use resized dimensions
    // but fall back to getBoundingClientRect, if no dimensions yet.
    const { width, height } =
      dimensions || wrapperRef.current.getBoundingClientRect();

    // projects geo-coordinates on a 2D plane

    const projection = geoAlbersUsa()
      .fitSize([width, height], data)
      .precision(100)


    // takes geojson data,
    // transforms that into the d attribute of a path element
    const pathGenerator = geoPath().projection(projection);



    let g = svg.select("#mainContainer")

    if (firstrender) {
      setFirstRender(false)
      g = svg.append("g").attr('id', 'mainContainer');
      g
        .selectAll(".state")
        .data(data.features)
        .join("path")
        .on('click', feature => {
          zoomto(feature)
        })
        .attr("class", "state")
        .attr("d", feature => pathGenerator(feature));

    }
    const zoome = zoom()
      .extent([[0, 0], [1200, 660]])
      .scaleExtent([1, 15])
      .on("zoom", zoomed);
    g.call(zoome);

    if (showCounty && !isStatesRendered) {
      setStatesRender(true)
      g.selectAll(".county")
        .data(county.features)
        .join("path")
        .attr("class", "county")
        .attr("d", feature => pathGenerator(feature));
    }

    if (isMac)
      appendDataPointsToChart(g, mac, projection, macType, "red")

    if (isStar)
      appendDataPointsToChart(g, starbucks, projection, starType, "#16227b")
    console.log(fileData)

    if (fileData.length) {
      fileData.forEach((d) => {
        appendDataPointsToChart(g, d, projection, fileType, "green")

      })
    }
    function zoomed(event) {
      g.attr("transform", event.transform);
      const k = event.transform.k;
      setZoom(Math.floor(k))
      setZoom1(k)
    }
    function zoomto(x, y, k) {
      var transform = d3.zoomIdentity
        .translate(x, y)
        .scale(k);

    }


  }, [data, fileData, fileType, dimensions, starbucks, mac, isMac, isStar, macType, starType, firstrender, isStatesRendered, zoomLevel, showCounty, showCounty]);


  useEffect(() => {

    axios.get(file)
      .then(function (response) {
        setFileData((f) => [...f, response.data])
      }
      ).catch((error) => {
        console.error(error);
      });



  }, [file])
  return (
    <div>
      <div style={{ display: 'flex' }}>

        <div ref={wrapperRef} style={{ marginBottom: "2rem", width: "100%", height: "600px" }}>
          <svg ref={svgRef}></svg>
        </div>
        <div style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "20px",
          background: "#2e3dc833",
        }}>
          <div>current zoom</div>
          <div style={{ fontSize: "20px", marginBottom: "15px", background: "red" }}>{zoomLevel1.toFixed(3)}</div>




          <div style={{ display: "flex", justifyContent: "center", }}>

            <input type="checkbox" id="county" name="county" onClick={() => {
              setShowCounty(m => {
                if (m) {
                  setStatesRender(false)
                }
                return !m
              })
            }} />
            <label for="county" > show counties</label>
          </div>

          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", background: "yellow" }}>


            <div style={{ display: "flex", justifyContent: "center", }}>

              <input type="checkbox" id="mac" name="mac" onClick={() => { setMac(m => !m) }} />
              <label for="mac" > show mac</label>
            </div>
            <label for="macType">point type</label>

            <select name="macType" id="macType" onChange={(v) => { setMacType(v.target.value) }}>
              <option value="point">point</option>
              <option value="pwta">point with text above</option>
              <option value="sfc">small filter cluster</option>
              <option value="bc">big cluster</option>
            </select>

          </div>


          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", background: "red", marginTop: "15px" }}>
            <div style={{ display: "flex", justifyContent: "center", }}>

              <input checked={isStar} type="checkbox" id="star" name="star" onClick={() => { setStar(m => !m) }} />
              <label for="star"> show starbucks</label>
            </div>
            <label for="starType">point type</label>

            <select name="starType" id="starType" onChange={(v) => { setStarType(v.target.value) }}>
              <option value="point">point</option>
              <option value="pwta">point with text above</option>
              <option value="sfc">small filter cluster</option>
              <option value="bc">big cluster</option>
            </select>
          </div>


          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", background: "green", marginTop: "15px" }}>
            <div style={{ display: "flex", justifyContent: "center", flexDirection: "column" }}>
              <label for="star"> File url</label>
              <input style={{ margin: "5px" }} id="file" name="file" onChange={(v) => {
                setFile(v.target.value)
              }} />
            </div>
            <label for="filetype ">point type</label>
            <select name="filetype" id="filetype" onChange={(v) => { setFileType(v.target.value) }}>
              <option value="point">point</option>
              <option value="pwta">point with text above</option>
              <option value="sfc">small filter cluster</option>
              <option value="bc">big cluster</option>
            </select>

          </div>

        </div>
      </div>
      <div style={{ marginTop: '50px' }}>
        {`info : for the file format it should be [] of 
    {
    "position": {
      "lat": number,
      "lng": number
    },
    "name": string,
    "results": number
  }  `} example in <a href="https://api.npoint.io/9894e8b2d523221eb0d9"> example</a>
        {' '}if you have a different format just contact me i can change it in 5 min
        <br />
        if you have more than one file just put the first link in the input felid after you see the points on the map  replace the input felid with the new link it will add the new points to the existing ones
        to zoom double click or use the mouse wheel

      </div>
    </div>
  );
}

export default GeoChart;
