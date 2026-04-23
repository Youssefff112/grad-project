// src/Modules/User/user.model.js
import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sequelize } from '../../../DB/connection.js';

export class User extends Model {
  async comparePassword(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
  }

  generateToken() {
    return jwt.sign(
      { userId: this.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  generateRefreshToken() {
    return jwt.sign(
      { userId: this.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );
  }

  generatePasswordResetToken() {
    const resetToken = jwt.sign(
      { userId: this.id },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    this.passwordResetToken = resetToken;
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

    return resetToken;
  }
}

User.init({
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('client', 'coach', 'admin'),
    defaultValue: 'client'
  },
  userType: {
    type: DataTypes.ENUM('onsite', 'offline'),
    allowNull: false
  },
  profile: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  refreshToken: {
    type: DataTypes.TEXT
  },
  passwordResetToken: {
    type: DataTypes.TEXT
  },
  passwordResetExpires: {
    type: DataTypes.DATE
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  defaultScope: {
    attributes: {
      exclude: ['password', 'refreshToken', 'passwordResetToken', 'passwordResetExpires']
    }
  }
});

User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

