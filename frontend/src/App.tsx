import React, { useContext } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  Link as RouterLink,
} from "react-router-dom";
import Login from "./pages/Login";
import Devices from "./pages/Devices";
import ClaimDevice from "./pages/ClaimDevice";
import Register from "./pages/Register";
import Logout from "./pages/Logout";
import DeviceMeasurements from "./pages/DeviceMeasurements";
import { AuthContext } from "./AuthContext";
import CircularProgress from "@mui/material/CircularProgress";

// MUI components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";

// Route guards
const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { loggedIn, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }
  return loggedIn ? children : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { loggedIn, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }
  return loggedIn ? <Navigate to="/devices" /> : children;
};

const App: React.FC = () => {
  const { loggedIn } = useContext(AuthContext);
  const location = useLocation();
  const hideNav =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <div>
      {!hideNav && (
        <AppBar
          position="fixed"
          color="transparent"
          sx={{
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255,255,255,0.25)",
            borderBottom: "1px solid rgba(255,255,255,0.3)",
          }}
          elevation={0}
        >
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
              Digital Garden
            </Typography>
            {loggedIn && (
              <Stack direction="row" spacing={2} sx={{ mr: 2 }}>
                <Button color="inherit" component={RouterLink} to="/devices">
                  Devices
                </Button>
                <Button color="inherit" component={RouterLink} to="/claim">
                  Claim Device
                </Button>
              </Stack>
            )}
            {loggedIn ? (
              <Button color="inherit" component={RouterLink} to="/logout">
                Logout
              </Button>
            ) : (
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            )}
          </Toolbar>
        </AppBar>
      )}
      <Box sx={{ pt: 8 }}>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/devices"
            element={
              <PrivateRoute>
                <Devices />
              </PrivateRoute>
            }
          />
          <Route
            path="/claim"
            element={
              <PrivateRoute>
                <ClaimDevice />
              </PrivateRoute>
            }
          />
          <Route
            path="/measurements/:id"
            element={
              <PrivateRoute>
                <DeviceMeasurements />
              </PrivateRoute>
            }
          />
          <Route path="/logout" element={<Logout />} />
          <Route path="/" element={<Navigate to="/devices" />} />
        </Routes>
      </Box>
    </div>
  );
};

export default App;
