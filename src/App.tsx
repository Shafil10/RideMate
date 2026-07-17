import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import LandingPage from "./pages/LandingPage";
import RidesPage from "./pages/RidesPage";
import ChatboxWidget from "./components/chatbot/ChatboxWidget";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/rides" element={<RidesPage />} />
      </Routes>
      <ChatboxWidget />
    </>
  );
}

export default App;
