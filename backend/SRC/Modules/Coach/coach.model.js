// src/Modules/Coach/coach.model.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../DB/connection.js';

export class CoachProfile extends Model {}

CoachProfile.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  bio: {
    type: DataTypes.TEXT
  },
  specialties: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  experienceYears: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  certifications: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  availability: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gallery: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of {id, url, caption, type}'
  },
  transformations: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of {id, beforeImageUrl, afterImageUrl, description, results, clientName, createdAt}'
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  ratingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  approvedBy: {
    type: DataTypes.INTEGER
  },
  approvedAt: {
    type: DataTypes.DATE
  }
}, {
  sequelize,
  modelName: 'CoachProfile',
  tableName: 'coach_profiles',
  timestamps: true
});

export class Coach extends Model {}

Coach.init({
  name: {
    type: DataTypes.STRING(120),
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  trainingLocation: {
    type: DataTypes.STRING(200),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Coach',
  tableName: 'coaches',
  timestamps: true
});
