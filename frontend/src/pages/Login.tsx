import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../AuthContext';


const Login: React.FC = () => {
    const navigate = useNavigate();
    const { setLoggedIn } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/auth/login', { email, password });
            setLoggedIn(true);
            navigate('/devices');
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className='cover_box'>
            <div className="form-box login">
                <h2>Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className='input-box'>
                        <span className='icon'>#</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <label>Email</label>
                    </div>
                    <div className='input-box'>
                        <span className='icon'>#</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <label>Password</label>
                    </div>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <button type="submit" className='btn'>Login</button>
                    <div className="login-register">
                        <p>Don't have an account? <Link to="/register">Go to Register</Link></p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;