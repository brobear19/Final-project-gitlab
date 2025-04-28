const { DataTypes } = require('sequelize');
const Connection = require('../config/database'); // your database connection

const Transaction = Connection.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('deposit', 'withdrawal', 'win', 'loss'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'transactions',
  timestamps: false // we manually manage timestamp
});

module.exports = Transaction;
