import React from "react";
import axios from "axios";
import Home from "./pages/Home/Home";
import Signin from "./Components/Signin";
import { Route, Routes } from "react-router-dom";
import RootLayout from "./pages/RootLayout";

function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path={"/signin"} element={<Signin />}></Route>
      </Route>
    </Routes>
 
  );
}

export default App;
