import React, { useState } from 'react';
import api from '../api';

const ClaimDevice: React.FC = () => {
    const [deviceId, setDeviceId] = useState('');
    const [authKey, setAuthKey] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        try {
            const res = await api.post('/device/claim', { deviceId, authKey, name });
            setMessage(`Claimed: ${res.data.device.name}`);
        } catch (err) {
            setMessage('Failed to claim device');
        }
    };

    return (
        <div className='cover_box'>
            <div className="form-box login">
                <h2>Claim Device</h2>
                <form onSubmit={handleSubmit}>
                    <div className='input-box'>
                        <input
                            value={deviceId}
                            onChange={(e) => setDeviceId(e.target.value)}
                            required
                        />
                        <label>Device ID</label>
                    </div>
                    <div className='input-box'>
                        <input
                            value={authKey}
                            onChange={(e) => setAuthKey(e.target.value)}
                            required
                        />
                        <label>Auth Key</label>
                    </div>
                    <div className='input-box'>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <label>Device Name</label>
                    </div>
                    <button type="submit" className='btn'>Claim</button>
                </form>
                {message && <p>{message}</p>}
            </div>
        </div>
    );
};

export default ClaimDevice;