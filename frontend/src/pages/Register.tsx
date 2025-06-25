import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        try {
            await api.post('/auth/register', {
                email,
                firstName,
                lastName,
                password,
                passwordConfirmation,
            });
            setMessage('Registration successful');
            navigate('/login');
        } catch (err) {
            setMessage('Registration failed');
        }
    };

    return (
        <div className='cover_box'>
            <div className="form-box login">
                <h2>Register</h2>
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
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                        <label>First Name</label>
                    </div>
                    <div className='input-box'>
                        <span className='icon'>#</span>
                        <input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                        <label>Last Name</label>
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
                    <div className='input-box'>
                        <span className='icon'>#</span>
                        <input
                            type="password"
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            required
                        />
                        <label>Password Confirmation</label>
                    </div>

                    <button type="submit" className='btn'>Register</button>
                    <div className="login-register">
                        <p>Already have an account? <Link to="/login">Back to Login</Link> </p>
                    </div>
                </form>
                {message && <p>{message}</p>}
            </div>
        </div>
    );
};

export default Register;