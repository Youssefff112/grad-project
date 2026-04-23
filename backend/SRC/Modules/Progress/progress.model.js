// src/Modules/Progress/progress.model.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../DB/connection.js';

export class BodyMeasurement extends Model {}
export class WorkoutAccuracy extends Model {}

BodyMeasurement.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  weight: {
    type: DataTypes.FLOAT
  },
  bodyFat: {
    type: DataTypes.FLOAT
  },
  chest: {
    type: DataTypes.FLOAT
  },
  waist: {
    type: DataTypes.FLOAT
  },
  hips: {
    type: DataTypes.FLOAT
  },
  arms: {
    type: DataTypes.FLOAT
  },
  thighs: {
    type: DataTypes.FLOAT
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: 'BodyMeasurement',
  tableName: 'body_measurements',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'date'] }
  ]
});

WorkoutAccuracy.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  workoutLogId: {
    type: DataTypes.INTEGER
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  accuracyScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  repsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  source: {
    type: DataTypes.ENUM('vision', 'manual'),
    defaultValue: 'vision'
  },
  feedback: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  sequelize,
  modelName: 'WorkoutAccuracy',
  tableName: 'workout_accuracy',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'date'] },
    { fields: ['workoutLogId'] }
  ]
});

