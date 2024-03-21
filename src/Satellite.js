import { useEffect } from "react";
import {useFocusSatellite, useNodeDataStore, useSatelliteDataStore} from "./Store";
import { Button } from "flowbite-react";

export default function Satellite(props) {


    const focusedSatellite = useFocusSatellite(state => state.focusedSatellite);
    const currentNode = useNodeDataStore(state => state.node);
    const fetchNode = useNodeDataStore(state => state.fetchNode);
    const currentSat = useSatelliteDataStore(state => state.satellite)
    const fetchSatByName = useSatelliteDataStore(state => state.fetchSatByName)


    useEffect(() => {
        if (focusedSatellite) {
            fetchSatByName(focusedSatellite);
        }

        const intervalId = setInterval(() => {
            if (focusedSatellite) {
                fetchSatByName(focusedSatellite);
            }
        }, 1000); // 1000 ms is equal to 1 second

        // Clear interval on component unmount or if the dependency changes
        return () => clearInterval(intervalId);
    }, [focusedSatellite]);

    // show pods in this satellite
    return (
        <div>
            <div>
                <div>
                    <p className="font-bold">Satellite ID：{focusedSatellite}</p>
                </div>
            </div>

            <br></br>

            {focusedSatellite !== "" && (() => {
                return (
                    <div>
                        <div><p className="font-bold">星下点坐标:</p>
                            <div>
                                ({currentSat.lat}, {currentSat.lon})
                            </div>
                        </div>

                        <br></br>

                        <div><p className="font-bold">星下点所处时刻:</p>
                            <div>
                                {currentSat.time}
                            </div>
                        </div>

                        <br></br>

                        <div><p className="font-bold">负载指数:</p>
                            <div>
                                L: {currentSat.region_load}
                            </div>
                        </div>

                        <br></br>

                        {/*<div><p className="font-bold">Pods:</p>*/}
                        {/*    {currentNode.pods && (() => {*/}
                        {/*        return currentNode.pods.map((pod) => {*/}
                        {/*            return (*/}
                        {/*                <div>*/}
                        {/*                    <Button>{pod.name}</Button>*/}
                        {/*                </div>*/}
                        {/*            );*/}
                        {/*        })*/}
                        {/*    })()}*/}
                        {/*</div>*/}
                    </div>

                );

            })()}
        </div>
    );
}