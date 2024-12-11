const Decimal = require('decimal.js');

class DecimalUtils {
    static toDecimal(value) {
        return new Decimal(value);
    }

    static add(value1, value2) {
        return new Decimal(value1).plus(new Decimal(value2));
    }

    static subtract(value1, value2) {
        return new Decimal(value1).minus(new Decimal(value2));
    }

    static multiply(value1, value2) {
        return new Decimal(value1).times(new Decimal(value2));
    }

    static divide(value1, value2) {
        return new Decimal(value1).div(new Decimal(value2));
    }

    static toString(value) {
        return new Decimal(value).toString();
    }
}

module.exports = DecimalUtils;