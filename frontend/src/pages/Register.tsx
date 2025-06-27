import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import api from "../api";

// MUI components
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/auth/register", {
        email,
        firstName,
        lastName,
        password,
        passwordConfirmation,
      });
      setMessage("Registration successful");
      navigate("/login");
    } catch (err) {
      setMessage("Registration failed");
    }
  };

  React.useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return (
    <Container
      maxWidth="xs"
      sx={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Register
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            label="Email"
            type="email"
            fullWidth
            required
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
          />
          <TextField
            margin="normal"
            label="First Name"
            fullWidth
            required
            value={firstName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFirstName(e.target.value)
            }
          />
          <TextField
            margin="normal"
            label="Last Name"
            fullWidth
            required
            value={lastName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setLastName(e.target.value)
            }
          />
          <TextField
            margin="normal"
            label="Password"
            type="password"
            fullWidth
            required
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
          />
          <TextField
            margin="normal"
            label="Confirm Password"
            type="password"
            fullWidth
            required
            value={passwordConfirmation}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPasswordConfirmation(e.target.value)
            }
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            Register
          </Button>
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Already have an account? <RouterLink to="/login">Login</RouterLink>
          </Typography>
        </Box>
        {message && (
          <Typography
            align="center"
            sx={{ mt: 2 }}
            color={
              message.includes("successful") ? "success.main" : "error.main"
            }
          >
            {message}
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default Register;
