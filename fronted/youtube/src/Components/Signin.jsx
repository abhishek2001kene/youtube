import React from "react";
import { Link } from "react-router-dom";

function Signin() {
  return (
    <Link to="/signin">
      <div className="text-6xl text-amber-800">Sign In</div>
    </Link>
  );
}

export default Signin;
