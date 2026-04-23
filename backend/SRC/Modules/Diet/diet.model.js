// src/Modules/Diet/diet.model.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../DB/connection.js';

export class DietPlan extends Model {}
export class DietLog extends Model {}

DietPlan.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  goal: {
    type: DataTypes.ENUM('weight_loss', 'muscle_gain', 'maintenance', 'endurance'),
    allowNull: false
  },
  dietaryPreference: {
    type: DataTypes.ENUM('none', 'vegetarian', 'vegan', 'gluten_free', 'keto', 'paleo'),
    defaultValue: 'none'
  },
  dailyCalorieTarget: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  macronutrients: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  weeklyMealPlan: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  assignedByCoachId: {
    type: DataTypes.INTEGER
  },
  assignedAt: {
    type: DataTypes.DATE
  },
  hydrationGoal: {
    type: DataTypes.INTEGER,
    defaultValue: 2500
  },
  supplements: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  weekStartDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  generatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'DietPlan',
  tableName: 'diet_plans',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'isActive'] },
    { fields: ['weekStartDate'] }
  ]
});

DietLog.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  dietPlanId: {
    type: DataTypes.INTEGER
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  mealsCompleted: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  caloriesConsumed: {
    type: DataTypes.INTEGER
  },
  macrosConsumed: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  notes: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.ENUM('followed', 'partial', 'missed'),
    defaultValue: 'partial'
  }
}, {
  sequelize,
  modelName: 'DietLog',
  tableName: 'diet_logs',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'date'] },
    { fields: ['dietPlanId'] }
  ]
});