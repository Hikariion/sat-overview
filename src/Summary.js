import { Accordion, Card, Button } from "flowbite-react";
import { useClusterDataStore, useFocusSatellite } from "./Store";
import { useEffect, useMemo, useState } from "react";

function ClusterInfoAccordion(props) {

    const {name, url, central, satellites, peerClusters} = props.info;
    const setFocusedSatellite = useFocusSatellite(state => state.focus);
    const [satelliteButtons, setSatelliteButtons] = useState([]);
    const [peerClustersButtons, setPeerClustersButtons] = useState([]);
    
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
        setPeerClustersButtons(peerClusters.map((peerCluster) => {
            return (
                <div key={peerCluster.clusterId}>
                    <Button size='sm'>
                       {peerCluster.clusterId}
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
    const peerClusterButtonGroup = (
        <div className="flex flex-wrap gap-1 max-w-full overflow-x-hidden">
            {peerClustersButtons}
        </div>
    );


    return (
        <Accordion key={name} flush={true} collapseAll={true}>
            <Accordion.Panel>
                <Accordion.Title>{name}</Accordion.Title>
                <Accordion.Content>
                    <p>URL: {url}</p>
                    <p>Central: {central}</p>
                    <p>Satellites:</p>
                    <div className="w-full">{satelliteButtonGroup}</div>
                    <p>Peer Clusters:</p>
                    <div className="w-full">{peerClusterButtonGroup}</div>
                </Accordion.Content>
            </Accordion.Panel>

        </Accordion>
    );
}

export default function Summary(props) {

    const clusterData = useClusterDataStore(state => state.clusterData);
    const peerRelation = useClusterDataStore(state => state.peerRelation);
    const fetchClusterData = useClusterDataStore(state => state.fetch);
    const CLUSTER_DATA_URL = "http://localhost:9091/server/satellite.json";

    useEffect(() => {
      fetchClusterData(CLUSTER_DATA_URL);
    }, [])
    const clusterInfo = useMemo(() => {
        if (!clusterData || !peerRelation) return [];
        return clusterData.map((cluster) => {
            return {
                name: cluster.name,
                url: cluster.url,
                central: cluster.central,
                satellites: cluster.satellites,
                peerClusters: peerRelation[cluster.name],
            };
        });
    }, [clusterData, peerRelation]);

    const clusterInfoAccordion = clusterInfo.map((cluster) => {
        return (
            <ClusterInfoAccordion key={cluster.name} info={cluster} />
        );
    });

    return (
        <div className="max-h-full w-full h-full overflow-y-auto">
        <Card className="w-full h-20 my-3">
            Cluster Status
        </Card>

        {clusterInfoAccordion}
        </div>
    );
}