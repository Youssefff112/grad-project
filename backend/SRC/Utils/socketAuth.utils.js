import jwt from 'jsonwebtoken';
import { User } from '../Modules/User/user.model.js';

/**
 * Socket.IO middleware — verifies JWT from handshake.auth.token
 * and attaches socket.data.userId for room authorization.
 */
export async function authenticateSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      return next(new Error('Unauthorized'));
    }

    socket.data.userId = user.id;
    socket.data.userRole = user.role;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
}
