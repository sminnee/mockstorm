import { Route, Routes } from "react-router-dom";
import { ConceptGrid } from "./components/ConceptGrid/ConceptGrid";
import { ScreenGrid } from "./components/ScreenGrid/ScreenGrid";
import { ScreenView } from "./components/ScreenView/ScreenView";
import { HomePage } from "./pages/HomePage";
import { WorkspacePage } from "./pages/WorkspacePage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/:slug" element={<WorkspacePage />}>
        <Route index element={<ConceptGrid />} />
        <Route path="concepts/:cid" element={<ScreenGrid />} />
        <Route path="concepts/:cid/screens/:sid" element={<ScreenView />} />
      </Route>
    </Routes>
  );
}
