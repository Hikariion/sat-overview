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
            <div><b>卫星ID:</b> {focusedSatellite}</div>
            {focusedSatellite !== "" && (() => {
                return (
                    <div>
                        <div><p className="font-bold">所属分组:</p>
                            {/*<div>*/}
                            {/*    cpu: {currentNode.allocatable && currentNode.allocatable.cpu} mCPU*/}
                            {/*</div>*/}
                            {/*<div>*/}
                            {/*    mem: {currentNode.allocatable && (currentNode.allocatable.memory / 1024)} MB*/}
                            {/*</div>*/}
                        </div>
                        <div><p className="font-bold">待处理任务:</p>
                            {/*{currentNode.pods && (() => {*/}
                            {/*    return currentNode.pods.map((pod) => {*/}
                            {/*        return (*/}
                            {/*            <div>*/}
                            {/*                <Button>{pod.name}</Button>*/}
                            {/*            </div>*/}
                            {/*        );*/}
                            {/*    })*/}
                            {/*})()}*/}
                        </div>
                    </div>

                );

            })()}
        </div>
    );
}