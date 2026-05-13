// src/Modules/Coach/coach.model.js
//
// Coach identity lives in `users` (role: 'coach'). Extended data and approval
// live in `coach_profiles` (CoachProfile.userId → users.id). Marketplace and
// assignments use CoachProfile + User — not a separate legacy `coaches` table.
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
  /** Admin gate: pending → approved or rejected (revoke also sets rejected). */
  applicationStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false
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

// Lazy import to avoid circular dependencies
import('../User/user.model.js').then(({ User }) => {
  CoachProfile.belongsTo(User, { foreignKey: 'userId', as: 'User' });
  User.hasOne(CoachProfile, { foreignKey: 'userId', as: 'CoachProfile' });
}).catch(() => {});
