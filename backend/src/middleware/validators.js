const { body } = require('express-validator');

exports.registerRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
];

exports.loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];
