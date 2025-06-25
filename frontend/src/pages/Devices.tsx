import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface Device {
    id: string;
    name: string | null;
    claimed: boolean;
    thresholdRed: number;
    thresholdYellow: number;
    thresholdGreen: number;
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
    const [measurements, setMeasurements] = useState<Record<string, Measurement[]>>(
        {}
    );
    const [error, setError] = useState('');

    useEffect(() => {
        api
            .get<Device[]>('/device/list')
            .then((res) => setDevices(res.data))
            .catch(() => {
                setError('Unauthorized');
                navigate('/login');
            });
    }, [navigate]);

    useEffect(() => {
        devices.forEach((d) => {
            api
                .get<Measurement[]>(`/device/measurements/${d.id}`)
                .then((res) =>
                    setMeasurements((prev) => ({ ...prev, [d.id]: res.data }))
                )
                .catch(() =>
                    setMeasurements((prev) => ({ ...prev, [d.id]: [] }))
                );
        });
    }, [devices]);

    return (
        <div className='cover_box_device'>
            <div className="device-box">
                <h2>My Devices</h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <ul>
                    {devices.map((d) => (
                        <table key={d.id} className="custom-table">

                            <tr className="table-row">
                                <td colSpan={2} className="thresholds-wrapper">
                                    <span className="device-name">{d.name ?? d.id}</span>
                                    <span className="thresholds-label">thresholds:</span>
                                    <a className="circle red">{d.thresholdRed}%</a>
                                    <a className="circle yellow">{d.thresholdYellow}%</a>
                                    <a className="circle green">{d.thresholdGreen}%</a>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2}> {(measurements[d.id] || []).map((m) => (
                                    <li key={m.id}>
                                        {new Date(m.timestamp).toLocaleString()}: {m.moistureLevel}%
                                    </li>
                                ))}
                                </td>
                            </tr>
                        </table>

                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Devices;