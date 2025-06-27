import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

const ClaimDevice: React.FC = () => {
  const [authKey, setAuthKey] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await api.post("/device/claim", { authKey, name });
      setMessage(`Claimed: ${res.data.device.name}`);
      navigate(`/devices`);
    } catch (err) {
      setMessage("Failed to claim device");
    }
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Claim Device
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            label="Auth Key"
            fullWidth
            required
            value={authKey}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setAuthKey(e.target.value)
            }
          />
          <TextField
            margin="normal"
            label="Device Name"
            fullWidth
            required
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
          />
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            Claim
          </Button>
        </Box>
        {message && (
          <Typography
            align="center"
            sx={{ mt: 2 }}
            color={message.includes("Claimed") ? "success.main" : "error.main"}
          >
            {message}
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default ClaimDevice;
