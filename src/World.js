import React from "react";
import ReactResizeDetector from 'react-resize-detector';
import Globe from "react-globe.gl";
import * as THREE from 'three';
import {twoline2satrec, propagate, gstime, eciToEcf, eciToGeodetic, radiansToDegrees} from 'satellite.js';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const EARTH_RADIUS_KM = 6371; // km
const SAT_SIZE = 300; // km
const TIME_STEP = 1000; // per frame
const TLE_URL = 'http://localhost:9091/tles/custom1.txt'

export default function World(props) {
    const globeEl = useRef();
    const parentRef = useRef();
    const [satData, setSatData] = useState();
    const [globeRadius, setGlobeRadius] = useState();
    const [selectedObject, setSelectedObject] = useState();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
      let t = new Date();
      let currentUTC = new Date(t.getTime() + time.getTimezoneOffset() * 60 * 1000);
  
      const frameTicker = () => {
        // console.log("frameTicker")
        let currentTime = new Date();
        let currentTimeUTC = new Date(currentTime.getTime() + currentTime.getTimezoneOffset() * 60 * 1000);
        const diff = 1000 - currentTime.getMilliseconds(); // 距离下一秒还需的毫秒数
  
        setTimeout(() => {
          setTime(currentTime)
          frameTicker();
        }, diff);
      };
  
      frameTicker();
    }, []);

    useEffect(() => {
      // load satellite data
      fetch(TLE_URL, {mode:"cors"}).then(r => r.text()).then(rawData => {
        const tleData = rawData.replace(/\r/g, '')
          .split(/\n(?=[^12])/)
          .filter(d => d)
          .map(tle => tle.split('\n'));
        const satData = tleData.map(([name, ...tle]) => ({
          satrec: twoline2satrec(...tle),
          name: name.trim().replace(/^0 /, '')
        }))
        // exclude those that can't be propagated
        .filter(d => !!propagate(d.satrec, new Date()).position)
        .slice(0, 1500);

        setSatData(satData);
      });
    }, []);

    const objectsData = useMemo(() => {
      if (!satData) return [];

      // Update satellite positions
      const gmst = gstime(time);
      return satData.map(d => {
        const eci = propagate(d.satrec, time);
        if (eci.position) {
          const gdPos = eciToGeodetic(eci.position, gmst);
          const lat = radiansToDegrees(gdPos.latitude);
          const lng = radiansToDegrees(gdPos.longitude);
          const alt = gdPos.height / EARTH_RADIUS_KM;
          return { ...d, lat, lng, alt };
        }
        return d;
      });
    }, [satData, time]);

    const satObject = useCallback(
      (data) => {
        if (!globeRadius) return undefined;
        const satGeometry = new THREE.OctahedronGeometry(SAT_SIZE * globeRadius / EARTH_RADIUS_KM / 2, 0);
        let satMaterial = new THREE.MeshLambertMaterial({ color: 'palegreen', transparent: true, opacity: 0.7 });
        if (selectedObject && selectedObject.name === data.name) {
           satMaterial = new THREE.MeshLambertMaterial({ color: 'yellow', transparent: true, opacity: 0.7 });
        }
        return new THREE.Mesh(satGeometry, satMaterial);
      },
      [globeRadius, selectedObject],
    );
    
    const onObjectClick = useCallback(
      (obj) => {
        console.log("clicked", obj)
        setSelectedObject(obj);
        globeEl.current.pointOfView({ lat: obj.lat, lng: obj.lng, altitude: 1.5}, 500);
      },
      [],
    );
    const onGlobeClick = useCallback(
        () => {
        setSelectedObject(null);
        globeEl.current.pointOfView({ altitude: 3.5 }, 500);
        },[]);

    useEffect(() => {
      setGlobeRadius(globeEl.current.getGlobeRadius());
      globeEl.current.pointOfView({ altitude: 3.5 });
    }, []);


    return (
    <ReactResizeDetector handleWidth handleHeight={true} targetRef={parentRef}>
    {({ width, height, targetRef }) => {
      return (
        <div className="w-full h-full" ref={targetRef}>
      <Globe
        width={width}
        height={height}
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        objectsData={objectsData}
        objectLabel="name"
        objectLat="lat"
        objectLng="lng"
        objectAltitude="alt"
        objectFacesSurface={false}
        objectThreeObject={satObject}
        onObjectClick={onObjectClick}
        onGlobeClick={onGlobeClick}
      />
      <div id="time-log" className="absolute bottom-1 right-1 bg-slate-50/50 text-xs font-sans rounded-sm p-1 transpar">{time.toUTCString()}</div>
      </div>
          )
        }}
      </ReactResizeDetector>
    );
  };