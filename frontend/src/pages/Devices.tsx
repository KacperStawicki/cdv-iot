import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

// MUI components
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import EditIcon from "@mui/icons-material/Edit";

interface Device {
  id: string;
  name: string | null;
  claimed: boolean;
  thresholdRed: number;
  thresholdYellow: number;
  thresholdGreen: number;
  online: boolean;
}

interface Measurement {
  id: string;
  deviceId: string;
  moistureLevel: number;
  timestamp: string;
}

const Devices: React.FC = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [measurements, setMeasurements] = useState<
    Record<string, Measurement[]>
  >({});
  const [error, setError] = useState("");

  // edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [editRed, setEditRed] = useState<number>(0);
  const [editYellow, setEditYellow] = useState<number>(0);
  const [editGreen, setEditGreen] = useState<number>(0);

  useEffect(() => {
    api
      .get<Device[]>("/device/list")
      .then((res) => setDevices(res.data))
      .catch(() => {
        setError("Unauthorized");
        navigate("/login");
      });
  }, [navigate]);

  useEffect(() => {
    devices.forEach((d) => {
      api
        .get<Measurement[]>(`/device/measurements/${d.id}`)
        .then((res) =>
          setMeasurements((prev) => ({ ...prev, [d.id]: res.data }))
        )
        .catch(() => setMeasurements((prev) => ({ ...prev, [d.id]: [] })));
    });

    // Poll every 5 minutes
    const interval = setInterval(() => {
      devices.forEach((d) => {
        api
          .get<Measurement[]>(`/device/measurements/${d.id}`)
          .then((res) =>
            setMeasurements((prev) => ({ ...prev, [d.id]: res.data }))
          )
          .catch(() => setMeasurements((prev) => ({ ...prev, [d.id]: [] })));
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [devices]);

  // Helper to determine whether a device is online.
  const isDeviceOnline = (deviceId: string): boolean => {
    const dev = devices.find((d) => d.id === deviceId);
    if (dev) return dev.online;

    // Fallback to measurement freshness if device not found
    const latest = measurements[deviceId]?.[0];
    if (!latest) return false;
    const FIVE_MINUTES = 5 * 60 * 1000;
    return Date.now() - new Date(latest.timestamp).getTime() < FIVE_MINUTES;
  };

  // Open websocket connection for real-time device online/offline updates
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080/websocket/client");

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "device_online" || msg.type === "device_offline") {
          setDevices((prev) =>
            prev.map((d) =>
              d.id === msg.deviceId
                ? { ...d, online: msg.type === "device_online" }
                : d
            )
          );
        } else if (msg.type === "measurement" && msg.data) {
          const m = msg.data as Measurement;
          setMeasurements((prev) => {
            const list = prev[m.deviceId] ? [m, ...prev[m.deviceId]] : [m];
            return { ...prev, [m.deviceId]: list.slice(0, 10) };
          });
        } else if (msg.type === "threshold_update") {
          setDevices((prev) =>
            prev.map((d) =>
              d.id === msg.deviceId
                ? {
                    ...d,
                    thresholdRed: msg.thresholdRed,
                    thresholdYellow: msg.thresholdYellow,
                    thresholdGreen: msg.thresholdGreen,
                  }
                : d
            )
          );
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Typography variant="h5" gutterBottom>
        My Devices
      </Typography>
      {error && <Typography color="error">{error}</Typography>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Device</TableCell>
              <TableCell>Thresholds</TableCell>
              <TableCell>Latest Measurements</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map((d) => (
              <TableRow key={d.id} hover>
                <TableCell>
                  <Chip
                    label={isDeviceOnline(d.id) ? "Online" : "Offline"}
                    color={isDeviceOnline(d.id) ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>{d.name ?? d.id}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={`${d.thresholdRed}%`}
                      color="error"
                      size="small"
                    />
                    <Chip
                      label={`${d.thresholdYellow}%`}
                      color="warning"
                      size="small"
                    />
                    <Chip
                      label={`${d.thresholdGreen}%`}
                      color="success"
                      size="small"
                    />
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack spacing={1}>
                    {(measurements[d.id] || []).slice(0, 3).map((m) => {
                      const moist = m.moistureLevel;
                      let color: "success" | "warning" | "error" | "info" =
                        "success";
                      if (moist <= d.thresholdRed) color = "error";
                      else if (moist <= d.thresholdYellow) color = "warning";
                      else if (moist <= d.thresholdGreen) color = "success";
                      else color = "info";

                      return (
                        <Stack
                          key={m.id}
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <Chip
                            label={`${moist}%`}
                            color={color}
                            size="small"
                          />
                          <Typography variant="caption">
                            {new Date(m.timestamp).toLocaleString()}
                          </Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditDevice(d);
                      setEditRed(d.thresholdRed);
                      setEditYellow(d.thresholdYellow);
                      setEditGreen(d.thresholdGreen);
                      setEditOpen(true);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Edit Thresholds</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 1,
            minWidth: "400px",
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            Thresholds apply when the moisture % is{" "}
            <strong>equal to or below</strong> the value. If a measurement is
            above the highest (green) threshold it will be shown in{" "}
            <span style={{ color: "#1976d2" }}>blue</span>.
          </Typography>
          <TextField
            label="Red (%)"
            type="number"
            value={editRed}
            onChange={(e) => setEditRed(Number(e.target.value))}
            inputProps={{ min: 0, max: 100 }}
            sx={{ mt: 1 }}
          />
          <TextField
            label="Yellow (%)"
            type="number"
            value={editYellow}
            onChange={(e) => setEditYellow(Number(e.target.value))}
            inputProps={{ min: 0, max: 100 }}
          />
          <TextField
            label="Green (%)"
            type="number"
            value={editGreen}
            onChange={(e) => setEditGreen(Number(e.target.value))}
            inputProps={{ min: 0, max: 100 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={
              editRed < 0 ||
              editYellow < 0 ||
              editGreen < 0 ||
              editRed >= editYellow ||
              editYellow >= editGreen ||
              editGreen > 100
            }
            onClick={async () => {
              if (!editDevice) return;
              try {
                await api.post("/device/command", {
                  type: "configure",
                  deviceId: editDevice.id,
                  payload: {
                    thresholdRed: editRed,
                    thresholdYellow: editYellow,
                    thresholdGreen: editGreen,
                  },
                });
                // Optimistically update UI
                setDevices((prev) =>
                  prev.map((d) =>
                    d.id === editDevice.id
                      ? {
                          ...d,
                          thresholdRed: editRed,
                          thresholdYellow: editYellow,
                          thresholdGreen: editGreen,
                        }
                      : d
                  )
                );
                setEditOpen(false);
              } catch (err) {
                console.error(err);
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Devices;
