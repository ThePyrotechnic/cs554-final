import React, { useContext } from "react";
import routes from "./routes";
import { useAuth } from "./use-auth";
import { Link } from "react-router-dom";

function Header(props) {
  const auth = useAuth();

  return (
      {auth.user 
        ? (
          <Fragment>
            <Link to="/account">Account ({auth.user.email})</Link>
            <Button onClick={() => auth.signout()}>Signout</Button>
          </Fragment>
          )
        : (
                <Link to="/signin">Signin</Link>
          )
      }
    );
}


export default Header;
