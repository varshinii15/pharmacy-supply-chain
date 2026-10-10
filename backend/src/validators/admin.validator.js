const { Joi } = require("./common");
const { password } = require("./auth.validator");

module.exports = {
  createAdmin: {
    body: Joi.object({
      name: Joi.string().trim().min(2).max(100).required(),
      email: Joi.string().trim().lowercase().email().required(),
      password: password.required(),
    }),
  },
};
