import {create} from 'zustand'

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
        for (let cluster of clusterData) {
            const url = CLUSTER_KUBEAPI_URL[cluster["name"]] + NODE_PATH + VK_PARAM;
            const response = await fetch(url,{mode:"cors"});
            const data = await response.json();
            const nodes = data["items"];
            for (let node of nodes) {
                const satName = node["metadata"]["labels"]["satellite.satkube.io/id"];
                nodeNames[node["metadata"]["name"]] = satName;
                nodeNames[satName] = node["metadata"]["name"];
                nodeToCluster[satName] = cluster["name"];
                nodeToCluster[node['metadata']['name']] = cluster["name"];
            }
        }
        set({nodeNames, nodeToCluster});
    }
}));



const useNodeDataStore = create((set) => ({
    nodesLoad: {},
    clustersLoad: {}, 
    node: {},
    fetchLoad: async () => {
        let NODE_NAMES = useClusterDataStore.getState().nodeNames;
        let clustersLoad = {};
        let nodesLoad = {};
        for (let [clusterName, peermanUrl] of Object.entries(CLUSTER_PEERMAN_URL)) {
            const response = await fetch(peermanUrl+PEERMETRICS_PATH,{mode:"cors"});
            const data = await response.json();
            const clusterData = data[clusterName];
            let clusterLoad = {
                allocatable: clusterData['allocatable'],
                request: clusterData['request'],
                limit: clusterData['limit'],
            };
            clustersLoad[clusterName] = clusterLoad;
            // for (let [nodeName, nodeData] of Object.entries(clusterData.nodeMetrics)) {
            //     if (!(nodeName in NODE_NAMES)) {
            //         continue
            //     }
            //     let nodeLoad = {
            //         allocatable: nodeData['allocatable'],
            //         request: nodeData['request'],
            //         limit: nodeData['limit'],
            //     };
            //     nodesLoad[NODE_NAMES[nodeName]] = nodeLoad;
            // }
        }
        set({nodesLoad, clustersLoad});
    },
    fetchNode: async (nodeName) => {
        console.log("fetching node data")
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
            node["pods"].push({
                "name": pod["metadata"]["name"],
                "phase": pod["status"]["phase"],
                "nodeName": NODE_NAMES[pod["spec"]["nodeName"]],
            });
        }
        set({node});
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
                return job['metadata']['labels']['computejob.satkube.io/phase'] != "rescheduled";
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
                    data['pathNodes'] = {...data['pathNodes'], ...mp['status']['currentPathNodes']}
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
        console.log({computeJobs, pods, lowLatServiceJobs, migrationprocesses});
        console.log({resultCjs, resultLls})
        set({computeJobs: resultCjs, lowLatServiceJobs: resultLls, fetching: false});

    },
    
}));

const useFocusSatellite = create((set) => ({
    focusedSatellite: "",
    focus: (focusedSatellite) => {
        set({focusedSatellite});
    },
}));

export {useTabStatusStore, useClusterDataStore, useFocusSatellite, useJobDataStore
,useNodeDataStore}