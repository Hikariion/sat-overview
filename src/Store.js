import {create} from 'zustand'
import urlJoin from "url-join";


const BACKEND_URL = "http://localhost:5000/"
const satInfoUrl = urlJoin(BACKEND_URL, "satinfo")
const computeJobInfoUrl = urlJoin(BACKEND_URL, "get_all_job_info")
const streamJobInfoUrl = urlJoin(BACKEND_URL, "get_all_streaming_jobs")


const useTabStatusStore = create((set) => ({
    activeTab: 0,
    setActiveTab: (activeTab) => set({activeTab}),
}));

const useClusterDataStore = create((set, get) => ({
    clusterData: [],
    nodeNames: {},
    nodeToCluster: {},
    fetch: async (url) => {
        console.log("fetching cluster data")
        const response = await fetch(url,{mode:"cors"});
        const data = await response.json();
        console.log(data)
        set({clusterData: Object.values(data["clusters"])})
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
            region_load: data['region_load'],
            cluster: data['cluster']
        };

        set({satellite})
    },

}));

const useMyJobDataStore = create((set) => ({
    fetching: false,
    unGeoComputeJobs: {},
    lowLatStreamingJobs: {},

    fetch: async(showAllJob) => {
        set({fetching: true});
        console.log("show All Job")
        console.log(showAllJob)
        let unGeoComputeJobs = {};
        let lowLatStreamingJobs = {};
        let migrationProcesses = {};
        let resultCjs = {};
        let resultLls = {};

        // computeJob info
        const response1 = await fetch(computeJobInfoUrl,{mode:"cors"});
        const data1 = await response1.json();


        for (let [key, job] of Object.entries(data1)) {
            if (!showAllJob) {
                if (job["phase"] === "completed") {
                    continue
                }
            }
            let containers = []
            containers.push(job["container"])

            resultCjs[job["job_id"]] = {
                "jobName": job["job_name"],
                "jobId": job["job_id"],
                "createTime": job["create_time"],
                "phase": job["phase"],
                "scheduledPath": job["scheduled_path"],
                "container": containers
            }
        }

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


const useFocusSatellite = create((set) => ({
    focusedSatellite: "",
    focus: (focusedSatellite) => {
        set({focusedSatellite: focusedSatellite});
    },
}));

const useSatelliteNamesToDisplay = create((set) => ({
    satelliteNamesToDisplay: [],
    setSatelliteNamesToDisplay: (satelliteNames) => {
        set({satelliteNamesToDisplay: satelliteNames})
    }
}));

export {useTabStatusStore, useClusterDataStore, useFocusSatellite, useSatelliteDataStore, useMyJobDataStore, useSatelliteNamesToDisplay}