const Joi = require("joi");


const signupSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  nickname: Joi.string().min(2).max(30).optional(),
  username: Joi.string().min(4).max(30).required(),
  email: Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({ tlds: { allow: ["com", "net"] } }),
  password: Joi.string()
    .required()
    .pattern(
      new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$")
    )
    .messages({
      "string.pattern.base": `"password" must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&) and be at least 8 characters long`
    }),
});


const signinSchema = Joi.object({
  username: Joi.string().min(4).max(20).required(), 
  password: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$")),
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"))
    .messages({
      "string.pattern.base": "Old password format is incorrect.",
    }),
  newPassword: Joi.string()
    .required()
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"))
    .messages({
      "string.pattern.base": "New password must meet security requirements.",
    }),
});

module.exports = { 
  signupSchema, 
  signinSchema,
  changePasswordSchema,  
};
