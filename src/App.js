import React, { Component } from 'react';


import World from './World';
import Viewboard from './Viewboard';


const App = () => {

    return (
      <div className="flex w-full h-screen min-h-screen bg-black">
      <div className="w-1/3  overflow-y-hidden m-3">
        <Viewboard />
      </div>
        <div className="bg-white w-2/3  overflow-y-hidden">
          <World />
        </div>
      </div>
    );

}

export default App;