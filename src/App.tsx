import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import LandingPage from "./pages/LandingPage";
import RidesPage from "./pages/RidesPage";
import LoginPage from "./pages/LoginPage";
import HistoryPage from "./pages/HistoryPage";
import ChatboxWidget from "./components/chatbot/ChatboxWidget";

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/rides" element={<RidesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
      <ChatboxWidget />
    </AuthProvider>
  );
}

export default App;
