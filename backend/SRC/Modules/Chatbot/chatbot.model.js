// src/Modules/Chatbot/chatbot.model.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../../DB/connection.js';

export class ChatSession extends Model {}
export class ChatMessage extends Model {}
export class ChatbotConfig extends Model {}

ChatSession.init({
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  coachId: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.ENUM('active', 'closed'),
    defaultValue: 'active'
  },
  lastMessageAt: {
    type: DataTypes.DATE
  }
}, {
  sequelize,
  modelName: 'ChatSession',
  tableName: 'chat_sessions',
  timestamps: true,
  indexes: [
    { fields: ['clientId', 'status'] },
    { fields: ['coachId'] }
  ]
});

ChatMessage.init({
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sender: {
    type: DataTypes.ENUM('client', 'bot'),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  meta: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  sentAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'ChatMessage',
  tableName: 'chat_messages',
  timestamps: true,
  indexes: [
    { fields: ['sessionId', 'sentAt'] }
  ]
});

ChatbotConfig.init({
  coachId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  persona: {
    type: DataTypes.STRING(120),
    defaultValue: 'Supportive fitness coach'
  },
  tone: {
    type: DataTypes.STRING(60),
    defaultValue: 'encouraging'
  },
  coachingStyle: {
    type: DataTypes.STRING(120),
    defaultValue: 'goal-oriented'
  },
  safetyNotes: {
    type: DataTypes.TEXT
  },
  extraInstructions: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: 'ChatbotConfig',
  tableName: 'chatbot_configs',
  timestamps: true
});

