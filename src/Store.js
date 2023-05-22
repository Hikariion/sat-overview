import {create} from 'zustand'

const useTabStatusStore = create((set) => ({
    activeTab: 0,
    setActiveTab: (activeTab) => set({activeTab}),
}));


const useClusterDataStore = create((set) => ({
    clusterData: [],
    peerRelation: {},
    fetch: async (url) => {
        const response = await fetch(url,{mode:"cors"});
        const data = await response.json();
        console.log(data);
        set({clusterData: Object.values(data["clusters"]), peerRelation: data["peerRelations"]})
    },
}));


const useFocusSatellite = create((set) => ({
    focusedSatellite: "",
    focus: (focusedSatellite) => {
        set({focusedSatellite});
    },
}));

export {useTabStatusStore, useClusterDataStore, useFocusSatellite}