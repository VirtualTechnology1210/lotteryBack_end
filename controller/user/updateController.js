/**
 * Update User Controller
 * Handles updating users (Admin only)
 */

const bcrypt = require('bcryptjs');
const { User, Role } = require('../../models');
const { sendSuccess, sendError, sendNotFound, sendValidationError } = require('../../utils/responseUtils');

/**
 * Update user by ID
 * @route PUT /api/users/:id
 * @access Admin only
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role_id } = req.body;

        // Find user
        const user = await User.findByPk(id);

        if (!user) {
            return sendNotFound(res, 'User');
        }

        // Validate fields
        const errors = [];
        if (name !== undefined && name.trim() === '') {
            errors.push({ field: 'name', message: 'Name cannot be empty' });
        }
        if (email !== undefined && email.trim() === '') {
            errors.push({ field: 'email', message: 'Email cannot be empty' });
        }
        if (password !== undefined && password.length < 6) {
            errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
        }

        if (errors.length > 0) {
            return sendValidationError(res, errors);
        }

        // Check if new email already exists (if email is being updated)
        if (email && email.toLowerCase().trim() !== user.email) {
            const existingUser = await User.findOne({
                where: { email: email.toLowerCase().trim() }
            });

            if (existingUser) {
                return sendError(res, 'Email already exists', 409);
            }
        }

        // Validate role_id if provided
        if (role_id) {
            const roleExists = await Role.findByPk(role_id);
            if (!roleExists) {
                return sendError(res, 'Invalid role specified', 400);
            }
        }

        // Prepare update data
        const updateData = {};
        if (name) updateData.name = name.trim();
        if (email) updateData.email = email.toLowerCase().trim();
        if (password) updateData.password = await bcrypt.hash(password, 10);
        if (role_id) updateData.role_id = role_id;

        // Update user
        await user.update(updateData);

        // Fetch updated user with role
        const updatedUser = await User.findByPk(id, {
            attributes: ['id', 'name', 'email', 'role_id', 'createdAt', 'updatedAt'],
            include: [{
                model: Role,
                as: 'role',
                attributes: ['id', 'role']
            }]
        });

        return sendSuccess(res, 'User updated successfully', {
            user: updatedUser
        });

    } catch (error) {
        console.error('Update user error:', error);

        // Handle Sequelize validation errors
        if (error.name === 'SequelizeValidationError') {
            const errors = error.errors.map(e => ({
                field: e.path,
                message: e.message
            }));
            return sendValidationError(res, errors);
        }

        return sendError(res, 'An error occurred while updating user.');
    }
};

module.exports = {
    updateUser
};
