
import React from "react";
import Login from "./login";
import Join from "./join";

const routes = [
  { name: "Join", path: "/", exact: true, main: () => <Join /> },
  { name: "Login", path: "/login", exact: true, main: () => <Login /> }
];

export default routes;