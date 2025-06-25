import React, { createContext, useState, useEffect } from 'react';
import api from './api';

interface AuthContextProps {
    loggedIn: boolean;
    setLoggedIn: (loggedIn: boolean) => void;
}

export const AuthContext = createContext<AuthContextProps>({
    loggedIn: false,
    setLoggedIn: () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        api
            .get('/user')
            .then(() => setLoggedIn(true))
            .catch(() => setLoggedIn(false));
    }, []);

    return (
        <AuthContext.Provider value={{ loggedIn, setLoggedIn }}>
            {children}
        </AuthContext.Provider>
    );
};