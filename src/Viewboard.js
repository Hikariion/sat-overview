import { Tabs } from 'flowbite-react';
import Summary from './Summary';
import { useEffect, useRef } from 'react';
import {useTabStatusStore} from './Store';
import Satellite from './Satellite';
import Jobs from './Jobs';

export default function Viewboard(props) {

  const tabsRef = useRef();
  const activeTab = useTabStatusStore(state => state.activeTab);
  const setActiveTab = useTabStatusStore(state => state.setActiveTab);

  useEffect(() => {
    tabsRef.current.setActiveTab(activeTab);
  }, [activeTab]);
  

  return (
    <div className='bg-neutral-100 shadow-sm w-full min-h-full max-h-full overflow-auto'>
      <Tabs.Group
        aria-label="tabs"
        style="default"
        ref={tabsRef}
        onActiveTabChange={tab => setActiveTab(tab)}
        className='sticky top-0 bg-neutral-100 p-0'
      >
        <Tabs.Item
          active={true}
          title="概览"
          className='p-0'
        >
         <Summary />

        </Tabs.Item>
        <Tabs.Item title="任务信息">
          <Jobs />
        </Tabs.Item>
        <Tabs.Item title="卫星信息">
          <Satellite />
        </Tabs.Item>
        <Tabs.Item title="关于">
          Edit by qiutb.
        </Tabs.Item>
      </Tabs.Group>
    </div>
  );

}