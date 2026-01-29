/**
 * Add User Controller
 * Handles creating new users (Admin only)
 */

const bcrypt = require('bcryptjs');
const { User, Role } = require('../../models');
const { sendSuccess, sendError, sendValidationError } = require('../../utils/responseUtils');

/**
 * Create a new user
 * @route POST /api/users
 * @access Admin only
 */
const addUser = async (req, res) => {
    try {
        const { name, email, password, role_id } = req.body;

        // Validate required fields
        const errors = [];
        if (!name || name.trim() === '') {
            errors.push({ field: 'name', message: 'Name is required' });
        }
        if (!email || email.trim() === '') {
            errors.push({ field: 'email', message: 'Email is required' });
        }
        if (!password || password.trim() === '') {
            errors.push({ field: 'password', message: 'Password is required' });
        } else if (password.length < 6) {
            errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
        }

        if (errors.length > 0) {
            return sendValidationError(res, errors);
        }

        // Check if email already exists
        const existingUser = await User.findOne({
            where: { email: email.toLowerCase().trim() }
        });

        if (existingUser) {
            return sendError(res, 'Email already exists', 409);
        }

        // Validate role_id if provided
        let userRoleId = role_id || 2; // Default to 'user' role
        if (role_id) {
            const roleExists = await Role.findByPk(role_id);
            if (!roleExists) {
                return sendError(res, 'Invalid role specified', 400);
            }
            userRoleId = role_id;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role_id: userRoleId
        });

        // Fetch user with role
        const createdUser = await User.findByPk(user.id, {
            attributes: ['id', 'name', 'email', 'role_id', 'createdAt'],
            include: [{
                model: Role,
                as: 'role',
                attributes: ['id', 'role']
            }]
        });

        return sendSuccess(res, 'User created successfully', {
            user: createdUser
        }, 201);

    } catch (error) {
        console.error('Add user error:', error);

        // Handle Sequelize validation errors
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(e => ({
                field: e.path,
                message: e.message
            }));
            return sendValidationError(res, errors);
        }

        return sendError(res, 'An error occurred while creating user.');
    }
};

module.exports = {
    addUser
};
