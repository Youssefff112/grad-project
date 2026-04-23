// src/Modules/Subscription/subscription.model.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../DB/connection.js';

export class Subscription extends Model {}
export class Payment extends Model {}

Subscription.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('client', 'coach'),
    allowNull: false
  },
  planName: {
    type: DataTypes.STRING(80),
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD'
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'expired', 'cancelled'),
    defaultValue: 'pending'
  },
  startDate: {
    type: DataTypes.DATE
  },
  endDate: {
    type: DataTypes.DATE
  },
  autoRenew: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  sequelize,
  modelName: 'Subscription',
  tableName: 'subscriptions',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'status'] },
    { fields: ['role', 'status'] }
  ]
});

Payment.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subscriptionId: {
    type: DataTypes.INTEGER
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD'
  },
  provider: {
    type: DataTypes.STRING(40),
    defaultValue: 'manual'
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  reference: {
    type: DataTypes.STRING(120)
  },
  paidAt: {
    type: DataTypes.DATE
  },
  meta: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  sequelize,
  modelName: 'Payment',
  tableName: 'payments',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'status'] },
    { fields: ['subscriptionId'] }
  ]
});

