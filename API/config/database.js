// database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();
if(process.env.ENVIROMENT === 'dev'){
  const Connection = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    // dialectOptions: {
    //   ssl: {
    //     require: true,
    //     rejectUnauthorized: false
    //   }
    // },
    logging: false, // Set to true for SQL query logging
  });
  module.exports = Connection;
}else{
  const Connection = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false, // Set to true for SQL query logging
  });
  module.exports = Connection;
};



