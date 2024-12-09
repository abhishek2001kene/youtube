import React from "react";
import Header from "./components/permanentComponents/Header";
import Sidebar from "./components/permanentComponents/Sidebar";
import { Outlet } from "react-router-dom";

function RootLayout() {
  return (
    <div>
      <div className="h-screen overflow-y-auto bg-[#121212] text-white">
        <Header />
      </div>
      <div className="flex min-h-[calc(100vh-66px)] sm:min-h-[calc(100vh-82px)]">
        <Sidebar />
      </div>
    </div>
  );
}

export default RootLayout;
