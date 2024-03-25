import { Accordion, Button, Card, Spinner } from "flowbite-react";
import { useFocusSatellite, useMyJobDataStore} from "./Store";
import { HiX } from "react-icons/hi";
import { useState } from "react";
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

    // const fetchJobData = useJobDataStore(state => state.fetch);
    const fetchJobData = useMyJobDataStore(state => state.fetch)
    const fetching = useMyJobDataStore(state => state.fetching);
    const show = useWindowToggle(state => state.show);
    const openWindow = useWindowToggle(state => state.open);
    const [windowInfo, setWindowInfo] = useState({});
    const setFocusedSatellite = useFocusSatellite(state => state.focus);

    const unGeoComputeJobs = useMyJobDataStore(state => state.unGeoComputeJobs)
    const lowLatStreamingJobs = useMyJobDataStore(state => state.lowLatStreamingJobs)

    const onPodButtonClick = (container) => {
        console.log(container)
        openWindow();
        setWindowInfo({
            title: "Container Info: ",
            content: () => {
                return (
                    <div>
                        <div>Name: {container.name}</div>
                        <div>ImageName: {container.imageName}</div>
                        <div>FileName: {container.fileName}</div>
                        {container.nodeName && (() => {
                            setFocusedSatellite(container.nodeName)
                            return (
                                <div>Node: {container.nodeName}</div>
                            );
                        })()}
                    </div>
                );
            }
        });
    }
    const onPathNodeButtonClick = (realNode) => {
        openWindow();
        console.log("pathNode", realNode.path_node_name)
        setWindowInfo({
            title: ("PathNode Info: "),
            content: () => {
                return (
                    <div>
                        <div>Name: {realNode.path_node_name}</div>
                        <div>Begin Time: <br></br>
                            {realNode.begin_time_str}
                        </div>
                        <div>End Time: <br></br>
                            {realNode.end_time_str}
                        </div>
                        {realNode.path_node_name && (() => {
                            setFocusedSatellite(realNode.path_node_name)
                            // return (
                            //     <div>Node: {container.nodeName}</div>
                            // );
                        })()}
                        {/*<div>Cluster: {pathNode.clusterId}</div>*/}
                        {/*{realNode && (<div>Status: {realNode.status}</div>)}*/}
                    </div>
                );
            }
        });
    };
    const computeJobInfo = Object.values(unGeoComputeJobs).map((job) => {
        const scheduledPath = job.scheduledPath.map((cluster, index) => {
            return (
                <div key={job.name + cluster + index.toString()} >
                    <Button size='xs'>{cluster}</Button>
                </div>
            );
        });
        const containers = job.container.map((container) => {
            return (
                <div key={container.name} >
                    <Button size='xs' color='success' onClick={() => onPodButtonClick(container)}>Focus</Button>
                </div>
            );
        });
        return (
            <div key={job.name}>
                <Card>
                    <p>Job Id: {job.jobId}</p>
                    <p>Create Time(UTC): {job.createTime}</p>
                    <p>Phase: {job.phase}</p>
                    <p>Path: </p>
                    <div className="flex flex-wrap max-w-full"> {scheduledPath} </div>
                    <p>Operate: </p>
                    <div className="flex flex-wrap max-w-full"> {containers} </div>
                </Card>
            </div>
        );
    });

    const lowLatServiceJobInfo = Object.values(lowLatStreamingJobs).map((job) => {
        if (job.stream_job_id === "" || job.stream_job_id === undefined) {
            return (<div></div>);
        }
        if (job.path === undefined) {
            return (<div></div>);
        }



        const pathNodes = Object.values(job.pathNodes).map((pathNode) => {
            return (
                <div key={pathNode.path_node_name}>
                    {(() => {
                        if (pathNode.status === "finished") {
                            return <Button size='xs' color="gray" onClick={() => onPathNodeButtonClick(pathNode)}>{pathNode.path_node_name}</Button>
                        } else if (pathNode.status === "serving") {
                            return <Button size='xs' color="success" onClick={() => onPathNodeButtonClick(pathNode)}>{pathNode.path_node_name}</Button>
                        } else if (pathNode.status === "warming") {
                            return <Button size='xs' color="warning" onClick={() => onPathNodeButtonClick(pathNode)}>{pathNode.path_node_name}</Button>
                        } else {
                            return <Button size='xs' onClick={() => onPathNodeButtonClick(pathNode)}>{pathNode.path_node_name}</Button>
                        }
                    })()}

                </div>
            );
        });

        return (
            <div key={job.stream_job_id}>
                <Card>
                    <p>Job Id: {job.stream_job_id}</p>
                    <p>Submit Time(UTC): {job.submitTime}</p>
                    <p>Submit Location: {job.submitLocation}</p>
                    <p>Phase: {job.phase}</p>
                    <p>Path: </p>
                    <div className="flex flex-wrap max-w-full"> {pathNodes} </div>
                    {/*<p>Pods: </p>*/}
                    {/*<div className="flex flex-wrap max-w-full"> {pods}</div>*/}
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
                    <Accordion.Title>Geo Unsensitive Compute Jobs</Accordion.Title>
                    <Accordion.Content>
                        {computeJobInfo}
                    </Accordion.Content>
                </Accordion.Panel>

                <Accordion.Panel>
                    <Accordion.Title>Low Latency Streaming Compute Jobs</Accordion.Title>
                    <Accordion.Content>
                        {lowLatServiceJobInfo}
                    </Accordion.Content>
                </Accordion.Panel>
            </Accordion>
        </div>
    );
}