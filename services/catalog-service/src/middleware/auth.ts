import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { asyncLocalStorage } from '../utils/async-storage';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        roles: string[];
    };
}

export function requireRole(role: string) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized: Missing token' });
        }

        const token = authHeader.split(' ')[1];

        try {
            // Decode the JWT without verifying signature since Kong already did it
            // In a real prod environment without Kong doing JWKS, we would use jwt.verify with the public key
            interface DecodedToken {
                realm_access?: { roles?: string[] };
                sub: string;
            }
            const decoded = jwt.decode(token) as DecodedToken | null;
            if (!decoded) {
                return res.status(401).json({ message: 'Unauthorized: Invalid token payload' });
            }

            const roles = decoded.realm_access?.roles || [];
            if (!roles.includes(role)) {
                return res.status(403).json({ message: `Forbidden: Requires ${role} role` });
            }

            // Attach user to request
            req.user = {
                id: decoded.sub,
                roles,
            };

            const store = asyncLocalStorage.getStore();
            if (store) {
                store.set('userId', decoded.sub);
            }

            next();
        } catch (err) {
            console.error(err);
            return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
    };
}
