import { Accordion, Button, Card, Spinner } from "flowbite-react";
import { useJobDataStore, useClusterDataStore, useFocusSatellite } from "./Store";
import { HiX } from "react-icons/hi";
import { useEffect, useState } from "react";
import { create } from "zustand";

const useWindowToggle = create((set) => ({
    show: false,
    toggle: () => set(state => ({ show: !state.show })),
    open: () => set({ show: true }),
    close: () => set({ show: false }),
}));


function InfoWindow(props) {

    const show = useWindowToggle(state => state.show);
    const closeWindow = useWindowToggle(state => state.close);
    return (
        <div>
            {show && (
                <div className="fixed top-5 right-5 w-1/4 h-fit max-h-screen rounded-md bg-slate-100 shadow-md p-4">
                    <div className="relative">
                        <HiX className="absolute top-0 right-0" onClick={() => { closeWindow() }}> </HiX>
                        <p className="font-bold align-middle">{props.title}</p>
                        <div>{props.content()}</div>
                    </div>
                </div>
            )}
        </div>

    );
}


export default function Jobs(props) {

    const fetchJobData = useJobDataStore(state => state.fetch);
    const fetching = useJobDataStore(state => state.fetching);
    const computeJobs = useJobDataStore(state => state.computeJobs);
    const lowLatServiceJobs = useJobDataStore(state => state.lowLatServiceJobs);
    const show = useWindowToggle(state => state.show);
    const openWindow = useWindowToggle(state => state.open);
    const [windowInfo, setWindowInfo] = useState({});
    const setFocusedSatellite = useFocusSatellite(state => state.focus);

    const onPodButtonClick = (pod) => {
        console.log(pod)
        openWindow();
        setWindowInfo({
            title: "Pod Info: " + pod.name,
            content: () => {
                return (
                    <div>
                        <div>Name: {pod.name}</div>
                        <div>Phase: {pod.phase}</div>
                        {pod.nodeName && (() => {
                            setFocusedSatellite(pod.nodeName)
                            return (
                                <div>Node: {pod.nodeName}</div>
                            );
                        })()}
                    </div>
                );
            }
        });
    }
    const onPathNodeButtonClick = (pathNode, realNode) => {
        openWindow();
        console.log("pathNode", pathNode)
        setWindowInfo({
            title: ("PathNode Info: " + pathNode.id),
            content: () => {
                return (
                    <div>
                        <div>Name: {pathNode.id}</div>
                        <div>Begin Time: {pathNode.beginTime}</div>
                        <div>End Time: {pathNode.endTime}</div>
                        <div>Cluster: {pathNode.clusterId}</div>
                        {realNode && (<div>Status: {realNode.status}</div>)}
                        <div>Prefered Nodes:</div>
                        {pathNode.preferedSatIds && <div className="flex flex-wrap">
                            {(() => {
                                return pathNode.preferedSatIds.map((id) => {
                                    return (
                                        <div key={id}>
                                            <Button size='xs' onClick={() => setFocusedSatellite(id)}>{id}</Button>
                                        </div>
                                    );
                                });
                            })()}
                        </div>}
                    </div>
                );
            }
        });
    };
    const computeJobInfo = Object.values(computeJobs).map((job) => {
        const scheduledPath = job.scheduledPath.map((cluster, index) => {
            return (
                <div key={job.name + cluster + index.toString()} >
                    <Button size='xs'>{cluster}</Button>
                </div>
            );
        });
        const pods = job.pods.map((pod) => {
            return (
                <div key={pod.name} >
                    <Button size='xs' onClick={() => onPodButtonClick(pod)}>{pod.name}</Button>
                </div>
            );
        });
        return (
            <div key={job.name}>
                <Card>
                    <p>Name: {job.name}</p>
                    <p>Create Time: {job.createTime}</p>
                    <p>Phase: {job.phase}</p>
                    <p>Cluster {job.cluster}</p>
                    <p>Path: </p>
                    <div className="flex flex-wrap max-w-full"> {scheduledPath}</div>
                    <p>Pods: </p>
                    <div className="flex flex-wrap max-w-full"> {pods}</div>
                </Card>
            </div>
        );
    });

    const lowLatServiceJobInfo = Object.values(lowLatServiceJobs).map((job) => {
        if (job.path === undefined) {
            return (<div></div>);
        }
        const pathNodes = job.path.map((node, index) => {
            const realNode = job.pathNodes[index.toString()]

            return (
                <div key={node.id}>
                    {(() => {
                        if (realNode === undefined) {
                            return <Button size='xs' color="gray" onClick={() => onPathNodeButtonClick(node, realNode)}>{node.id}</Button>
                        } else if (realNode.status === "Serving") {
                            return <Button size='xs' color='success' onClick={() => onPathNodeButtonClick(node, realNode)}>{node.id}</Button>
                        } else if (realNode.status === "Warmup") {
                            return <Button size='xs' color='warning' onClick={() => onPathNodeButtonClick(node, realNode)}>{node.id}</Button>
                        } else {
                            return <Button size='xs' onClick={() => onPathNodeButtonClick(node, realNode)}>{node.id}</Button>
                        }
                    })()}
                </div>
            );
        });
        const pods = job.pods.map((pod) => {
            return (
                <div key={pod.name} >
                    <Button size='xs' onClick={() => onPodButtonClick(pod)}>{pod.name}</Button>
                </div>
            );
        });
        return (
            <div key={job.name}>
                <Card>
                    <p>Name: {job.name}</p>
                    <p>Submit Time: {job.submitTime}</p>
                    <p>Submit Location: {job.submitLocation}</p>
                    <p>Phase: {job.phase}</p>
                    <p>Path: </p>
                    <div className="flex flex-wrap max-w-full"> {pathNodes}</div>
                    <p>Pods: </p>
                    <div className="flex flex-wrap max-w-full"> {pods}</div>
                </Card>
            </div>
        );
    });

    return (
        <div className="max-h-full w-full h-full overflow-y-auto overflow-x-hidden">
            <InfoWindow show={show} {...windowInfo} />
            <div className="flex flex-row max-w-full justify-between">
                <Button onClick={() => fetchJobData()}>
                    Refresh
                </Button>
                {fetching && <Spinner />}
            </div>
            <Accordion flush={true} collapseAll={true}>
                <Accordion.Panel>
                    <Accordion.Title>离线处理任务</Accordion.Title>
                    <Accordion.Content>
                        {computeJobInfo}
                    </Accordion.Content>
                </Accordion.Panel>
                <Accordion.Panel>
                    <Accordion.Title>在线流式计算任务</Accordion.Title>
                    <Accordion.Content>
                        {lowLatServiceJobInfo}
                    </Accordion.Content>
                </Accordion.Panel>
            </Accordion>
        </div>
    );
}