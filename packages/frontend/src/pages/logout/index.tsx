import { Navigate, useParams } from "react-router-dom";
import { logout } from "@/store/user";

const Logout = () => {
  const { appId } = useParams();

  logout();
  return (
    <Navigate
      to={{ pathname: `/login/${appId}`, search: window.location.search }}
      replace
    />
  );
};

export default Logout;
