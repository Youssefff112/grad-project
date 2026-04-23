// backend/SRC/Models/CoachReview.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../DB/connection.js';

export class CoachReview extends Model {}

CoachReview.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  coachId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'coach_profiles',
      key: 'id'
    }
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  sequelize,
  modelName: 'CoachReview',
  tableName: 'coach_reviews',
  timestamps: true,
  indexes: [
    {
      fields: ['coachId', 'createdAt']
    },
    {
      fields: ['clientId', 'coachId']
    },
    {
      fields: ['coachId']
    }
  ]
});
