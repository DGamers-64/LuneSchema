function createValidator(type) {
    const rules = []
    let isRequired = false

    const api = {
        _type: type,
        _isRequired() { return isRequired },

        validate(value) {
            const absent = value === undefined || value === null || value === ""
            if (absent) {
                if (isRequired) return "Campo requerido"
                return true
            }

            if (type === "string" && typeof value !== "string")
                return "Debe ser un string"
            if (type === "number" && typeof value !== "number")
                return "Debe ser un número"

            for (const rule of rules) {
                const result = rule(value)
                if (result !== true) return result
            }

            return true
        },

        maxLength(limit, message = `Máximo ${limit} caracteres`) {
            rules.push(v => v.length > limit ? message : true)
            return api
        },

        minLength(limit, message = `Mínimo ${limit} caracteres`) {
            rules.push(v => v.length < limit ? message : true)
            return api
        },

        max(limit, message = `El valor máximo es ${limit}`) {
            rules.push(v => v > limit ? message : true)
            return api
        },

        min(limit, message = `El valor mínimo es ${limit}`) {
            rules.push(v => v < limit ? message : true)
            return api
        },

        required(message = "Campo requerido") {
            isRequired = true
            rules.unshift(v =>
                (v === undefined || v === null || v === "") ? message : true
            )
            return api
        },

        custom(fn) {
            rules.push(fn)
            return api
        }
    }

    return api
}

function createArrayValidator(itemValidator) {
    const rules = []
    let isRequired = false

    const api = {
        _type: "array",
        _isRequired() { return isRequired },

        validate(value) {
            const absent = value === undefined || value === null
            if (absent) {
                if (isRequired) return "Campo requerido"
                return true
            }

            if (!Array.isArray(value)) return "Debe ser un array"

            for (const rule of rules) {
                const result = rule(value)
                if (result !== true) return result
            }

            if (itemValidator) {
                const errors = {}
                for (let i = 0; i < value.length; i++) {
                    const result = itemValidator.validate(value[i])
                    if (result !== true) errors[i] = result
                }
                if (Object.keys(errors).length > 0) return errors
            }

            return true
        },

        minElements(limit, message = `Mínimo ${limit} elemento(s)`) {
            rules.push(v => v.length < limit ? message : true)
            return api
        },

        maxElements(limit, message = `Máximo ${limit} elemento(s)`) {
            rules.push(v => v.length > limit ? message : true)
            return api
        },

        required(message = "Campo requerido") {
            isRequired = true
            return api
        },

        custom(fn) {
            rules.push(fn)
            return api
        }
    }

    return api
}

function createObjectValidator(definition) {
    let isRequired = false

    const api = {
        _type: "object",
        _isRequired() { return isRequired },

        validate(value) {
            const absent = value === undefined || value === null
            if (absent) {
                if (isRequired) return "Campo requerido"
                return true
            }

            if (typeof value !== "object" || Array.isArray(value))
                return "Debe ser un objeto"

            const errors = {}
            const result = {}

            for (const key in definition) {
                const validator = definition[key]
                const res = validator.validate(value[key])

                if (res !== true) {
                    errors[key] = res
                } else {
                    result[key] = value[key]
                }
            }

            if (Object.keys(errors).length > 0) return errors
            return true
        },

        required(message = "Campo requerido") {
            isRequired = true
            return api
        }
    }

    return api
}

function createSchema(definition) {
    return {
        validate(data) {
            const errors = {}
            const value = {}

            for (const key in definition) {
                const validator = definition[key]
                const result = validator.validate(data[key])

                if (result !== true) {
                    errors[key] = result
                } else {
                    // Solo incluir en value si el campo estaba presente
                    if (data[key] !== undefined) value[key] = data[key]
                }
            }

            return {
                valid: Object.keys(errors).length === 0,
                errors,
                value
            }
        }
    }
}

const LuneModels = {
    string() { return createValidator("string") },
    number() { return createValidator("number") },
    array(itemValidator) { return createArrayValidator(itemValidator) },
    object(definition) { return createObjectValidator(definition) },
    schema(definition) { return createSchema(definition) }
}

export default LuneModels