const { User } = require('../modules/user/models/user');

const checkOwnership = (model, resourceKey) => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params[resourceKey] || req.body[resourceKey] || req.query[resourceKey];
            const resource = await model.findByPk(resourceId,{include: [{model: User, as: 'user'}]});
            if (!resource) {
                return res.status(404).json({ message: `${model.name} not found` });
            }
            if (resource.user_id !== req.user.id) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            req[resourceKey] = resource;
            next();
        } catch (error) {
            console.log('Error in checkOwnership middleware', error);
            next(error);
        }
        next();
    };
}

module.exports = {
    checkOwnership
}