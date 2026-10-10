const { Joi } = require("./common");

const password = Joi.string()
  .min(8)
  .max(100)
  .pattern(/[A-Za-z]/)
  .pattern(/[0-9]/)
  .messages({ "string.pattern.base": "Password must contain letters and numbers" });

module.exports = {
  login: {
    body: Joi.object({
      email: Joi.string().trim().lowercase().email().required(),
      password: Joi.string().required(),
    }),
  },
  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: password.required().invalid(Joi.ref("currentPassword")).messages({
        "any.invalid": "New password must be different from the current one",
      }),
    }),
  },
  updateProfile: {
    body: Joi.object({
      name: Joi.string().trim().min(2).max(100),
      location: Joi.string().trim().max(200).allow(""),
      contactPhone: Joi.string().trim().max(30).allow(""),
    }).min(1),
  },
  register: {
    body: Joi.object({
      name: Joi.string().trim().max(100).allow("").optional(),
      email: Joi.string().trim().lowercase().email().required(),
      password: password.required(),
      role: Joi.string().valid("participant", "admin").optional(),
      participantRole: Joi.string().valid("Manufacturer", "Distributor", "Wholesaler", "Pharmacy").optional(),
      walletAddress: Joi.string().trim().allow("").optional(),
      location: Joi.string().trim().max(200).allow("").optional(),
    }),
  },
  password,
};