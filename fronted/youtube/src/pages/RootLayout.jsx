import React from 'react'
import Header from './components/permanentComponents/Header';
import Sidebar from './components/permanentComponents/Sidebar';
import {Outlet} from 'react-router-dom'

function RootLayout() {
  return (
    <div>

<div className="h-screen overflow-y-auto bg-[#121212] text-white">

<Header/>
<Sidebar/>

</div>

    </div>
  )
}

export default RootLayout