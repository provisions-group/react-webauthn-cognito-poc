import "./App.css";
import { DashboardPage } from "./components/DashboardPage";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  Authenticated,
  AuthProvider,
  Unauthenticated,
} from "./contexts/AuthContext";
import LoginPage from "./components/LoginPage";
import PlainLoginPage from "./components/PlainLoginPage";
import DetailPage from "./components/DetailPage";
import { PageContainer } from "./components/PageContainer";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PageContainer>
          <Authenticated>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/details" element={<DetailPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Authenticated>

          <Unauthenticated>
            <Routes>
              {/* If you want to see the whole flow on one page, use the PlainLoginPage instead of the LoginPage */}
              {/* <Route path="/login" element={<PlainLoginPage />} /> */}
              <Route path="/login" element={<LoginPage />} />

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Unauthenticated>
        </PageContainer>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
