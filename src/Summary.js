import { Accordion, Card, Button, Dropdown} from "flowbite-react";
import {useClusterDataStore, useFocusSatellite, useSatelliteNamesToDisplay} from "./Store";
import { useEffect, useMemo, useState } from "react";

function ClusterInfoAccordion(props) {

    const {name, central, satellites} = props.info;
    const setFocusedSatellite = useFocusSatellite(state => state.focus);
    const [satelliteButtons, setSatelliteButtons] = useState([]);


    useEffect(() => {
        setSatelliteButtons(satellites.map((satellite) => {
            return (
                <div key={satellite.name}>
                    <Button size='sm' onClick={() => setFocusedSatellite(satellite.name)}>
                       ({satellite.plane},{satellite.index})
                    </Button>
                </div>
            )
        }));

    }, [satellites, setFocusedSatellite]);

    const satelliteButtonGroup = (
        <div className="flex flex-wrap gap-1 max-w-full overflow-x-hidden">
            {satelliteButtons}
        </div>
    );

    return (
        <Accordion key={name} flush={true} collapseAll={true}>
            <Accordion.Panel>
                <Accordion.Title>
                    <div>

                        {name}
                    </div>
                </Accordion.Title>
                <Accordion.Content>
                    <p>Satellites:</p>
                    <div className="w-full">{satelliteButtonGroup}</div>
                </Accordion.Content>
            </Accordion.Panel>

        </Accordion>
    );
}

export default function Summary(props) {

    const clusterData = useClusterDataStore(state => state.clusterData);

    // 状态用于跟踪选中的集群名称
    const [selectedClusterName, setSelectedClusterName] = useState("All Clusters");

    const setSatelliteNameToDisplay = useSatelliteNamesToDisplay(state => state.setSatelliteNamesToDisplay)

    const clusterInfo = useMemo(() => {
        if (!clusterData) return [];
        return clusterData.map((cluster) => {
            return {
                name: cluster.name,
                url: cluster.url,
                central: cluster.central,
                satellites: cluster.satellites,
            };
        });
    }, [clusterData]);

    // 根据 selectedClusterName 筛选 clusterInfo
    const filteredClusterInfo = useMemo(() => {
        let satelliteNames = [];

        // 如果 selectedClusterName 是 "All Clusters"，则不进行筛选，返回所有集群信息
        if (selectedClusterName === "All Clusters") {
            console.log(clusterInfo)
            clusterInfo.forEach(cluster => {
                cluster.satellites.forEach(satellite => {
                    satelliteNames.push(satellite.name);
                });
            });
            setSatelliteNameToDisplay(satelliteNames)
            return clusterInfo;
        }
        // 否则，只返回匹配 selectedClusterName 的集群信息
        let selectedCluster = clusterInfo.filter(cluster => cluster.name === selectedClusterName);

        if (selectedCluster.length > 0) {
            selectedCluster[0].satellites.forEach(satellite => {
                satelliteNames.push(satellite.name);
            });
        }

        setSatelliteNameToDisplay(satelliteNames)
        console.log(satelliteNames)
        console.log(selectedCluster)

        return selectedCluster;
    }, [clusterInfo, selectedClusterName]); // 依赖项包括 clusterInfo 和 selectedClusterName

    const chooseClusterDropdown = (
        <Dropdown label={selectedClusterName} dismissOnClick={true}>
            <Dropdown.Item
                onClick={() => setSelectedClusterName("All Clusters")}
            >
                All Clusters
            </Dropdown.Item>
            {clusterInfo.map((cluster) => (
                <Dropdown.Item
                    key={cluster.name}
                    onClick={() => setSelectedClusterName(cluster.name)}
                >
                    {cluster.name}
                </Dropdown.Item>
            ))}
        </Dropdown>
    );

    const clusterInfoAccordion = filteredClusterInfo.map((cluster) => (
        <ClusterInfoAccordion key={cluster.name} info={cluster} />
    ));

    return (
        <div className="max-h-full w-full h-full overflow-y-auto">

            <Card className="w-full h-20 my-3">
                Cluster Status
            </Card>

            {chooseClusterDropdown}

            {clusterInfoAccordion}
        </div>
    );
}