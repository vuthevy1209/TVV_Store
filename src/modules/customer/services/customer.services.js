const Customer = require('../models/customer');


class CustomerService{
    async getByUserId(userId){
        return await Customer.findOne({where:{user_id:userId}});
    }
}

module.exports = new CustomerService();