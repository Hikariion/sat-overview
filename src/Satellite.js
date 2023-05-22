import { useEffect } from "react";
import { useFocusSatellite, useNodeDataStore } from "./Store";
import { Button } from "flowbite-react";

export default function Satellite(props) {


    const focusedSatellite = useFocusSatellite(state => state.focusedSatellite);
    const currentNode = useNodeDataStore(state => state.node);
    const fetchNode = useNodeDataStore(state => state.fetchNode);

    useEffect(() => {
        if (focusedSatellite) {
            fetchNode(focusedSatellite);
        }
    }, [focusedSatellite]);
    // show pods in this satellite
    return (
        <div>
            <div>Satellite: {focusedSatellite}</div>
            {focusedSatellite !== "" && (() => {
                return (
                    <div>
                        <div><p className="font-bold">allocatable:</p>
                            <div>
                                cpu: {currentNode.allocatable && currentNode.allocatable.cpu} mCPU
                            </div>
                            <div>
                                mem: {currentNode.allocatable && (currentNode.allocatable.memory / 1024)} MB
                            </div>
                        </div>
                        <div><p className="font-bold">request:</p>
                            <div>
                                cpu: {currentNode.request && currentNode.request.cpu} mCPU
                            </div>
                            <div>
                                mem: {currentNode.request && (currentNode.request.memory / 1024)} MB
                            </div>
                        </div>
                        <div><p className="font-bold">limit:</p>
                            <div>
                                cpu: {currentNode.limit && currentNode.limit.cpu} mCPU
                            </div>
                            <div>
                                mem: {currentNode.limit && (currentNode.limit.memory / 1024)} MB
                            </div>
                        </div>
                        <div><p className="font-bold">Pods:</p>
                            {currentNode.pods && (() => {
                                return currentNode.pods.map((pod) => {
                                    return (
                                        <div>
                                            <Button>{pod.name}</Button>
                                        </div>
                                    );
                                })
                            })()}
                        </div>
                    </div>

                );

            })()}
        </div>
    );
}