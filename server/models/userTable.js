module.exports = (sequelize, DataTypes) => {
    return sequelize.define("UserTable", {
        user_Id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        user_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        user_lastname: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        user_nickname: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        user_email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        user_username: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        user_pass: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        forgot_password_code: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    }, {
        tableName: "userTable",
        timestamps: false
    });
};
