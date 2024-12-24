const OrderStatusEnum = {
    PENDING: {value: 0, name: 'PENDING'},
    CONFIRMED: {value: 1, name: 'CONFIRMED'},
    PAID: {value: 2, name: 'PAID'},
    COMPLETED: {value: 3, name: 'COMPLETED'},

    properties: {
        0: {name: 'PENDING'},
        1: {name: 'CONFIRMED'},
        2: {name: 'PAID'},
        3: {name: 'COMPLETED'}
    }
};

module.exports = {
    OrderStatusEnum
};