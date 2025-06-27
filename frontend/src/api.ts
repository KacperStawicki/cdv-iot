import axios from "axios";

const BASE_URL =
  "https://cdv-iot-backend.proudglacier-0dd2964d.uksouth.azurecontainerapps.io";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// WebSocket URL for client connections
export const WS_URL =
  BASE_URL.replace("https://", "wss://") + "/websocket/client";

export default api;
