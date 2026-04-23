// src/Modules/Vision/vision.model.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../DB/connection.js';

export class VisionSession extends Model {}

VisionSession.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  exerciseName: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  endedAt: {
    type: DataTypes.DATE
  },
  repsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  accuracyScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  feedback: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  rawData: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  sequelize,
  modelName: 'VisionSession',
  tableName: 'vision_sessions',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'startedAt'] }
  ]
});

