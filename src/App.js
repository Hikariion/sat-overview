import React, { useEffect, useState  } from 'react';


import World from './World';
import Viewboard from './Viewboard';
import { useClusterDataStore } from './Store';


const App = () => {
    const fetchNodeNames = useClusterDataStore(state => state.fetchNodeNames);
    const fetchClusterData = useClusterDataStore(state => state.fetch);

    const [clusterDataUrl, setClusterDataUrl] = useState(getClusterDataUrl());

    function getClusterDataUrl() {
        const currentTime = new Date();
        const minute = currentTime.getMinutes();
        const clusterIndex = Math.floor(minute / 10) + 1;
        console.log(`satellite_${clusterIndex}.json`)
        return `satellite_${clusterIndex}.json`;
    }

    useEffect(() => {
        const updateClusterData = () => {
            const newClusterDataUrl = getClusterDataUrl();
            setClusterDataUrl(newClusterDataUrl);
            fetchClusterData(newClusterDataUrl);
            fetchNodeNames(newClusterDataUrl);
        };

        // 初始加载数据
        updateClusterData();

        // 设置一个定时器，每10分钟更新一次数据
        const intervalId = setInterval(updateClusterData,10 * 1000);

        // 清除定时器
        return () => clearInterval(intervalId);
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