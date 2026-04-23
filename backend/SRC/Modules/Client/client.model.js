// src/Modules/Client/client.model.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../DB/connection.js';

export class ClientProfile extends Model {}

ClientProfile.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  selectedCoachId: {
    type: DataTypes.INTEGER
  },
  goals: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  medicalNotes: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: 'ClientProfile',
  tableName: 'client_profiles',
  timestamps: true
});

