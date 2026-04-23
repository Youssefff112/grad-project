// src/Modules/Exercise/exercise.model.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../DB/connection.js';

export class Exercise extends Model {}

Exercise.init({
  name: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  category: {
    type: DataTypes.ENUM('cardio', 'strength', 'flexibility', 'balance', 'sports', 'other'),
    allowNull: false
  },
  muscleGroups: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  equipment: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  difficulty: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    defaultValue: 'beginner'
  },
  instructions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  tips: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  images: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  videos: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  createdBy: {
    type: DataTypes.INTEGER
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  sequelize,
  modelName: 'Exercise',
  tableName: 'exercises',
  timestamps: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['category'] },
    { fields: ['isActive'] }
  ]
});

