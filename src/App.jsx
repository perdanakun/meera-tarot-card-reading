import { BrowserRouter, Route, Routes } from "react-router-dom";
import MeeraExperience from "./components/MeeraExperience";
import CardSelectPage from "./components/CardSelectPage";

export default function App() {
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<MeeraExperience />} />
      <Route path="/tarot-cards" element={<CardSelectPage />} />
      <Route path="*" element={<MeeraExperience />} />
    </Routes>
  </BrowserRouter>;
}
