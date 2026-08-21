import { useContext } from "react";
import {
  Routes,
  Route,
  Navigate,
  UNSAFE_LocationContext,
  UNSAFE_NavigationContext,
} from "react-router";
import ExplorePage from "../components/ExplorePage";
import HomePage from "../components/HomePage";
import TicketDetailPage from "../components/TicketDetail";
import NfcPage from "../components/NfcPage";
import FAQPage from "../components/FAQPage";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/detail" element={<TicketDetailPage />} />
      <Route path="/nfc" element={<NfcPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
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
