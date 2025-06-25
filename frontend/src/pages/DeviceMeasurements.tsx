import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';

interface Measurement {
    id: string;
    deviceId: string;
    moistureLevel: number;
    timestamp: string;
}

const DeviceMeasurements: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        api
            .get<Measurement[]>(`/device/measurements/${id}`)
            .then((res) => setMeasurements(res.data))
            .catch(() => {
                setError('Unable to load measurements');
                navigate('/devices');
            });
    }, [id, navigate]);

    return (
        <div>
            <h2>Measurements for {id}</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <ul>
                {measurements.map((m) => (
                    <li key={m.id}>
                        {new Date(m.timestamp).toLocaleString()}: {m.moistureLevel}%
                    </li>
                ))}
            </ul>
            <p>
                <Link to="/devices">Back to devices</Link>
            </p>
        </div>
    );
};

export default DeviceMeasurements;