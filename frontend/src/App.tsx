import React, { useContext } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Devices from './pages/Devices';
import ClaimDevice from './pages/ClaimDevice';
import Register from './pages/Register';
import Logout from './pages/Logout';
import { AuthContext } from './AuthContext';

const App: React.FC = () => {
    const { loggedIn } = useContext(AuthContext);
    const location = useLocation();
    const hideNav = location.pathname === '/login' || location.pathname === '/register';

    return (

        <div>
            {!hideNav && (
                <div className='head'>
                   
                    <div className='navigation'>
                        <label className='logo'>MyGarden</label>
                        <ul>
                            <li><a>{loggedIn && <Link to="/devices">Devices</Link>}</a></li>
                            <li><a>{loggedIn && (
                                <>
                                    
                                    <Link to="/claim">Claim Device</Link>
                                </>
                            )}</a></li>
                            <li><a className='btnLogout-popup'>{!loggedIn && <Link to="/register">Register</Link>}
                                {loggedIn && (
                                    <>
                                        
                                        <Link to="/logout">Logout</Link>
                                    </>
                                )}</a></li>
                        </ul>
                    </div>
                </div>
            )}
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/devices"
                    element={loggedIn ? <Devices /> : <Navigate to="/login" />}
                />
                <Route
                    path="/claim"
                    element={loggedIn ? <ClaimDevice /> : <Navigate to="/login" />}
                />
                <Route
                    path="/register"
                    element={!loggedIn ? <Register /> : <Navigate to="/devices" />}
                />
                <Route path="/logout" element={<Logout />} />
                <Route path="/" element={<Navigate to="/devices" />} />
            </Routes>
        </div>
    );
};

export default App;