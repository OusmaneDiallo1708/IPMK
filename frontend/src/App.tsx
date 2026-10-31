// @ts-nocheck
import { BrowserRouter as Router } from "react-router-dom";
import { UserProvider } from "./components/log/context/UserContext";
import AppRoutes from "./components/routers/Index";

const App = () => {
  return (
    <Router>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </Router>
  );
};

export default App;