import React from "react";
import ReactResizeDetector from 'react-resize-detector';
import Globe from "react-globe.gl";
import * as THREE from 'three';
import {twoline2satrec, propagate, gstime, eciToEcf, eciToGeodetic, radiansToDegrees} from 'satellite.js';
import {useFocusSatellite, useTabStatusStore} from './Store';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const EARTH_RADIUS_KM = 6371; // km
const SAT_SIZE = 300; // km
const TIME_STEP = 1000; // per frame
const TLE_URL = 'http://localhost:9091/tles/custom1-gen.txt'

export default function World_back(props) {
    const globeEl = useRef();
    const parentRef = useRef();
    const [satData, setSatData] = useState();
    const [satInfo, setSatInfo] = useState([]);
    const [globeRadius, setGlobeRadius] = useState();
    const focusedSatellite = useFocusSatellite(state => state.focusedSatellite);
    const setFocusedSatellite = useFocusSatellite(state => state.focus);
    const [time, setTime] = useState(new Date());
    const setActiveTab = useTabStatusStore(state => state.setActiveTab);

    useEffect(() => {
        let t = new Date();
        let currentUTC = new Date(t.getTime() + t.getTimezoneOffset() * 60 * 1000);

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

    // load satellite data from backend
    // useEffect(() => {
    //   // load satellite data
    //   fetch(TLE_URL, {mode:"cors"}).then(r => r.text()).then(rawData => {
    //     const tleData = rawData.replace(/\r/g, '')
    //       .split(/\n(?=[^12])/)
    //       .filter(d => d)
    //       .map(tle => tle.split('\n'));
    //     const satData = tleData.map(([name, ...tle]) => ({
    //       satrec: twoline2satrec(...tle),
    //       name: name.trim().replace(/^0 /, '')
    //     }))
    //     // exclude those that can't be propagated
    //     .filter(d => !!propagate(d.satrec, new Date()).position)
    //     .slice(0, 1500);
    //     setSatInfo(satData.map(d => d.name));
    //     setSatData(satData);
    //
    //   });
    // }, []);

    useEffect(() => {
        // load satellite data
        fetch('/custom1-gen.txt').then(r => r.text()).then(rawData => {
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
            setSatInfo(satData.map(d => d.name));
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
    }, [time, satData]);



    const meshes = useMemo(() => {
        if (!globeRadius) return undefined;
        const materials = {
            default: new THREE.MeshLambertMaterial({ color: 'palegreen', transparent: true, opacity: 0.7 }),
            active: new THREE.MeshLambertMaterial({ color: 'yellow', transparent: true, opacity: 0.7 }),
        }
        const satGeometry =  new THREE.OctahedronGeometry(SAT_SIZE * globeRadius / EARTH_RADIUS_KM / 2, 0);
        let result = {}
        satInfo.forEach((satName) => {
            result[satName] = {
                default: new THREE.Mesh(satGeometry, materials.default),
                active: new THREE.Mesh(satGeometry, materials.active),
            }
        })
        console.log("meshes", result)
        return result;
    }, [globeRadius, satInfo]);

    const satObject = useCallback(
        (data) => {
            if (!meshes) return undefined;
            if (data.name === focusedSatellite) {
                return meshes[data.name].active;
            }

            return meshes[data.name].default;
        },
        [focusedSatellite, meshes],
    );

    const onObjectClick = useCallback(
        (obj) => {
            console.log("clicked", obj)
            setFocusedSatellite(obj.name);
            setActiveTab(2);
            globeEl.current.pointOfView({ lat: obj.lat, lng: obj.lng, altitude: 2}, 500);
        },
        [setActiveTab, setFocusedSatellite],
    );
    const onGlobeClick = useCallback(
        () => {
            setFocusedSatellite("");
            setActiveTab(0);
            globeEl.current.pointOfView({ altitude: 3 }, 500);
        },[setActiveTab, setFocusedSatellite]);

    useEffect(() => {
        setGlobeRadius(globeEl.current.getGlobeRadius());
        globeEl.current.pointOfView({ altitude: 3 });
    }, []);

    useEffect(() => {
        if (focusedSatellite !== "") {
            const obj = objectsData.find(d => d.name === focusedSatellite);
            if (obj) {
                globeEl.current.pointOfView({ lat: obj.lat, lng: obj.lng, altitude: 2}, 500);
            }
        }
    }, [focusedSatellite]);


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