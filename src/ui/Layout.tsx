import React from 'react'
import PhaseNavigation from './navigation/PhaseNavigation'


import TraversalControls from './navigation/TraversalControls'
import CustomCursor from './overlay/CustomCursor'
import GuidanceOverlay from './GuidanceOverlay' 
import LandingFooter from './LandingFooter'
import CVMenu from './CVMenu'

import AboutPhaseUI from './phases/AboutPhaseUI'
import WorksPhaseUI from './phases/WorksPhaseUI'
import ContactPhaseUI from './phases/ContactPhaseUI'

const Layout: React.FC = () => {
  return (
    <div id="dom-root" className="pointer-events-none fixed inset-0 z-10">
      <CustomCursor />
      <main className="h-full w-full px-4 sm:px-6 md:px-10 lg:px-16">
        
        {/* GLOBAL NAVIGATION */}
        
        <TraversalControls />
        <PhaseNavigation />
        <CVMenu />
        <GuidanceOverlay />
        <LandingFooter />

        {/* DIMENSIONAL EXPLORE UIs */}
        <AboutPhaseUI />   
        <WorksPhaseUI />    
        <ContactPhaseUI />

      </main>
    </div>
  )
}

export default Layout
