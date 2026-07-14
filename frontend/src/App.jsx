import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';

import LoginPage from './pages/auth/LoginPage.jsx';
import DashboardPage from './pages/user/DashboardPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;