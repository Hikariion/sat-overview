import React, { useEffect } from 'react';


import World from './World';
import Viewboard from './Viewboard';
import { useClusterDataStore } from './Store';


const App = () => {

    const fetchNodeNames = useClusterDataStore(state => state.fetchNodeNames);
    const fetchClusterData = useClusterDataStore(state => state.fetch);
    const CLUSTER_DATA_URL = "satellite.json";
    useEffect(() => {
      fetchClusterData(CLUSTER_DATA_URL);
        
      fetchNodeNames(CLUSTER_DATA_URL);
    }, []);





    return (
      <div className="flex w-full h-screen min-h-screen max-h-screen bg-black">
      <div className="w-1/3 h-full min-h-full z-10">
        <Viewboard />
      </div>
        <div className="bg-white w-2/3  overflow-y-hidden z-0">
          <World />
        </div>
      </div>
    );

}

export default App;