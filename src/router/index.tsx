import { useContext } from "react";
import {
  Routes,
  Route,
  Navigate,
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
} from "react-router";
import HomePage from "../components/HomePage";
import LoginPage from "../components/LoginPage";
import TicketDetailPage from "../components/TicketDetail";
import NfcPage from "../components/NfcPage";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/detail" element={<TicketDetailPage />} />
      <Route path="/nfc" element={<NfcPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export const RouterBridge = ({ children }: { children: React.ReactNode }) => {
  const locationContext = useContext(UNSAFE_LocationContext);
  const navigationContext = useContext(UNSAFE_NavigationContext);

  return (
    <UNSAFE_LocationContext.Provider value={locationContext}>
      <UNSAFE_NavigationContext.Provider value={navigationContext}>
        {children}
      </UNSAFE_NavigationContext.Provider>
    </UNSAFE_LocationContext.Provider>
  );
};

export default AppRoutes;
