// src/Modules/Notification/notification.model.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../DB/connection.js';

export class Notification extends Model {}

Notification.init({
  userId: {
    type: DataTypes.INTEGER
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  channel: {
    type: DataTypes.ENUM('email', 'in_app'),
    defaultValue: 'in_app'
  },
  title: {
    type: DataTypes.STRING,
    defaultValue: 'New Notification'
  },
  subject: {
    type: DataTypes.STRING,
    defaultValue: 'FitCore Notification'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: 'notifications'
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#3b82f6' // Default blue
  },
  type: {
    type: DataTypes.ENUM('message', 'workout', 'meal', 'achievement', 'system'),
    defaultValue: 'system'
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  scheduledAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed'),
    defaultValue: 'sent' // Changed default to 'sent' for immediate in-app
  },
  sentAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  error: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: 'Notification',
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    { fields: ['status', 'scheduledAt'] },
    { fields: ['userId'] }
  ]
});
