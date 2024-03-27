import { useEffect } from "react";
import {useFocusSatellite, useSatelliteDataStore} from "./Store";

export default function Satellite(props) {


    const focusedSatellite = useFocusSatellite(state => state.focusedSatellite);
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
                    <p className="font-bold">Satellite ID：</p>
                    <div>
                        <p className="times-new-roman">{focusedSatellite}</p>
                    </div>
                </div>
            </div>

            <br></br>

            {focusedSatellite !== "" && (() => {
                return (
                    <div>
                        <div><p className="font-bold">Cluster</p>
                            <div>
                                <p className="times-new-roman">{currentSat.cluster}</p>
                            </div>
                        </div>

                        <br></br>

                        <div><p className="font-bold">Subpoint Coordinate:</p>
                            <div>
                                <p className="times-new-roman">({currentSat.lat}, {currentSat.lon})</p>
                            </div>
                        </div>

                        <br></br>

                        <div><p className="font-bold">Time:</p>
                            <div>
                                <p className="times-new-roman">UTC Time: {currentSat.utc_time} </p>
                                <p className="times-new-roman">Local Time: {currentSat.local_time}</p>
                            </div>
                        </div>

                        <br></br>

                        <div><p className="font-bold">Predicted Load Value:</p>
                            <div>
                                <p className="times-new-roman">{currentSat.region_load}</p>
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