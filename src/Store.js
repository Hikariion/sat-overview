import {create} from 'zustand'
import urlJoin from "url-join";

const CLUSTER_KUBEAPI_URL = {
    "custom1-cluster-0": "http://192.168.103.130:8002",
    "custom1-cluster-1": "http://192.168.103.131:8002",
    "custom1-cluster-2": "http://192.168.103.132:8002",
    "custom1-cluster-3": "http://192.168.103.133:8002",
    "custom1-cluster-4": "http://192.168.103.134:8002",
    "custom1-cluster-5": "http://192.168.103.135:8002",
}

const CLUSTER_PEERMAN_URL = {
    "custom1-cluster-0": "http://192.168.103.130:8002",
    "custom1-cluster-1": "http://192.168.103.131:8002",
    "custom1-cluster-2": "http://192.168.103.132:8002",
    "custom1-cluster-3": "http://192.168.103.133:8002",
    "custom1-cluster-4": "http://192.168.103.134:8002",
    "custom1-cluster-5": "http://192.168.103.135:8002",
}


const BACKEND_URL = "http://localhost:5000/"
const satInfoUrl = urlJoin(BACKEND_URL, "satinfo")
const streamJobInfoUrl = urlJoin(BACKEND_URL, "get_all_streaming_jobs")


const POD_PATH = "/api/v1/namespaces/default/pods";
const NODE_PATH = "/api/v1/nodes";
const NODE_NAME_PARAM = "?labelSelector=satellite.satkube.io%2Fid%3D";
const VK_PARAM = "?labelSelector=type%3Dvirtual-kubelet";
const COMPUTEJOB_PATH = "/apis/satkube.satkube.io/v1alpha1/namespaces/default/computejobs";
const LOWLATSERVICEJOB_PATH = "/apis/satkube.satkube.io/v1alpha1/namespaces/default/lowlatencyservicejobs";
const MIGRATIONPROCESSES_PATH = "/apis/satkube.satkube.io/v1alpha1/namespaces/default/migrationprocesses";
const PEERMETRICS_PATH = "/peerman/peermetrics";
const POD_NODE_PARAM = "?fieldSelector=spec.nodeName%3D";

const useTabStatusStore = create((set) => ({
    activeTab: 0,
    setActiveTab: (activeTab) => set({activeTab}),
}));

const useClusterDataStore = create((set, get) => ({
    clusterData: [],
    peerRelation: {},
    nodeNames: {},
    nodeToCluster: {},
    fetch: async (url) => {
        console.log("fetching cluster data")
        const response = await fetch(url,{mode:"cors"});
        const data = await response.json();
        console.log(data)
        set({clusterData: Object.values(data["clusters"]), peerRelation: data["peerRelations"]})
    },
    fetchNodeNames: async (url) => {
        const response1 = await fetch(url,{mode:"cors"});
        const data1 = await response1.json();
        const clusterData = Object.values(data1["clusters"]);
        if (clusterData.length === 0) {
            return;
        }
        let nodeNames = {};
        let nodeToCluster = {};
        // for (let cluster of clusterData) {
        //     const url = CLUSTER_KUBEAPI_URL[cluster["name"]] + NODE_PATH + VK_PARAM;
        //     const response = await fetch(url,{mode:"cors"});
        //     const data = await response.json();
        //     const nodes = data["items"];
        //     for (let node of nodes) {
        //         const satName = node["metadata"]["labels"]["satellite.satkube.io/id"];
        //         nodeNames[node["metadata"]["name"]] = satName;
        //         nodeNames[satName] = node["metadata"]["name"];
        //         nodeToCluster[satName] = cluster["name"];
        //         nodeToCluster[node['metadata']['name']] = cluster["name"];
        //     }
        // }
        set({nodeNames, nodeToCluster});
    }
}));


const useSatelliteDataStore = create((set) => ({
    satellite: {},
    fetchSatByName: async (satName) => {
        console.log(`fetching sat: ${satName} data`);

        let requestUrl = urlJoin(satInfoUrl, satName);
        const response = await fetch(requestUrl, {mode:"cors"})
        let data = await response.json()

        let satellite = {
            name: satName,
            lat: data['lat'],
            lon: data['lon'],
            local_time: data['local_time'],
            utc_time: data['utc_time'],
            region_load: data['region_load']
        };

        set({satellite})

    },

}));

const useNodeDataStore = create((set) => ({
    nodesLoad: {},
    clustersLoad: {}, 
    node: {},
    fetchNode: async (nodeName) => {
        console.log(`fetching sat: ${nodeName} data`)
        let NODE_NAMES = useClusterDataStore.getState().nodeNames;
        let NODE_TO_CLUSTER = useClusterDataStore.getState().nodeToCluster;
        const kubeapiUrl = CLUSTER_KUBEAPI_URL[NODE_TO_CLUSTER[nodeName]];
        const response = await fetch(kubeapiUrl+NODE_PATH+NODE_NAME_PARAM+nodeName,{mode:"cors"});
        let data = await response.json();
        data = data['items'][0];
        let node = {
            name: nodeName,
            phase: data['status']['phase'],
        };
        const peermanUrl = CLUSTER_PEERMAN_URL[NODE_TO_CLUSTER[nodeName]];
        const response2 = await fetch(peermanUrl+PEERMETRICS_PATH,{mode:"cors"});
        const data2 = await response2.json();
        const clusterData = data2[NODE_TO_CLUSTER[nodeName]]['nodeMetrics'][NODE_NAMES[nodeName]];
        node['allocatable'] = clusterData['allocatable'];
        node['request'] = clusterData['request'];
        node['limit'] = clusterData['limit'];
        node['pods'] = [];
        console.log(node);
        const response3 = await fetch(kubeapiUrl+POD_PATH+POD_NODE_PARAM+NODE_NAMES[nodeName],{mode:"cors"});
        const data3 = await response3.json();
        const pods = data3['items'];
        for (let pod of pods) {
            if (pod["status"]["phase"] === "Running") {
                node["pods"].push({
                    "name": pod["metadata"]["name"],
                    "phase": pod["status"]["phase"],
                    "nodeName": NODE_NAMES[pod["spec"]["nodeName"]],
                });
            }
        }
        set({node});
    },
}));

const useMyJobDataStore = create((set) => ({
    unGeoComputeJobs: {},
    lowLatStreamingJobs: {},



    fetch: async() => {
        set({fetching: true});
        let unGeoComputeJobs = {};
        let lowLatStreamingJobs = {};
        let migrationProcesses = {};
        let resultCjs = {};
        let resultLls = {};

        // computeJob info
        let computeJobInfoUrl = urlJoin(BACKEND_URL, "jobinfo")
        // const response = await fetch(computeJobInfoUrl,{mode:"cors"});
        // const data = await response.json();

        resultCjs['Compute Job 1'] = {
            "jobId": '12324234',
            "createTime": "2024 03 23 16:40",
            "phase": "running",
            "scheduledPath": ["satellite 1", "satellite 2"],
            "container": [
                {"name": "Compute Job 1 Container", "imageName": "test_imageName", "fileName": "file_A", "nodeName": "custom1-sat-5-5"},
            ]
        };

        resultCjs['Compute Job 2'] = {
            "jobId": '4234234',
            "createTime": "2024 03 23 16:40",
            "phase": "running",
            "image": "test_image",
            "scheduledPath": ["satellite 1", "satellite 2"],
            "container": [
                {"name": "Compute Job 2 Container", "imageName": "test_image", "fileName": "file_B", "nodeName": "custom1-sat-3-2"},
            ]
        };



        // lowLatStreamingJob info

        function formatLatLon(submitLatStr, submitLonStr) {
            // 将纬度和经度的字符串转换成浮点数
            const submitLat = parseFloat(submitLatStr);
            const submitLon = parseFloat(submitLonStr);

            // 确定纬度方向
            let latDirection = submitLat >= 0 ? "N" : "S";
            // 确定经度方向
            let lonDirection = submitLon >= 0 ? "E" : "W";

            // 绝对值，用于移除负号
            const latAbs = Math.abs(submitLat);
            const lonAbs = Math.abs(submitLon);

            // 创建带方向的纬度和经度字符串
            const formattedLat = latAbs + "° " + latDirection;
            const formattedLon = lonAbs + "° " + lonDirection;

            // 拼接最终的字符串
            return "(" + formattedLat + ", " + formattedLon + ")";
        }

        function updatePathNodesStatus(pathNodesObj) {
            const now = new Date();

            // 定义一个变量，用于标记是否找到第一个'serving'状态的节点
            let foundServing = false;

            // 将pathNodes对象的所有值转换为数组进行遍历
            const pathNodes = Object.values(pathNodesObj);

            for (let i = 0; i < pathNodes.length; i++) {
                const beginTime = new Date(pathNodes[i].begin_time_str);
                const endTime = new Date(pathNodes[i].end_time_str);

                if (now >= beginTime && now <= endTime) {
                    pathNodes[i].status = 'serving';
                    foundServing = true;
                    // 设置下一个节点的状态为 'warming'，如果存在的话
                    if (i + 1 < pathNodes.length) {
                        pathNodes[i + 1].status = 'warming';
                    }
                    // 找到第一个 'serving' 状态后跳出循环
                    break;
                } else if (now > endTime) {
                    pathNodes[i].status = 'finished';
                }
                // 如果当前节点是 'finished'，则继续检查下一个节点，直到找到 'serving' 或者列表结束
            }

            // 如果没有找到 'serving' 状态的节点，且至少有一个节点被标记为 'finished'，则最后一个 'finished' 状态的节点后面的节点应标记为 'warming'
            if (!foundServing && pathNodes.some(node => node.status === 'finished')) {
                const lastFinishedIndex = pathNodes.reduce((acc, node, index) => (node.status === 'finished' ? index : acc), -1);
                if (lastFinishedIndex >= 0 && lastFinishedIndex + 1 < pathNodes.length) {
                    pathNodes[lastFinishedIndex + 1].status = 'warming';
                }
            }
            return pathNodesObj
        }

        const response2 = await fetch(streamJobInfoUrl,{mode:"cors"});
        const data2 = await response2.json();

        for (let [key, job] of Object.entries(data2)) {
            // console.log(job)
            resultLls[job["stream_job_id"]] = {
                "stream_job_id": job["stream_job_id"],
                "submitTime": job["submit_utc_time_str"],
                "submitLocation": formatLatLon(job["submit_lat"], job["submit_lon"]),
                "phase": "running",
                "path": job["path"],
                "pathNodes": updatePathNodesStatus(job["pathNode"])
            }
        }


        console.log({resultCjs, resultLls})
        set({unGeoComputeJobs: resultCjs, lowLatStreamingJobs: resultLls, fetching: false});
        console.log({unGeoComputeJobs, lowLatStreamingJobs, migrationProcesses});
    },
}));

const useJobDataStore = create((set) => ({
    computeJobs: {},
    lowLatServiceJobs: {},
    fetching: false,
    fetch: async () => {
        set({fetching: true});
        let computeJobs = {};
        let lowLatServiceJobs = {};
        let migrationprocesses = {};
        let pods = {};
        let resultCjs = {};
        let resultLls = {};
        for (let [clusterName, kubeapiUrl] of Object.entries(CLUSTER_KUBEAPI_URL)) {
            const computeJobUrl = kubeapiUrl + COMPUTEJOB_PATH;
            const lowLatServiceJobUrl = kubeapiUrl + LOWLATSERVICEJOB_PATH;
            const podUrl = kubeapiUrl + POD_PATH;
            const response = await fetch(computeJobUrl,{mode:"cors"});
            const data = await response.json();
            computeJobs[clusterName] = data["items"].filter((job) => {
                return job['metadata']['labels']['computejob.satkube.io/phase'] !== "rescheduled";
            });
            const response2 = await fetch(lowLatServiceJobUrl,{mode:"cors"});
            const data2 = await response2.json();
            lowLatServiceJobs[clusterName] = data2["items"];
            const response3 = await fetch(podUrl,{mode:"cors"});
            const data3 = await response3.json();
            pods[clusterName] = data3["items"].filter((pod) => {
                return pod['metadata']['name'].includes("lls-") || pod['metadata']['name'].includes("compute");
            });
            const migrationprocessUrl = kubeapiUrl + MIGRATIONPROCESSES_PATH;
            const response4 = await fetch(migrationprocessUrl,{mode:"cors"});
            const data4 = await response4.json();
            migrationprocesses[clusterName] = data4["items"];
        }
        // process compute jobs
        for (let [clusterName, jobs] of Object.entries(computeJobs)) {
            for (let job of jobs) {
                let data = {
                    "name": job["metadata"]["name"],
                    "cluster": clusterName,
                    "createTime": job["metadata"]["creationTimestamp"],
                    "phase": job["metadata"]["labels"]["computejob.satkube.io/phase"],
                    "scheduledPath": job["spec"]["scheduledPath"],
                    "pods": [],
                }
                let NODE_NAMES = useClusterDataStore.getState().nodeNames;
                for (let pod of pods[clusterName]) {
                    if (pod["metadata"]["name"].includes(job["metadata"]["name"])) {
                        data["pods"].push({
                            "name": pod["metadata"]["name"],
                            "phase": pod["status"]["phase"],
                            "nodeName": NODE_NAMES[pod["spec"]["nodeName"]],
                        });
                    }
                }
                resultCjs[data["name"]] = data;
            }
        }
        for (let [clusterName, jobs] of Object.entries(lowLatServiceJobs)) {
            for (let job of jobs) {
                if (job["metadata"]["name"] in resultLls) {
                    continue
                }
                let data = {
                    "name": job["metadata"]["name"],
                    "submitTime": job["metadata"]["creationTimestamp"],
                    "submitLocation": job["spec"]["submitLocation"]["lat"]+","+ job["spec"]["submitLocation"]["lon"],
                    "phase": job["metadata"]["labels"]["lowlatservice.satkube.io/phase"],
                    "pods": [],
                    "pathNodes": {},
                }
                resultLls[data["name"]] = data;
            }
        }
        for (let [clusterName, mps] of Object.entries(migrationprocesses)) {
            for (let mp of mps) {
                let data = {}
                if (mp["metadata"]["name"] in resultLls) {
                    data = resultLls[mp["metadata"]["name"]];
                    data['path'] = mp['spec']['path'];
                    if (mp['status'] !== undefined) {
                        data['pathNodes'] = {...data['pathNodes'], ...mp['status']['currentPathNodes']}
                    }
                } else {
                    continue
                }
                let NODE_NAMES = useClusterDataStore.getState().nodeNames;
                for (let pod of pods[clusterName]) {
                    if (pod["metadata"]["name"].includes(mp["metadata"]["name"])) {
                        data["pods"].push({
                            "name": pod["metadata"]["name"],
                            "phase": pod["status"]["phase"],
                            "nodeName": NODE_NAMES[pod["spec"]["nodeName"]],
                        });
                    }
                }
            }
        }
        // for (let job of Object.values(resultLls)) {
        //     let pathNodeArray = [];
        //     for (let [id, node] of Object.entries(job['pathNodes'])) {
        //         pathNodeArray.push({
        //             "windowId": parseInt(id),
        //             ...node,
        //         });
        //     }
        //     pathNodeArray.sort((a, b) => {
        //         return a['id'] - b['id'];
        //     });
        //     job['pathNodes'] = pathNodeArray;
        // }
        console.log({resultCjs, resultLls})
        set({computeJobs: resultCjs, lowLatServiceJobs: resultLls, fetching: false});

    },
    
}));


const useFocusSatellite = create((set) => ({
    focusedSatellite: "",
    focus: (focusedSatellite) => {
        set({focusedSatellite: focusedSatellite});
    },
}));

export {useTabStatusStore, useClusterDataStore, useFocusSatellite, useJobDataStore
,useNodeDataStore, useSatelliteDataStore, useMyJobDataStore}