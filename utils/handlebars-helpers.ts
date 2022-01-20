module.exports = {
    switch: function(value: any, options: { fn: (arg0: any) => any; }) {
        this.switch_value = value;
        this.switch_break = false;
        return options.fn(this);
    },
    case: function(value: any, options: { fn: (arg0: any) => any; }) {
        if (value == this.switch_value) {
            this.switch_break = true;
            return options.fn(this);
        }
    },
    default: function(value: any, options: any) {
        if (this.switch_break == false) {
            return value;
        }
    },
    ifCond: function (v1: number, operator: any, v2: number, options: { fn: (arg0: any) => any; inverse: (arg0: any) => any; }) {

        switch (operator) {
            case '==':
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=':
                return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==':
                return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            case '&&':
                return (v1 && v2) ? options.fn(this) : options.inverse(this);
            case '||':
                return (v1 || v2) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    }
}