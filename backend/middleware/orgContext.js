// Organization Context Middleware
// Extracts organization_id from authenticated user and adds to request

module.exports = async (req, res, next) => {
    try {
        // If user is authenticated, their organization_id should be available
        if (req.user && req.user.organization_id) {
            req.organization_id = req.user.organization_id;
        }
        next();
    } catch (error) {
        console.error('Organization context error:', error);
        next();
    }
};
