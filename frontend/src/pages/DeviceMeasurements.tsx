import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import api from "../api";

// MUI components
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

interface Measurement {
  id: string;
  deviceId: string;
  moistureLevel: number;
  timestamp: string;
}

interface Device {
  id: string;
  thresholdRed: number;
  thresholdYellow: number;
  thresholdGreen: number;
}

const DeviceMeasurements: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [error, setError] = useState("");
  const [device, setDevice] = useState<Device | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<Measurement[]>(`/device/measurements/${id}`)
      .then((res) => setMeasurements(res.data))
      .catch(() => {
        setError("Unable to load measurements");
        navigate("/devices");
      });

    // Fetch device thresholds
    api
      .get<Device[]>("/device/list")
      .then((res) => {
        const dev = res.data.find((d) => d.id === id);
        if (dev) setDevice(dev);
      })
      .catch(() => {});
  }, [id, navigate]);

  // live websocket
  useEffect(() => {
    if (!id) return;
    const ws = new WebSocket("ws://localhost:8080/websocket/client");

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "measurement" && msg.data?.deviceId === id) {
          const m: Measurement = msg.data;
          setMeasurements((prev) => [m, ...prev].slice(0, 50));
        }
      } catch {
        // ignore errors
      }
    };

    return () => {
      ws.close();
    };
  }, [id]);

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper sx={{ p: 4, width: "100%" }}>
        <Typography variant="h6" gutterBottom>
          Measurements for {id}
        </Typography>
        {error && <Typography color="error">{error}</Typography>}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell align="right">Moisture Level</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {measurements.map((m) => {
                const moisture = m.moistureLevel;
                let color: "success" | "warning" | "error" | "info" = "success";
                if (device) {
                  if (moisture <= device.thresholdRed) color = "error";
                  else if (moisture <= device.thresholdYellow)
                    color = "warning";
                  else if (moisture <= device.thresholdGreen) color = "success";
                  else color = "info";
                } else {
                  // Fallback to default thresholds if device data not loaded
                  if (moisture <= 30) color = "error";
                  else if (moisture <= 60) color = "warning";
                  else color = "info";
                }
                return (
                  <TableRow key={m.id} hover>
                    <TableCell>
                      {new Date(m.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={`${moisture}%`} color={color} size="small" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" component={RouterLink} to="/devices">
            Back to Devices
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default DeviceMeasurements;
