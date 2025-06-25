import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../AuthContext';

const Logout: React.FC = () => {
    const navigate = useNavigate();
    const { setLoggedIn } = useContext(AuthContext);

    useEffect(() => {
        const doLogout = async () => {
            try {
                await api.post('/auth/logout');
                setLoggedIn(false);
            } finally {
                navigate('/login');
            }
        };
        doLogout();
    }, [navigate, setLoggedIn]);

    return <p>Logging out...</p>;
};

export default Logout;