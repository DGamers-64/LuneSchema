// LuneSchema.js

function createBaseValidator(type) {
    const rules = [];
    let isRequired = false;

    const api = {
        _type: type,
        _isRequired() { return isRequired },

        validate(value) {
            const absent = value === undefined || value === null || (type === "string" && value === "");
            if (absent) return isRequired ? "Campo requerido" : true;

            for (const rule of rules) {
                const result = rule(value);
                if (result !== true) return result;
            }

            return true;
        },

        required(message = "Campo requerido") {
            isRequired = true;
            rules.unshift(v =>
                v === undefined || v === null || (type === "string" && v === "") ? message : true
            );
            return api;
        },

        custom(fn) {
            rules.push(fn);
            return api;
        }
    };

    return { api, rules };
}

// STRING VALIDATOR
function stringValidator() {
    const { api, rules } = createBaseValidator("string");

    api.minLength = (limit, message = `Mínimo ${limit} caracteres`) => {
        rules.push(v => v.length < limit ? message : true);
        return api;
    };

    api.maxLength = (limit, message = `Máximo ${limit} caracteres`) => {
        rules.push(v => v.length > limit ? message : true);
        return api;
    };

    api.email = (message = "Email inválido") => {
        rules.push(v => /\S+@\S+\.\S+/.test(v) ? true : message);
        return api;
    };

    api.url = (message = "URL inválida") => {
        rules.push(v => {
            try {
                new URL(v);
                return true;
            } catch {
                return message;
            }
        });
        return api;
    };

    api.enum = (values, message = `Debe ser uno de: ${values.join(", ")}`) => {
        rules.push(v => values.includes(v) ? true : message);
        return api;
    };

    api.regex = (pattern, message = "Formato inválido") => {
        rules.push(v => pattern.test(v) ? true : message);
        return api;
    };

    api.validate = value => {
        const absent = value === undefined || value === null || value === "";
        if (absent) return api._isRequired() ? "Campo requerido" : true;
        if (typeof value !== "string") return "Debe ser un string";
        for (const rule of rules) {
            const result = rule(value);
            if (result !== true) return result;
        }
        return true;
    };

    return api;
}

// NUMBER VALIDATOR
function numberValidator() {
    const { api, rules } = createBaseValidator("number");

    api.min = (limit, message = `El valor mínimo es ${limit}`) => {
        rules.push(v => v < limit ? message : true);
        return api;
    };

    api.max = (limit, message = `El valor máximo es ${limit}`) => {
        rules.push(v => v > limit ? message : true);
        return api;
    };

    api.enum = (values, message = `Debe ser uno de: ${values.join(", ")}`) => {
        rules.push(v => values.includes(v) ? true : message);
        return api;
    };

    api.validate = value => {
        const absent = value === undefined || value === null;
        if (absent) return api._isRequired() ? "Campo requerido" : true;
        if (typeof value !== "number" || isNaN(value)) return "Debe ser un número";
        for (const rule of rules) {
            const result = rule(value);
            if (result !== true) return result;
        }
        return true;
    };

    return api;
}

// BOOLEAN VALIDATOR
function booleanValidator() {
    const { api, rules } = createBaseValidator("boolean");

    api.validate = value => {
        const absent = value === undefined || value === null;
        if (absent) return api._isRequired() ? "Campo requerido" : true;
        if (value !== true && value !== false) return "Debe ser un booleano";
        for (const rule of rules) {
            const result = rule(value);
            if (result !== true) return result;
        }
        return true;
    };

    return api;
}

// DATE VALIDATOR
function dateValidator() {
    const { api, rules } = createBaseValidator("date");

    api.validate = value => {
        const absent = value === undefined || value === null;
        if (absent) return api._isRequired() ? "Campo requerido" : true;
        if (!(value instanceof Date) || isNaN(value)) return "Debe ser una fecha válida";
        for (const rule of rules) {
            const result = rule(value);
            if (result !== true) return result;
        }
        return true;
    };

    return api;
}

// ARRAY VALIDATOR
function createArrayValidator(itemValidator) {
    const rules = [];
    let isRequired = false;

    const api = {
        _type: "array",
        _isRequired() { return isRequired },

        validate(value) {
            const absent = value === undefined || value === null;
            if (absent) return isRequired ? "Campo requerido" : true;

            if (!Array.isArray(value)) return "Debe ser un array";

            for (const rule of rules) {
                const result = rule(value);
                if (result !== true) return result;
            }

            if (itemValidator) {
                const errors = {};
                for (let i = 0; i < value.length; i++) {
                    const result = itemValidator.validate(value[i]);
                    if (result !== true) errors[i] = result;
                }
                if (Object.keys(errors).length > 0) return errors;
            }

            return true;
        },

        minElements(limit, message = `Mínimo ${limit} elemento(s)`) {
            rules.push(v => v.length < limit ? message : true);
            return api;
        },

        maxElements(limit, message = `Máximo ${limit} elemento(s)`) {
            rules.push(v => v.length > limit ? message : true);
            return api;
        },

        required(message = "Campo requerido") {
            isRequired = true;
            return api;
        },

        custom(fn) {
            rules.push(fn);
            return api;
        }
    };

    return api;
}

// OBJECT VALIDATOR
function createObjectValidator(definition) {
    let isRequired = false;

    const api = {
        _type: "object",
        _isRequired() { return isRequired },

        validate(value) {
            const absent = value === undefined || value === null;
            if (absent) return isRequired ? "Campo requerido" : true;

            if (typeof value !== "object" || Array.isArray(value)) return "Debe ser un objeto";

            const errors = {};
            const result = {};

            for (const key in definition) {
                const validator = definition[key];
                const res = validator.validate(value[key]);
                if (res !== true) {
                    errors[key] = res;
                } else if (value[key] !== undefined) {
                    result[key] = value[key];
                }
            }

            return Object.keys(errors).length > 0 ? errors : true;
        },

        required(message = "Campo requerido") {
            isRequired = true;
            return api;
        }
    };

    return api;
}

// SCHEMA VALIDATOR
function createSchema(definition) {
    return {
        validate(data) {
            const errors = {};
            const value = {};

            for (const key in definition) {
                const validator = definition[key];
                const result = validator.validate(data[key]);
                if (result !== true) errors[key] = result;
                else if (data[key] !== undefined) value[key] = data[key];
            }

            return {
                valid: Object.keys(errors).length === 0,
                errors,
                value
            };
        }
    };
}

// EXPORT API
const LuneSchema = {
    string: () => stringValidator(),
    number: () => numberValidator(),
    boolean: () => booleanValidator(),
    date: () => dateValidator(),
    array: itemValidator => createArrayValidator(itemValidator),
    object: def => createObjectValidator(def),
    schema: def => createSchema(def)
};

export default LuneSchema;