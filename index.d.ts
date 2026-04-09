// index.d.ts

type ValidationResult = true | string | Record<string, any>;

interface BaseValidator<T> {
    _type: string;
    _isRequired(): boolean;

    validate(value: any): ValidationResult;

    required(message?: string): this;
    custom(fn: (value: T) => ValidationResult): this;
}

interface StringValidator extends BaseValidator<string> {
    minLength(limit: number, message?: string): this;
    maxLength(limit: number, message?: string): this;
    email(message?: string): this;
    url(message?: string): this;
    regex(pattern: RegExp, message?: string): this;
    enum(values: string[], message?: string): this;
}

interface NumberValidator extends BaseValidator<number> {
    min(limit: number, message?: string): this;
    max(limit: number, message?: string): this;
    enum(values: number[], message?: string): this;
}

interface BooleanValidator extends BaseValidator<boolean> {}

interface DateValidator extends BaseValidator<Date> {}

interface ArrayValidator<T> extends BaseValidator<T[]> {
    minElements(limit: number, message?: string): this;
    maxElements(limit: number, message?: string): this;
}

type ObjectDefinition = Record<string, BaseValidator<any>>;

interface ObjectValidator extends BaseValidator<Record<string, any>> {
    // Object validators don’t have extra methods for now
}

interface SchemaValidationResult {
    valid: boolean;
    errors: Record<string, any>;
    value: Record<string, any>;
}

interface SchemaValidator {
    validate(data: Record<string, any>): SchemaValidationResult;
}

export interface LuneSchemaAPI {
    string(): StringValidator;
    number(): NumberValidator;
    boolean(): BooleanValidator;
    date(): DateValidator;
    array<T>(itemValidator: BaseValidator<T>): ArrayValidator<T>;
    object(definition: ObjectDefinition): ObjectValidator;
    schema(definition: ObjectDefinition): SchemaValidator;
}

declare const LuneSchema: LuneSchemaAPI;

export default LuneSchema;