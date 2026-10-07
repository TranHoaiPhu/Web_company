const { auth } = require('firebase-admin');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET_KEY;
// Giải mã token (decode, không verify)
function decodeToken(token) {
    try {
        return jwt.decode(token);
    } catch (err) {
        return null;
    }
}


require('dotenv').config(); 

function generateAccessToken(dataUser) {
    // Map Node.js role_id to Python role:
    // Node.js: Admin=2, User=1
    // Python: Admin=0, User=1
    const pythonRole = dataUser.role_id === 2 ? 0 : dataUser.role_id;
    
    return jwt.sign({  
            id: dataUser.id,
            sub: dataUser.id, // Compatibility with Python backend
            email: dataUser.email,
            role_id: dataUser.role_id,
            role: pythonRole // Mapped for Python backend compatibility
    }, process.env.JWT_SECRET_KEY , { expiresIn: "4h" });
}


function authenticateToken(req, res, next) {
    // if (req.originalUrl === '/auth/reset-password') {
    //     return next(); // Bỏ qua middleware cho route này
    //   }

    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1]; //  Optional chaining to avoid crashes

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, (error, user) => {
        if (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Token has expired" });
            } else {
                return res.status(403).json({ message: "Invalid token" });
            }
        }
        
        // Normalize user object for compatibility between Python and Node.js backends
        const normalizedUser = { ...user };
        // Map Python 'sub' to 'id'
        if (user.sub && !user.id) normalizedUser.id = user.sub;
        
        // Map roles to a consistent admin check
        const isAdminRole = 
            user.role_id === 2 || 
            user.role === 0 || 
            user.role === 'ADMIN' || 
            user.role_id === 'ADMIN';

        if (isAdminRole) {
            normalizedUser.role_id = 2; // Standardize to Node.js Admin ID
        }

        req.user = normalizedUser;
        console.log('Normalized User:--', req.user); 
        next();
    });
}

function isAdmin(req, res, next) {
    // Standardized admin check
    const isAdmin = 
        req.user?.role_id === 2 || 
        req.user?.role === 0 || 
        req.user?.role === 'ADMIN' || 
        req.user?.role_id === 'ADMIN';

    if (!isAdmin) {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
}


// Dong bo BE A 


function authenticateJWT(req, res, next) {
    // Log toàn bộ headers để debug
    console.log('HEADERS:', req.headers);
    const authHeader = req.headers.authorization;
    console.log('AUTH_HEADER:', authHeader);

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        console.log('TOKEN:', token);
        jwt.verify(token, secret, (err, user) => {
            if (err) {
                console.log('JWT VERIFY ERROR:', err);
                return res.sendStatus(403);
            }
            console.log("info", user )

            console.log('User_id', user)
            req.user = user; // user chứa user_id, email, ...
            next();
        });
    } else {
        console.log('NO AUTH HEADER OR WRONG FORMAT');
        res.sendStatus(401);
    }
}

module.exports = {
    generateAccessToken,
    authenticateToken,
    isAdmin, 
    decodeToken, 
    authenticateJWT
};
