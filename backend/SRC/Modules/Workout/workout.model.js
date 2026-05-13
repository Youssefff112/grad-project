// src/Modules/Workout/workout.model.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../DB/connection.js';
import { User } from '../User/user.model.js';

export class WorkoutPlan extends Model {}
export class WorkoutLog extends Model {}

WorkoutPlan.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  planName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  goal: {
    type: DataTypes.ENUM('weight_loss', 'muscle_gain', 'maintenance', 'endurance'),
    allowNull: false
  },
  experienceLevel: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    allowNull: false
  },
  weeklySchedule: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  assignedByCoachId: {
    type: DataTypes.INTEGER
  },
  assignedAt: {
    type: DataTypes.DATE
  },
  weekStartDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // True when the client submitted this plan to their coach for review.
  // Plan stays inactive (isActive: false) until the coach approves it.
  pendingCoachReview: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  generatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'WorkoutPlan',
  tableName: 'workout_plans',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'isActive'] },
    { fields: ['weekStartDate'] }
  ]
});

WorkoutLog.init({
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  workoutPlanId: {
    type: DataTypes.INTEGER
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  startTime: {
    type: DataTypes.DATE
  },
  endTime: {
    type: DataTypes.DATE
  },
  day: {
    type: DataTypes.ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
    allowNull: false
  },
  exercises: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  duration: {
    type: DataTypes.INTEGER
  },
  calories: {
    type: DataTypes.INTEGER
  },
  notes: {
    type: DataTypes.TEXT
  },
  rating: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.ENUM('in_progress', 'completed', 'cancelled'),
    defaultValue: 'completed'
  }
}, {
  sequelize,
  modelName: 'WorkoutLog',
  tableName: 'workout_logs',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'date'] },
    { fields: ['workoutPlanId'] }
  ]
});

// Associations
User.hasMany(WorkoutPlan, { foreignKey: 'userId', as: 'workoutPlans' });
WorkoutPlan.belongsTo(User, { foreignKey: 'userId', as: 'user' });

WorkoutPlan.hasMany(WorkoutLog, { foreignKey: 'workoutPlanId', as: 'logs' });
WorkoutLog.belongsTo(WorkoutPlan, { foreignKey: 'workoutPlanId', as: 'plan' });

User.hasMany(WorkoutLog, { foreignKey: 'userId', as: 'workoutLogs' });
WorkoutLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

