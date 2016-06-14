if(!global.hasOwnProperty('db')) {
    var Sequelize = require('sequelize'), sequelize = null;

    if(process.env.postgres://qrdlugwryionxm:Brw2BQ67NVjPFOyZrG261aTmtE@ec2-54-227-245-222.compute-1.amazonaws.com:5432/ddgis28ngkec7r, {
        sequelize = new Sequelize(process.env.postgres://qrdlugwryionxm:Brw2BQ67NVjPFOyZrG261aTmtE@ec2-54-227-245-222.compute-1.amazonaws.com:5432/ddgis28ngkec7r, {
            dialect: 'postgres',
            protocol: 'postgres',
            port: match[4],
            host: match[3],
            logging: true;
        })
    } else {
        sequelize = new Sequelize('example-app-db', 'root', null);
    }

    global.db = {
        Sequelize: Sequelize,
        sequelize: sequelize,
        User: sequlize.import(__dirname + '/user');
    }
}

module.exports = global.db;
