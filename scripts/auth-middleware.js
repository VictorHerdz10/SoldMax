import { DataHandler } from './dataHandler.js';

const dataHandler = new DataHandler();

export function protectRoute(requiredRole = 'user') {
    const session = dataHandler.getSession();
    
    if (!session) {
        window.location.href = '/pages/login.html';
        return false;
    }
    
    if (requiredRole === 'admin' && session.user.role !== 'admin') {
        window.location.href = '/pages/userprincipal.html';
        return false;
    }
    
    return true;
}