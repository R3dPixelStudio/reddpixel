import React, { useEffect } from 'react'
import { destroyCinematicController } from '../core/timeline/cinematicController'
import { initExperience } from '../core/bootstrap/initExperience'


import TraversalControls from './navigation/TraversalControls'
import CustomCursor from './overlay/CustomCursor'
import GuidanceOverlay from './GuidanceOverlay' 
import LandingFooter from './LandingFooter'

import AboutPhaseUI from './phases/AboutPhaseUI'
import WorksPhaseUI from './phases/WorksPhaseUI'
import ContactPhaseUI from './phases/ContactPhaseUI'

const Layout: React.FC = () => {
  useEffect(() => {
    initExperience()
    return () => {
      destroyCinematicController()
    }
  }, [])

  return (
    <div id="dom-root" className="pointer-events-none fixed inset-0 z-10">
      <CustomCursor />
      <main className="h-full w-full px-4 sm:px-6 md:px-10 lg:px-16">
        
        {/* GLOBAL NAVIGATION */}
        
        <TraversalControls />
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