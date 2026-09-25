import z from "@deepseek-ai/schemastery";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
//#region node_modules/js-yaml/dist/js-yaml.mjs
function getDefaultExportFromCjs(x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var jsYaml = {};
var loader = {};
var common = {};
var hasRequiredCommon;
function requireCommon() {
	if (hasRequiredCommon) return common;
	hasRequiredCommon = 1;
	function isNothing(subject) {
		return typeof subject === "undefined" || subject === null;
	}
	function isObject(subject) {
		return typeof subject === "object" && subject !== null;
	}
	function toArray(sequence) {
		if (Array.isArray(sequence)) return sequence;
		else if (isNothing(sequence)) return [];
		return [sequence];
	}
	function extend(target, source) {
		if (source) {
			const sourceKeys = Object.keys(source);
			for (let index = 0, length = sourceKeys.length; index < length; index += 1) {
				const key = sourceKeys[index];
				target[key] = source[key];
			}
		}
		return target;
	}
	function repeat(string, count) {
		let result = "";
		for (let cycle = 0; cycle < count; cycle += 1) result += string;
		return result;
	}
	function isNegativeZero(number) {
		return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
	}
	common.isNothing = isNothing;
	common.isObject = isObject;
	common.toArray = toArray;
	common.repeat = repeat;
	common.isNegativeZero = isNegativeZero;
	common.extend = extend;
	return common;
}
var exception;
var hasRequiredException;
function requireException() {
	if (hasRequiredException) return exception;
	hasRequiredException = 1;
	function formatError(exception2, compact) {
		let where = "";
		const message = exception2.reason || "(unknown reason)";
		if (!exception2.mark) return message;
		if (exception2.mark.name) where += "in \"" + exception2.mark.name + "\" ";
		where += "(" + (exception2.mark.line + 1) + ":" + (exception2.mark.column + 1) + ")";
		if (!compact && exception2.mark.snippet) where += "\n\n" + exception2.mark.snippet;
		return message + " " + where;
	}
	function YAMLException2(reason, mark) {
		Error.call(this);
		this.name = "YAMLException";
		this.reason = reason;
		this.mark = mark;
		this.message = formatError(this, false);
		if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
		else this.stack = (/* @__PURE__ */ new Error()).stack || "";
	}
	YAMLException2.prototype = Object.create(Error.prototype);
	YAMLException2.prototype.constructor = YAMLException2;
	YAMLException2.prototype.toString = function toString(compact) {
		return this.name + ": " + formatError(this, compact);
	};
	exception = YAMLException2;
	return exception;
}
var snippet;
var hasRequiredSnippet;
function requireSnippet() {
	if (hasRequiredSnippet) return snippet;
	hasRequiredSnippet = 1;
	const common2 = requireCommon();
	function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
		let head = "";
		let tail = "";
		const maxHalfLength = Math.floor(maxLineLength / 2) - 1;
		if (position - lineStart > maxHalfLength) {
			head = " ... ";
			lineStart = position - maxHalfLength + head.length;
		}
		if (lineEnd - position > maxHalfLength) {
			tail = " ...";
			lineEnd = position + maxHalfLength - tail.length;
		}
		return {
			str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "→") + tail,
			pos: position - lineStart + head.length
		};
	}
	function padStart(string, max) {
		return common2.repeat(" ", max - string.length) + string;
	}
	function makeSnippet(mark, options) {
		options = Object.create(options || null);
		if (!mark.buffer) return null;
		if (!options.maxLength) options.maxLength = 79;
		if (typeof options.indent !== "number") options.indent = 1;
		if (typeof options.linesBefore !== "number") options.linesBefore = 3;
		if (typeof options.linesAfter !== "number") options.linesAfter = 2;
		const re = /\r?\n|\r|\0/g;
		const lineStarts = [0];
		const lineEnds = [];
		let match;
		let foundLineNo = -1;
		while (match = re.exec(mark.buffer)) {
			lineEnds.push(match.index);
			lineStarts.push(match.index + match[0].length);
			if (mark.position <= match.index && foundLineNo < 0) foundLineNo = lineStarts.length - 2;
		}
		if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
		let result = "";
		const lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
		const maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
		for (let i = 1; i <= options.linesBefore; i++) {
			if (foundLineNo - i < 0) break;
			const line2 = getLine(mark.buffer, lineStarts[foundLineNo - i], lineEnds[foundLineNo - i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]), maxLineLength);
			result = common2.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line2.str + "\n" + result;
		}
		const line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
		result += common2.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
		result += common2.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
		for (let i = 1; i <= options.linesAfter; i++) {
			if (foundLineNo + i >= lineEnds.length) break;
			const line2 = getLine(mark.buffer, lineStarts[foundLineNo + i], lineEnds[foundLineNo + i], mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]), maxLineLength);
			result += common2.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line2.str + "\n";
		}
		return result.replace(/\n$/, "");
	}
	snippet = makeSnippet;
	return snippet;
}
var type;
var hasRequiredType;
function requireType() {
	if (hasRequiredType) return type;
	hasRequiredType = 1;
	const YAMLException2 = requireException();
	const TYPE_CONSTRUCTOR_OPTIONS = [
		"kind",
		"multi",
		"resolve",
		"construct",
		"instanceOf",
		"predicate",
		"represent",
		"representName",
		"defaultStyle",
		"styleAliases"
	];
	const YAML_NODE_KINDS = [
		"scalar",
		"sequence",
		"mapping"
	];
	function compileStyleAliases(map2) {
		const result = {};
		if (map2 !== null) Object.keys(map2).forEach(function(style) {
			map2[style].forEach(function(alias) {
				result[String(alias)] = style;
			});
		});
		return result;
	}
	function Type2(tag, options) {
		options = options || {};
		Object.keys(options).forEach(function(name) {
			if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) throw new YAMLException2("Unknown option \"" + name + "\" is met in definition of \"" + tag + "\" YAML type.");
		});
		this.options = options;
		this.tag = tag;
		this.kind = options["kind"] || null;
		this.resolve = options["resolve"] || function() {
			return true;
		};
		this.construct = options["construct"] || function(data) {
			return data;
		};
		this.instanceOf = options["instanceOf"] || null;
		this.predicate = options["predicate"] || null;
		this.represent = options["represent"] || null;
		this.representName = options["representName"] || null;
		this.defaultStyle = options["defaultStyle"] || null;
		this.multi = options["multi"] || false;
		this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
		if (YAML_NODE_KINDS.indexOf(this.kind) === -1) throw new YAMLException2("Unknown kind \"" + this.kind + "\" is specified for \"" + tag + "\" YAML type.");
	}
	type = Type2;
	return type;
}
var schema;
var hasRequiredSchema;
function requireSchema() {
	if (hasRequiredSchema) return schema;
	hasRequiredSchema = 1;
	const YAMLException2 = requireException();
	const Type2 = requireType();
	function compileList(schema2, name) {
		const result = [];
		schema2[name].forEach(function(currentType) {
			let newIndex = result.length;
			result.forEach(function(previousType, previousIndex) {
				if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) newIndex = previousIndex;
			});
			result[newIndex] = currentType;
		});
		return result;
	}
	function compileMap() {
		const result = {
			scalar: {},
			sequence: {},
			mapping: {},
			fallback: {},
			multi: {
				scalar: [],
				sequence: [],
				mapping: [],
				fallback: []
			}
		};
		function collectType(type2) {
			if (type2.multi) {
				result.multi[type2.kind].push(type2);
				result.multi["fallback"].push(type2);
			} else result[type2.kind][type2.tag] = result["fallback"][type2.tag] = type2;
		}
		for (let index = 0, length = arguments.length; index < length; index += 1) arguments[index].forEach(collectType);
		return result;
	}
	function Schema2(definition) {
		return this.extend(definition);
	}
	Schema2.prototype.extend = function extend(definition) {
		let implicit = [];
		let explicit = [];
		if (definition instanceof Type2) explicit.push(definition);
		else if (Array.isArray(definition)) explicit = explicit.concat(definition);
		else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
			if (definition.implicit) implicit = implicit.concat(definition.implicit);
			if (definition.explicit) explicit = explicit.concat(definition.explicit);
		} else throw new YAMLException2("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
		implicit.forEach(function(type2) {
			if (!(type2 instanceof Type2)) throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
			if (type2.loadKind && type2.loadKind !== "scalar") throw new YAMLException2("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
			if (type2.multi) throw new YAMLException2("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
		});
		explicit.forEach(function(type2) {
			if (!(type2 instanceof Type2)) throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
		});
		const result = Object.create(Schema2.prototype);
		result.implicit = (this.implicit || []).concat(implicit);
		result.explicit = (this.explicit || []).concat(explicit);
		result.compiledImplicit = compileList(result, "implicit");
		result.compiledExplicit = compileList(result, "explicit");
		result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
		return result;
	};
	schema = Schema2;
	return schema;
}
var str;
var hasRequiredStr;
function requireStr() {
	if (hasRequiredStr) return str;
	hasRequiredStr = 1;
	str = new (requireType())("tag:yaml.org,2002:str", {
		kind: "scalar",
		construct: function(data) {
			return data !== null ? data : "";
		}
	});
	return str;
}
var seq;
var hasRequiredSeq;
function requireSeq() {
	if (hasRequiredSeq) return seq;
	hasRequiredSeq = 1;
	seq = new (requireType())("tag:yaml.org,2002:seq", {
		kind: "sequence",
		construct: function(data) {
			return data !== null ? data : [];
		}
	});
	return seq;
}
var map;
var hasRequiredMap;
function requireMap() {
	if (hasRequiredMap) return map;
	hasRequiredMap = 1;
	map = new (requireType())("tag:yaml.org,2002:map", {
		kind: "mapping",
		construct: function(data) {
			return data !== null ? data : {};
		}
	});
	return map;
}
var failsafe;
var hasRequiredFailsafe;
function requireFailsafe() {
	if (hasRequiredFailsafe) return failsafe;
	hasRequiredFailsafe = 1;
	failsafe = new (requireSchema())({ explicit: [
		requireStr(),
		requireSeq(),
		requireMap()
	] });
	return failsafe;
}
var _null;
var hasRequired_null;
function require_null() {
	if (hasRequired_null) return _null;
	hasRequired_null = 1;
	const Type2 = requireType();
	function resolveYamlNull(data) {
		if (data === null) return true;
		const max = data.length;
		return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
	}
	function constructYamlNull() {
		return null;
	}
	function isNull(object) {
		return object === null;
	}
	_null = new Type2("tag:yaml.org,2002:null", {
		kind: "scalar",
		resolve: resolveYamlNull,
		construct: constructYamlNull,
		predicate: isNull,
		represent: {
			canonical: function() {
				return "~";
			},
			lowercase: function() {
				return "null";
			},
			uppercase: function() {
				return "NULL";
			},
			camelcase: function() {
				return "Null";
			},
			empty: function() {
				return "";
			}
		},
		defaultStyle: "lowercase"
	});
	return _null;
}
var bool;
var hasRequiredBool;
function requireBool() {
	if (hasRequiredBool) return bool;
	hasRequiredBool = 1;
	const Type2 = requireType();
	function resolveYamlBoolean(data) {
		if (data === null) return false;
		const max = data.length;
		return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
	}
	function constructYamlBoolean(data) {
		return data === "true" || data === "True" || data === "TRUE";
	}
	function isBoolean(object) {
		return Object.prototype.toString.call(object) === "[object Boolean]";
	}
	bool = new Type2("tag:yaml.org,2002:bool", {
		kind: "scalar",
		resolve: resolveYamlBoolean,
		construct: constructYamlBoolean,
		predicate: isBoolean,
		represent: {
			lowercase: function(object) {
				return object ? "true" : "false";
			},
			uppercase: function(object) {
				return object ? "TRUE" : "FALSE";
			},
			camelcase: function(object) {
				return object ? "True" : "False";
			}
		},
		defaultStyle: "lowercase"
	});
	return bool;
}
var int;
var hasRequiredInt;
function requireInt() {
	if (hasRequiredInt) return int;
	hasRequiredInt = 1;
	const common2 = requireCommon();
	const Type2 = requireType();
	function isHexCode(c) {
		return c >= 48 && c <= 57 || c >= 65 && c <= 70 || c >= 97 && c <= 102;
	}
	function isOctCode(c) {
		return c >= 48 && c <= 55;
	}
	function isDecCode(c) {
		return c >= 48 && c <= 57;
	}
	function resolveYamlInteger(data) {
		if (data === null) return false;
		const max = data.length;
		let index = 0;
		let hasDigits = false;
		if (!max) return false;
		let ch = data[index];
		if (ch === "-" || ch === "+") ch = data[++index];
		if (ch === "0") {
			if (index + 1 === max) return true;
			ch = data[++index];
			if (ch === "b") {
				index++;
				for (; index < max; index++) {
					ch = data[index];
					if (ch !== "0" && ch !== "1") return false;
					hasDigits = true;
				}
				return hasDigits && isFinite(parseYamlInteger(data));
			}
			if (ch === "x") {
				index++;
				for (; index < max; index++) {
					if (!isHexCode(data.charCodeAt(index))) return false;
					hasDigits = true;
				}
				return hasDigits && isFinite(parseYamlInteger(data));
			}
			if (ch === "o") {
				index++;
				for (; index < max; index++) {
					if (!isOctCode(data.charCodeAt(index))) return false;
					hasDigits = true;
				}
				return hasDigits && isFinite(parseYamlInteger(data));
			}
		}
		for (; index < max; index++) {
			if (!isDecCode(data.charCodeAt(index))) return false;
			hasDigits = true;
		}
		if (!hasDigits) return false;
		return isFinite(parseYamlInteger(data));
	}
	function parseYamlInteger(data) {
		let value = data;
		let sign = 1;
		let ch = value[0];
		if (ch === "-" || ch === "+") {
			if (ch === "-") sign = -1;
			value = value.slice(1);
			ch = value[0];
		}
		if (value === "0") return 0;
		if (ch === "0") {
			if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
			if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
			if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
		}
		return sign * parseInt(value, 10);
	}
	function constructYamlInteger(data) {
		return parseYamlInteger(data);
	}
	function isInteger(object) {
		return Object.prototype.toString.call(object) === "[object Number]" && object % 1 === 0 && !common2.isNegativeZero(object);
	}
	int = new Type2("tag:yaml.org,2002:int", {
		kind: "scalar",
		resolve: resolveYamlInteger,
		construct: constructYamlInteger,
		predicate: isInteger,
		represent: {
			binary: function(obj) {
				return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
			},
			octal: function(obj) {
				return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
			},
			decimal: function(obj) {
				return obj.toString(10);
			},
			hexadecimal: function(obj) {
				return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
			}
		},
		defaultStyle: "decimal",
		styleAliases: {
			binary: [2, "bin"],
			octal: [8, "oct"],
			decimal: [10, "dec"],
			hexadecimal: [16, "hex"]
		}
	});
	return int;
}
var float;
var hasRequiredFloat;
function requireFloat() {
	if (hasRequiredFloat) return float;
	hasRequiredFloat = 1;
	const common2 = requireCommon();
	const Type2 = requireType();
	const YAML_FLOAT_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
	const YAML_FLOAT_SPECIAL_PATTERN = /* @__PURE__ */ new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
	function resolveYamlFloat(data) {
		if (data === null) return false;
		if (!YAML_FLOAT_PATTERN.test(data)) return false;
		if (isFinite(parseFloat(data, 10))) return true;
		return YAML_FLOAT_SPECIAL_PATTERN.test(data);
	}
	function constructYamlFloat(data) {
		let value = data.toLowerCase();
		const sign = value[0] === "-" ? -1 : 1;
		if ("+-".indexOf(value[0]) >= 0) value = value.slice(1);
		if (value === ".inf") return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
		else if (value === ".nan") return NaN;
		return sign * parseFloat(value, 10);
	}
	const SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
	function representYamlFloat(object, style) {
		if (isNaN(object)) switch (style) {
			case "lowercase": return ".nan";
			case "uppercase": return ".NAN";
			case "camelcase": return ".NaN";
		}
		else if (Number.POSITIVE_INFINITY === object) switch (style) {
			case "lowercase": return ".inf";
			case "uppercase": return ".INF";
			case "camelcase": return ".Inf";
		}
		else if (Number.NEGATIVE_INFINITY === object) switch (style) {
			case "lowercase": return "-.inf";
			case "uppercase": return "-.INF";
			case "camelcase": return "-.Inf";
		}
		else if (common2.isNegativeZero(object)) return "-0.0";
		const res = object.toString(10);
		return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
	}
	function isFloat(object) {
		return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common2.isNegativeZero(object));
	}
	float = new Type2("tag:yaml.org,2002:float", {
		kind: "scalar",
		resolve: resolveYamlFloat,
		construct: constructYamlFloat,
		predicate: isFloat,
		represent: representYamlFloat,
		defaultStyle: "lowercase"
	});
	return float;
}
var json$1;
var hasRequiredJson;
function requireJson() {
	if (hasRequiredJson) return json$1;
	hasRequiredJson = 1;
	json$1 = requireFailsafe().extend({ implicit: [
		require_null(),
		requireBool(),
		requireInt(),
		requireFloat()
	] });
	return json$1;
}
var core;
var hasRequiredCore;
function requireCore() {
	if (hasRequiredCore) return core;
	hasRequiredCore = 1;
	core = requireJson();
	return core;
}
var timestamp;
var hasRequiredTimestamp;
function requireTimestamp() {
	if (hasRequiredTimestamp) return timestamp;
	hasRequiredTimestamp = 1;
	const Type2 = requireType();
	const YAML_DATE_REGEXP = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$");
	const YAML_TIMESTAMP_REGEXP = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
	function resolveYamlTimestamp(data) {
		if (data === null) return false;
		if (YAML_DATE_REGEXP.exec(data) !== null) return true;
		if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
		return false;
	}
	function constructYamlTimestamp(data) {
		let fraction = 0;
		let delta = null;
		let match = YAML_DATE_REGEXP.exec(data);
		if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
		if (match === null) throw new Error("Date resolve error");
		const year = +match[1];
		const month = +match[2] - 1;
		const day = +match[3];
		if (!match[4]) return new Date(Date.UTC(year, month, day));
		const hour = +match[4];
		const minute = +match[5];
		const second = +match[6];
		if (match[7]) {
			fraction = match[7].slice(0, 3);
			while (fraction.length < 3) fraction += "0";
			fraction = +fraction;
		}
		if (match[9]) {
			const tzHour = +match[10];
			const tzMinute = +(match[11] || 0);
			delta = (tzHour * 60 + tzMinute) * 6e4;
			if (match[9] === "-") delta = -delta;
		}
		const date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
		if (delta) date.setTime(date.getTime() - delta);
		return date;
	}
	function representYamlTimestamp(object) {
		return object.toISOString();
	}
	timestamp = new Type2("tag:yaml.org,2002:timestamp", {
		kind: "scalar",
		resolve: resolveYamlTimestamp,
		construct: constructYamlTimestamp,
		instanceOf: Date,
		represent: representYamlTimestamp
	});
	return timestamp;
}
var merge;
var hasRequiredMerge;
function requireMerge() {
	if (hasRequiredMerge) return merge;
	hasRequiredMerge = 1;
	const Type2 = requireType();
	function resolveYamlMerge(data) {
		return data === "<<" || data === null;
	}
	merge = new Type2("tag:yaml.org,2002:merge", {
		kind: "scalar",
		resolve: resolveYamlMerge
	});
	return merge;
}
var binary;
var hasRequiredBinary;
function requireBinary() {
	if (hasRequiredBinary) return binary;
	hasRequiredBinary = 1;
	const Type2 = requireType();
	const BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
	function resolveYamlBinary(data) {
		if (data === null) return false;
		let bitlen = 0;
		const max = data.length;
		const map2 = BASE64_MAP;
		for (let idx = 0; idx < max; idx++) {
			const code = map2.indexOf(data.charAt(idx));
			if (code > 64) continue;
			if (code < 0) return false;
			bitlen += 6;
		}
		return bitlen % 8 === 0;
	}
	function constructYamlBinary(data) {
		const input = data.replace(/[\r\n=]/g, "");
		const max = input.length;
		const map2 = BASE64_MAP;
		let bits = 0;
		const result = [];
		for (let idx = 0; idx < max; idx++) {
			if (idx % 4 === 0 && idx) {
				result.push(bits >> 16 & 255);
				result.push(bits >> 8 & 255);
				result.push(bits & 255);
			}
			bits = bits << 6 | map2.indexOf(input.charAt(idx));
		}
		const tailbits = max % 4 * 6;
		if (tailbits === 0) {
			result.push(bits >> 16 & 255);
			result.push(bits >> 8 & 255);
			result.push(bits & 255);
		} else if (tailbits === 18) {
			result.push(bits >> 10 & 255);
			result.push(bits >> 2 & 255);
		} else if (tailbits === 12) result.push(bits >> 4 & 255);
		return new Uint8Array(result);
	}
	function representYamlBinary(object) {
		let result = "";
		let bits = 0;
		const max = object.length;
		const map2 = BASE64_MAP;
		for (let idx = 0; idx < max; idx++) {
			if (idx % 3 === 0 && idx) {
				result += map2[bits >> 18 & 63];
				result += map2[bits >> 12 & 63];
				result += map2[bits >> 6 & 63];
				result += map2[bits & 63];
			}
			bits = (bits << 8) + object[idx];
		}
		const tail = max % 3;
		if (tail === 0) {
			result += map2[bits >> 18 & 63];
			result += map2[bits >> 12 & 63];
			result += map2[bits >> 6 & 63];
			result += map2[bits & 63];
		} else if (tail === 2) {
			result += map2[bits >> 10 & 63];
			result += map2[bits >> 4 & 63];
			result += map2[bits << 2 & 63];
			result += map2[64];
		} else if (tail === 1) {
			result += map2[bits >> 2 & 63];
			result += map2[bits << 4 & 63];
			result += map2[64];
			result += map2[64];
		}
		return result;
	}
	function isBinary(obj) {
		return Object.prototype.toString.call(obj) === "[object Uint8Array]";
	}
	binary = new Type2("tag:yaml.org,2002:binary", {
		kind: "scalar",
		resolve: resolveYamlBinary,
		construct: constructYamlBinary,
		predicate: isBinary,
		represent: representYamlBinary
	});
	return binary;
}
var omap;
var hasRequiredOmap;
function requireOmap() {
	if (hasRequiredOmap) return omap;
	hasRequiredOmap = 1;
	const Type2 = requireType();
	const _hasOwnProperty = Object.prototype.hasOwnProperty;
	const _toString = Object.prototype.toString;
	function resolveYamlOmap(data) {
		if (data === null) return true;
		const objectKeys = {};
		const object = data;
		for (let index = 0, length = object.length; index < length; index += 1) {
			const pair = object[index];
			let pairHasKey = false;
			if (_toString.call(pair) !== "[object Object]") return false;
			let pairKey;
			for (pairKey in pair) if (_hasOwnProperty.call(pair, pairKey)) {
				if (!pairHasKey) pairHasKey = true;
				else return false;
			}
			if (!pairHasKey) return false;
			if (_hasOwnProperty.call(objectKeys, pairKey)) return false;
			Object.defineProperty(objectKeys, pairKey, { value: true });
		}
		return true;
	}
	function constructYamlOmap(data) {
		return data !== null ? data : [];
	}
	omap = new Type2("tag:yaml.org,2002:omap", {
		kind: "sequence",
		resolve: resolveYamlOmap,
		construct: constructYamlOmap
	});
	return omap;
}
var pairs;
var hasRequiredPairs;
function requirePairs() {
	if (hasRequiredPairs) return pairs;
	hasRequiredPairs = 1;
	const Type2 = requireType();
	const _toString = Object.prototype.toString;
	function resolveYamlPairs(data) {
		if (data === null) return true;
		const object = data;
		const result = new Array(object.length);
		for (let index = 0, length = object.length; index < length; index += 1) {
			const pair = object[index];
			if (_toString.call(pair) !== "[object Object]") return false;
			const keys = Object.keys(pair);
			if (keys.length !== 1) return false;
			result[index] = [keys[0], pair[keys[0]]];
		}
		return true;
	}
	function constructYamlPairs(data) {
		if (data === null) return [];
		const object = data;
		const result = new Array(object.length);
		for (let index = 0, length = object.length; index < length; index += 1) {
			const pair = object[index];
			const keys = Object.keys(pair);
			result[index] = [keys[0], pair[keys[0]]];
		}
		return result;
	}
	pairs = new Type2("tag:yaml.org,2002:pairs", {
		kind: "sequence",
		resolve: resolveYamlPairs,
		construct: constructYamlPairs
	});
	return pairs;
}
var set;
var hasRequiredSet;
function requireSet() {
	if (hasRequiredSet) return set;
	hasRequiredSet = 1;
	const Type2 = requireType();
	const _hasOwnProperty = Object.prototype.hasOwnProperty;
	function resolveYamlSet(data) {
		if (data === null) return true;
		const object = data;
		for (const key in object) if (_hasOwnProperty.call(object, key)) {
			if (object[key] !== null) return false;
		}
		return true;
	}
	function constructYamlSet(data) {
		return data !== null ? data : {};
	}
	set = new Type2("tag:yaml.org,2002:set", {
		kind: "mapping",
		resolve: resolveYamlSet,
		construct: constructYamlSet
	});
	return set;
}
var _default;
var hasRequired_default;
function require_default() {
	if (hasRequired_default) return _default;
	hasRequired_default = 1;
	_default = requireCore().extend({
		implicit: [requireTimestamp(), requireMerge()],
		explicit: [
			requireBinary(),
			requireOmap(),
			requirePairs(),
			requireSet()
		]
	});
	return _default;
}
var hasRequiredLoader;
function requireLoader() {
	if (hasRequiredLoader) return loader;
	hasRequiredLoader = 1;
	const common2 = requireCommon();
	const YAMLException2 = requireException();
	const makeSnippet = requireSnippet();
	const DEFAULT_SCHEMA2 = require_default();
	const _hasOwnProperty = Object.prototype.hasOwnProperty;
	const CONTEXT_FLOW_IN = 1;
	const CONTEXT_FLOW_OUT = 2;
	const CONTEXT_BLOCK_IN = 3;
	const CONTEXT_BLOCK_OUT = 4;
	const CHOMPING_CLIP = 1;
	const CHOMPING_STRIP = 2;
	const CHOMPING_KEEP = 3;
	const PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
	const PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
	const PATTERN_FLOW_INDICATORS = /[,\[\]{}]/;
	const PATTERN_TAG_HANDLE = /^(?:!|!!|![0-9A-Za-z-]+!)$/;
	const PATTERN_TAG_URI = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
	function _class(obj) {
		return Object.prototype.toString.call(obj);
	}
	function isEol(c) {
		return c === 10 || c === 13;
	}
	function isWhiteSpace(c) {
		return c === 9 || c === 32;
	}
	function isWsOrEol(c) {
		return c === 9 || c === 32 || c === 10 || c === 13;
	}
	function isFlowIndicator(c) {
		return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
	}
	function fromHexCode(c) {
		if (c >= 48 && c <= 57) return c - 48;
		const lc = c | 32;
		if (lc >= 97 && lc <= 102) return lc - 97 + 10;
		return -1;
	}
	function escapedHexLen(c) {
		if (c === 120) return 2;
		if (c === 117) return 4;
		if (c === 85) return 8;
		return 0;
	}
	function fromDecimalCode(c) {
		if (c >= 48 && c <= 57) return c - 48;
		return -1;
	}
	function simpleEscapeSequence(c) {
		switch (c) {
			case 48: return "\0";
			case 97: return "\x07";
			case 98: return "\b";
			case 116: return "	";
			case 9: return "	";
			case 110: return "\n";
			case 118: return "\v";
			case 102: return "\f";
			case 114: return "\r";
			case 101: return "\x1B";
			case 32: return " ";
			case 34: return "\"";
			case 47: return "/";
			case 92: return "\\";
			case 78: return "";
			case 95: return "\xA0";
			case 76: return "\u2028";
			case 80: return "\u2029";
			default: return "";
		}
	}
	function charFromCodepoint(c) {
		if (c <= 65535) return String.fromCharCode(c);
		return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
	}
	function setProperty(object, key, value) {
		if (key === "__proto__") Object.defineProperty(object, key, {
			configurable: true,
			enumerable: true,
			writable: true,
			value
		});
		else object[key] = value;
	}
	const simpleEscapeCheck = new Array(256);
	const simpleEscapeMap = new Array(256);
	for (let i = 0; i < 256; i++) {
		simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
		simpleEscapeMap[i] = simpleEscapeSequence(i);
	}
	function State(input, options) {
		this.input = input;
		this.filename = options["filename"] || null;
		this.schema = options["schema"] || DEFAULT_SCHEMA2;
		this.onWarning = options["onWarning"] || null;
		this.legacy = options["legacy"] || false;
		this.json = options["json"] || false;
		this.listener = options["listener"] || null;
		this.maxDepth = typeof options["maxDepth"] === "number" ? options["maxDepth"] : 100;
		this.maxTotalMergeKeys = typeof options["maxTotalMergeKeys"] === "number" ? options["maxTotalMergeKeys"] : 1e4;
		this.implicitTypes = this.schema.compiledImplicit;
		this.typeMap = this.schema.compiledTypeMap;
		this.length = input.length;
		this.position = 0;
		this.line = 0;
		this.lineStart = 0;
		this.lineIndent = 0;
		this.depth = 0;
		this.totalMergeKeys = 0;
		this.firstTabInLine = -1;
		this.documents = [];
		this.anchorMapTransactions = [];
	}
	function generateError(state, message) {
		const mark = {
			name: state.filename,
			buffer: state.input.slice(0, -1),
			position: state.position,
			line: state.line,
			column: state.position - state.lineStart
		};
		mark.snippet = makeSnippet(mark);
		return new YAMLException2(message, mark);
	}
	function throwError(state, message) {
		throw generateError(state, message);
	}
	function throwWarning(state, message) {
		if (state.onWarning) state.onWarning.call(null, generateError(state, message));
	}
	function storeAnchor(state, name, value) {
		const transactions = state.anchorMapTransactions;
		if (transactions.length !== 0) {
			const transaction = transactions[transactions.length - 1];
			if (!_hasOwnProperty.call(transaction, name)) transaction[name] = {
				existed: _hasOwnProperty.call(state.anchorMap, name),
				value: state.anchorMap[name]
			};
		}
		state.anchorMap[name] = value;
	}
	function beginAnchorTransaction(state) {
		state.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
	}
	function commitAnchorTransaction(state) {
		const transaction = state.anchorMapTransactions.pop();
		const transactions = state.anchorMapTransactions;
		if (transactions.length === 0) return;
		const parent = transactions[transactions.length - 1];
		const names = Object.keys(transaction);
		for (let index = 0, length = names.length; index < length; index += 1) {
			const name = names[index];
			if (!_hasOwnProperty.call(parent, name)) parent[name] = transaction[name];
		}
	}
	function rollbackAnchorTransaction(state) {
		const transaction = state.anchorMapTransactions.pop();
		const names = Object.keys(transaction);
		for (let index = names.length - 1; index >= 0; index -= 1) {
			const entry = transaction[names[index]];
			if (entry.existed) state.anchorMap[names[index]] = entry.value;
			else delete state.anchorMap[names[index]];
		}
	}
	function snapshotState(state) {
		return {
			position: state.position,
			line: state.line,
			lineStart: state.lineStart,
			lineIndent: state.lineIndent,
			firstTabInLine: state.firstTabInLine,
			tag: state.tag,
			anchor: state.anchor,
			kind: state.kind,
			result: state.result
		};
	}
	function restoreState(state, snapshot) {
		state.position = snapshot.position;
		state.line = snapshot.line;
		state.lineStart = snapshot.lineStart;
		state.lineIndent = snapshot.lineIndent;
		state.firstTabInLine = snapshot.firstTabInLine;
		state.tag = snapshot.tag;
		state.anchor = snapshot.anchor;
		state.kind = snapshot.kind;
		state.result = snapshot.result;
	}
	const directiveHandlers = {
		YAML: function handleYamlDirective(state, name, args) {
			if (state.version !== null) throwError(state, "duplication of %YAML directive");
			if (args.length !== 1) throwError(state, "YAML directive accepts exactly one argument");
			const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
			if (match === null) throwError(state, "ill-formed argument of the YAML directive");
			const major = parseInt(match[1], 10);
			const minor = parseInt(match[2], 10);
			if (major !== 1) throwError(state, "unacceptable YAML version of the document");
			state.version = args[0];
			state.checkLineBreaks = minor < 2;
			if (minor !== 1 && minor !== 2) throwWarning(state, "unsupported YAML version of the document");
		},
		TAG: function handleTagDirective(state, name, args) {
			let prefix;
			if (args.length !== 2) throwError(state, "TAG directive accepts exactly two arguments");
			const handle = args[0];
			prefix = args[1];
			if (!PATTERN_TAG_HANDLE.test(handle)) throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
			if (_hasOwnProperty.call(state.tagMap, handle)) throwError(state, "there is a previously declared suffix for \"" + handle + "\" tag handle");
			if (!PATTERN_TAG_URI.test(prefix)) throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
			try {
				prefix = decodeURIComponent(prefix);
			} catch (err) {
				throwError(state, "tag prefix is malformed: " + prefix);
			}
			state.tagMap[handle] = prefix;
		}
	};
	function captureSegment(state, start, end, checkJson) {
		if (start < end) {
			const _result = state.input.slice(start, end);
			if (checkJson) for (let _position = 0, _length = _result.length; _position < _length; _position += 1) {
				const _character = _result.charCodeAt(_position);
				if (!(_character === 9 || _character >= 32 && _character <= 1114111)) throwError(state, "expected valid JSON character");
			}
			else if (PATTERN_NON_PRINTABLE.test(_result)) throwError(state, "the stream contains non-printable characters");
			state.result += _result;
		}
	}
	function chargeMergeWork(state) {
		state.totalMergeKeys++;
		if (state.maxTotalMergeKeys !== -1 && state.totalMergeKeys > state.maxTotalMergeKeys) throwError(state, "merge keys exceeded maxTotalMergeKeys (" + state.maxTotalMergeKeys + ")");
	}
	function mergeMappings(state, destination, source, overridableKeys) {
		if (!common2.isObject(source)) throwError(state, "cannot merge mappings; the provided source object is unacceptable");
		chargeMergeWork(state);
		const sourceKeys = Object.keys(source);
		for (let index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
			const key = sourceKeys[index];
			chargeMergeWork(state);
			if (!_hasOwnProperty.call(destination, key)) {
				setProperty(destination, key, source[key]);
				overridableKeys[key] = true;
			}
		}
	}
	function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
		if (Array.isArray(keyNode)) {
			keyNode = Array.prototype.slice.call(keyNode);
			for (let index = 0, quantity = keyNode.length; index < quantity; index += 1) {
				if (Array.isArray(keyNode[index])) throwError(state, "nested arrays are not supported inside keys");
				if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") keyNode[index] = "[object Object]";
			}
		}
		if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") keyNode = "[object Object]";
		keyNode = String(keyNode);
		if (_result === null) _result = {};
		if (keyTag === "tag:yaml.org,2002:merge") {
			if (Array.isArray(valueNode)) {
				if (valueNode.length > 100) throwError(state, "abnormal merge sequence size");
				for (let index = 0, quantity = valueNode.length; index < quantity; index += 1) mergeMappings(state, _result, valueNode[index], overridableKeys);
			} else mergeMappings(state, _result, valueNode, overridableKeys);
		} else {
			if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
				state.line = startLine || state.line;
				state.lineStart = startLineStart || state.lineStart;
				state.position = startPos || state.position;
				throwError(state, "duplicated mapping key");
			}
			setProperty(_result, keyNode, valueNode);
			delete overridableKeys[keyNode];
		}
		return _result;
	}
	function readLineBreak(state) {
		const ch = state.input.charCodeAt(state.position);
		if (ch === 10) state.position++;
		else if (ch === 13) {
			state.position++;
			if (state.input.charCodeAt(state.position) === 10) state.position++;
		} else throwError(state, "a line break is expected");
		state.line += 1;
		state.lineStart = state.position;
		state.firstTabInLine = -1;
	}
	function skipSeparationSpace(state, allowComments, checkIndent) {
		let lineBreaks = 0;
		let ch = state.input.charCodeAt(state.position);
		while (ch !== 0) {
			while (isWhiteSpace(ch)) {
				if (ch === 9 && state.firstTabInLine === -1) state.firstTabInLine = state.position;
				ch = state.input.charCodeAt(++state.position);
			}
			if (allowComments && ch === 35) do
				ch = state.input.charCodeAt(++state.position);
			while (ch !== 10 && ch !== 13 && ch !== 0);
			if (isEol(ch)) {
				readLineBreak(state);
				ch = state.input.charCodeAt(state.position);
				lineBreaks++;
				state.lineIndent = 0;
				while (ch === 32) {
					state.lineIndent++;
					ch = state.input.charCodeAt(++state.position);
				}
			} else break;
		}
		if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) throwWarning(state, "deficient indentation");
		return lineBreaks;
	}
	function testDocumentSeparator(state) {
		let _position = state.position;
		let ch = state.input.charCodeAt(_position);
		if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
			_position += 3;
			ch = state.input.charCodeAt(_position);
			if (ch === 0 || isWsOrEol(ch)) return true;
		}
		return false;
	}
	function writeFoldedLines(state, count) {
		if (count === 1) state.result += " ";
		else if (count > 1) state.result += common2.repeat("\n", count - 1);
	}
	function readPlainScalar(state, nodeIndent, withinFlowCollection) {
		let captureStart;
		let captureEnd;
		let hasPendingContent;
		let _line;
		let _lineStart;
		let _lineIndent;
		const _kind = state.kind;
		const _result = state.result;
		let ch = state.input.charCodeAt(state.position);
		if (isWsOrEol(ch) || isFlowIndicator(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) return false;
		if (ch === 63 || ch === 45) {
			const following = state.input.charCodeAt(state.position + 1);
			if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) return false;
		}
		state.kind = "scalar";
		state.result = "";
		captureStart = captureEnd = state.position;
		hasPendingContent = false;
		while (ch !== 0) {
			if (ch === 58) {
				const following = state.input.charCodeAt(state.position + 1);
				if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) break;
			} else if (ch === 35) {
				if (isWsOrEol(state.input.charCodeAt(state.position - 1))) break;
			} else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && isFlowIndicator(ch)) break;
			else if (isEol(ch)) {
				_line = state.line;
				_lineStart = state.lineStart;
				_lineIndent = state.lineIndent;
				skipSeparationSpace(state, false, -1);
				if (state.lineIndent >= nodeIndent) {
					hasPendingContent = true;
					ch = state.input.charCodeAt(state.position);
					continue;
				} else {
					state.position = captureEnd;
					state.line = _line;
					state.lineStart = _lineStart;
					state.lineIndent = _lineIndent;
					break;
				}
			}
			if (hasPendingContent) {
				captureSegment(state, captureStart, captureEnd, false);
				writeFoldedLines(state, state.line - _line);
				captureStart = captureEnd = state.position;
				hasPendingContent = false;
			}
			if (!isWhiteSpace(ch)) captureEnd = state.position + 1;
			ch = state.input.charCodeAt(++state.position);
		}
		captureSegment(state, captureStart, captureEnd, false);
		if (state.result) return true;
		state.kind = _kind;
		state.result = _result;
		return false;
	}
	function readSingleQuotedScalar(state, nodeIndent) {
		let captureStart;
		let captureEnd;
		let ch = state.input.charCodeAt(state.position);
		if (ch !== 39) return false;
		state.kind = "scalar";
		state.result = "";
		state.position++;
		captureStart = captureEnd = state.position;
		while ((ch = state.input.charCodeAt(state.position)) !== 0) if (ch === 39) {
			captureSegment(state, captureStart, state.position, true);
			ch = state.input.charCodeAt(++state.position);
			if (ch === 39) {
				captureStart = state.position;
				state.position++;
				captureEnd = state.position;
			} else return true;
		} else if (isEol(ch)) {
			captureSegment(state, captureStart, captureEnd, true);
			writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
			captureStart = captureEnd = state.position;
		} else if (state.position === state.lineStart && testDocumentSeparator(state)) throwError(state, "unexpected end of the document within a single quoted scalar");
		else {
			state.position++;
			if (!isWhiteSpace(ch)) captureEnd = state.position;
		}
		throwError(state, "unexpected end of the stream within a single quoted scalar");
	}
	function readDoubleQuotedScalar(state, nodeIndent) {
		let captureStart;
		let captureEnd;
		let tmp;
		let ch = state.input.charCodeAt(state.position);
		if (ch !== 34) return false;
		state.kind = "scalar";
		state.result = "";
		state.position++;
		captureStart = captureEnd = state.position;
		while ((ch = state.input.charCodeAt(state.position)) !== 0) if (ch === 34) {
			captureSegment(state, captureStart, state.position, true);
			state.position++;
			return true;
		} else if (ch === 92) {
			captureSegment(state, captureStart, state.position, true);
			ch = state.input.charCodeAt(++state.position);
			if (isEol(ch)) skipSeparationSpace(state, false, nodeIndent);
			else if (ch < 256 && simpleEscapeCheck[ch]) {
				state.result += simpleEscapeMap[ch];
				state.position++;
			} else if ((tmp = escapedHexLen(ch)) > 0) {
				let hexLength = tmp;
				let hexResult = 0;
				for (; hexLength > 0; hexLength--) {
					ch = state.input.charCodeAt(++state.position);
					if ((tmp = fromHexCode(ch)) >= 0) hexResult = (hexResult << 4) + tmp;
					else throwError(state, "expected hexadecimal character");
				}
				state.result += charFromCodepoint(hexResult);
				state.position++;
			} else throwError(state, "unknown escape sequence");
			captureStart = captureEnd = state.position;
		} else if (isEol(ch)) {
			captureSegment(state, captureStart, captureEnd, true);
			writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
			captureStart = captureEnd = state.position;
		} else if (state.position === state.lineStart && testDocumentSeparator(state)) throwError(state, "unexpected end of the document within a double quoted scalar");
		else {
			state.position++;
			if (!isWhiteSpace(ch)) captureEnd = state.position;
		}
		throwError(state, "unexpected end of the stream within a double quoted scalar");
	}
	function readFlowCollection(state, nodeIndent) {
		let readNext = true;
		let _line;
		let _lineStart;
		let _pos;
		const _tag = state.tag;
		let _result;
		const _anchor = state.anchor;
		let terminator;
		let isPair;
		let isExplicitPair;
		let isMapping;
		const overridableKeys = /* @__PURE__ */ Object.create(null);
		let keyNode;
		let keyTag;
		let valueNode;
		let ch = state.input.charCodeAt(state.position);
		if (ch === 91) {
			terminator = 93;
			isMapping = false;
			_result = [];
		} else if (ch === 123) {
			terminator = 125;
			isMapping = true;
			_result = {};
		} else return false;
		if (state.anchor !== null) storeAnchor(state, state.anchor, _result);
		ch = state.input.charCodeAt(++state.position);
		while (ch !== 0) {
			skipSeparationSpace(state, true, nodeIndent);
			ch = state.input.charCodeAt(state.position);
			if (ch === terminator) {
				state.position++;
				state.tag = _tag;
				state.anchor = _anchor;
				state.kind = isMapping ? "mapping" : "sequence";
				state.result = _result;
				return true;
			} else if (!readNext) throwError(state, "missed comma between flow collection entries");
			else if (ch === 44) throwError(state, "expected the node content, but found ','");
			keyTag = keyNode = valueNode = null;
			isPair = isExplicitPair = false;
			if (ch === 63) {
				if (isWsOrEol(state.input.charCodeAt(state.position + 1))) {
					isPair = isExplicitPair = true;
					state.position++;
					skipSeparationSpace(state, true, nodeIndent);
				}
			}
			_line = state.line;
			_lineStart = state.lineStart;
			_pos = state.position;
			composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
			keyTag = state.tag;
			keyNode = state.result;
			skipSeparationSpace(state, true, nodeIndent);
			ch = state.input.charCodeAt(state.position);
			if ((isExplicitPair || state.line === _line) && ch === 58) {
				isPair = true;
				ch = state.input.charCodeAt(++state.position);
				skipSeparationSpace(state, true, nodeIndent);
				composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
				valueNode = state.result;
			}
			if (isMapping) storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
			else if (isPair) _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
			else _result.push(keyNode);
			skipSeparationSpace(state, true, nodeIndent);
			ch = state.input.charCodeAt(state.position);
			if (ch === 44) {
				readNext = true;
				ch = state.input.charCodeAt(++state.position);
			} else readNext = false;
		}
		throwError(state, "unexpected end of the stream within a flow collection");
	}
	function readBlockScalar(state, nodeIndent) {
		let folding;
		let chomping = CHOMPING_CLIP;
		let didReadContent = false;
		let detectedIndent = false;
		let textIndent = nodeIndent;
		let emptyLines = 0;
		let atMoreIndented = false;
		let tmp;
		let ch = state.input.charCodeAt(state.position);
		if (ch === 124) folding = false;
		else if (ch === 62) folding = true;
		else return false;
		state.kind = "scalar";
		state.result = "";
		while (ch !== 0) {
			ch = state.input.charCodeAt(++state.position);
			if (ch === 43 || ch === 45) {
				if (CHOMPING_CLIP === chomping) chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
				else throwError(state, "repeat of a chomping mode identifier");
			} else if ((tmp = fromDecimalCode(ch)) >= 0) {
				if (tmp === 0) throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
				else if (!detectedIndent) {
					textIndent = nodeIndent + tmp - 1;
					detectedIndent = true;
				} else throwError(state, "repeat of an indentation width identifier");
			} else break;
		}
		if (isWhiteSpace(ch)) {
			do
				ch = state.input.charCodeAt(++state.position);
			while (isWhiteSpace(ch));
			if (ch === 35) do
				ch = state.input.charCodeAt(++state.position);
			while (!isEol(ch) && ch !== 0);
		}
		while (ch !== 0) {
			readLineBreak(state);
			state.lineIndent = 0;
			ch = state.input.charCodeAt(state.position);
			while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
				state.lineIndent++;
				ch = state.input.charCodeAt(++state.position);
			}
			if (!detectedIndent && state.lineIndent > textIndent) textIndent = state.lineIndent;
			if (isEol(ch)) {
				emptyLines++;
				continue;
			}
			if (!detectedIndent && textIndent === 0) throwError(state, "missing indentation for block scalar");
			if (state.lineIndent < textIndent) {
				if (chomping === CHOMPING_KEEP) state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
				else if (chomping === CHOMPING_CLIP) {
					if (didReadContent) state.result += "\n";
				}
				break;
			}
			if (folding) {
				if (isWhiteSpace(ch)) {
					atMoreIndented = true;
					state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
				} else if (atMoreIndented) {
					atMoreIndented = false;
					state.result += common2.repeat("\n", emptyLines + 1);
				} else if (emptyLines === 0) {
					if (didReadContent) state.result += " ";
				} else state.result += common2.repeat("\n", emptyLines);
			} else state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
			didReadContent = true;
			detectedIndent = true;
			emptyLines = 0;
			const captureStart = state.position;
			while (!isEol(ch) && ch !== 0) ch = state.input.charCodeAt(++state.position);
			captureSegment(state, captureStart, state.position, false);
		}
		return true;
	}
	function readBlockSequence(state, nodeIndent) {
		const _tag = state.tag;
		const _anchor = state.anchor;
		const _result = [];
		let detected = false;
		if (state.firstTabInLine !== -1) return false;
		if (state.anchor !== null) storeAnchor(state, state.anchor, _result);
		let ch = state.input.charCodeAt(state.position);
		while (ch !== 0) {
			if (state.firstTabInLine !== -1) {
				state.position = state.firstTabInLine;
				throwError(state, "tab characters must not be used in indentation");
			}
			if (ch !== 45) break;
			if (!isWsOrEol(state.input.charCodeAt(state.position + 1))) break;
			detected = true;
			state.position++;
			if (skipSeparationSpace(state, true, -1)) {
				if (state.lineIndent <= nodeIndent) {
					_result.push(null);
					ch = state.input.charCodeAt(state.position);
					continue;
				}
			}
			const _line = state.line;
			composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
			_result.push(state.result);
			skipSeparationSpace(state, true, -1);
			ch = state.input.charCodeAt(state.position);
			if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) throwError(state, "bad indentation of a sequence entry");
			else if (state.lineIndent < nodeIndent) break;
		}
		if (detected) {
			state.tag = _tag;
			state.anchor = _anchor;
			state.kind = "sequence";
			state.result = _result;
			return true;
		}
		return false;
	}
	function readBlockMapping(state, nodeIndent, flowIndent) {
		let allowCompact;
		let _keyLine;
		let _keyLineStart;
		let _keyPos;
		const _tag = state.tag;
		const _anchor = state.anchor;
		const _result = {};
		const overridableKeys = /* @__PURE__ */ Object.create(null);
		let keyTag = null;
		let keyNode = null;
		let valueNode = null;
		let atExplicitKey = false;
		let detected = false;
		if (state.firstTabInLine !== -1) return false;
		if (state.anchor !== null) storeAnchor(state, state.anchor, _result);
		let ch = state.input.charCodeAt(state.position);
		while (ch !== 0) {
			if (!atExplicitKey && state.firstTabInLine !== -1) {
				state.position = state.firstTabInLine;
				throwError(state, "tab characters must not be used in indentation");
			}
			const following = state.input.charCodeAt(state.position + 1);
			const _line = state.line;
			if ((ch === 63 || ch === 58) && isWsOrEol(following)) {
				if (ch === 63) {
					if (atExplicitKey) {
						storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
						keyTag = keyNode = valueNode = null;
					}
					detected = true;
					atExplicitKey = true;
					allowCompact = true;
				} else if (atExplicitKey) {
					atExplicitKey = false;
					allowCompact = true;
				} else throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
				state.position += 1;
				ch = following;
			} else {
				_keyLine = state.line;
				_keyLineStart = state.lineStart;
				_keyPos = state.position;
				if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) break;
				if (state.line === _line) {
					ch = state.input.charCodeAt(state.position);
					while (isWhiteSpace(ch)) ch = state.input.charCodeAt(++state.position);
					if (ch === 58) {
						ch = state.input.charCodeAt(++state.position);
						if (!isWsOrEol(ch)) throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
						if (atExplicitKey) {
							storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
							keyTag = keyNode = valueNode = null;
						}
						detected = true;
						atExplicitKey = false;
						allowCompact = false;
						keyTag = state.tag;
						keyNode = state.result;
					} else if (detected) throwError(state, "can not read an implicit mapping pair; a colon is missed");
					else {
						state.tag = _tag;
						state.anchor = _anchor;
						return true;
					}
				} else if (detected) throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
				else {
					state.tag = _tag;
					state.anchor = _anchor;
					return true;
				}
			}
			if (state.line === _line || state.lineIndent > nodeIndent) {
				if (atExplicitKey) {
					_keyLine = state.line;
					_keyLineStart = state.lineStart;
					_keyPos = state.position;
				}
				if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
					if (atExplicitKey) keyNode = state.result;
					else valueNode = state.result;
				}
				if (!atExplicitKey) {
					storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
					keyTag = keyNode = valueNode = null;
				}
				skipSeparationSpace(state, true, -1);
				ch = state.input.charCodeAt(state.position);
			}
			if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) throwError(state, "bad indentation of a mapping entry");
			else if (state.lineIndent < nodeIndent) break;
		}
		if (atExplicitKey) storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
		if (detected) {
			state.tag = _tag;
			state.anchor = _anchor;
			state.kind = "mapping";
			state.result = _result;
		}
		return detected;
	}
	function readTagProperty(state) {
		let isVerbatim = false;
		let isNamed = false;
		let tagHandle;
		let tagName;
		let ch = state.input.charCodeAt(state.position);
		if (ch !== 33) return false;
		if (state.tag !== null) throwError(state, "duplication of a tag property");
		ch = state.input.charCodeAt(++state.position);
		if (ch === 60) {
			isVerbatim = true;
			ch = state.input.charCodeAt(++state.position);
		} else if (ch === 33) {
			isNamed = true;
			tagHandle = "!!";
			ch = state.input.charCodeAt(++state.position);
		} else tagHandle = "!";
		let _position = state.position;
		if (isVerbatim) {
			do
				ch = state.input.charCodeAt(++state.position);
			while (ch !== 0 && ch !== 62);
			if (state.position < state.length) {
				tagName = state.input.slice(_position, state.position);
				ch = state.input.charCodeAt(++state.position);
			} else throwError(state, "unexpected end of the stream within a verbatim tag");
		} else {
			while (ch !== 0 && !isWsOrEol(ch)) {
				if (ch === 33) {
					if (!isNamed) {
						tagHandle = state.input.slice(_position - 1, state.position + 1);
						if (!PATTERN_TAG_HANDLE.test(tagHandle)) throwError(state, "named tag handle cannot contain such characters");
						isNamed = true;
						_position = state.position + 1;
					} else throwError(state, "tag suffix cannot contain exclamation marks");
				}
				ch = state.input.charCodeAt(++state.position);
			}
			tagName = state.input.slice(_position, state.position);
			if (PATTERN_FLOW_INDICATORS.test(tagName)) throwError(state, "tag suffix cannot contain flow indicator characters");
		}
		if (tagName && !PATTERN_TAG_URI.test(tagName)) throwError(state, "tag name cannot contain such characters: " + tagName);
		try {
			tagName = decodeURIComponent(tagName);
		} catch (err) {
			throwError(state, "tag name is malformed: " + tagName);
		}
		if (isVerbatim) state.tag = tagName;
		else if (_hasOwnProperty.call(state.tagMap, tagHandle)) state.tag = state.tagMap[tagHandle] + tagName;
		else if (tagHandle === "!") state.tag = "!" + tagName;
		else if (tagHandle === "!!") state.tag = "tag:yaml.org,2002:" + tagName;
		else throwError(state, "undeclared tag handle \"" + tagHandle + "\"");
		return true;
	}
	function readAnchorProperty(state) {
		let ch = state.input.charCodeAt(state.position);
		if (ch !== 38) return false;
		if (state.anchor !== null) throwError(state, "duplication of an anchor property");
		ch = state.input.charCodeAt(++state.position);
		const _position = state.position;
		while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) ch = state.input.charCodeAt(++state.position);
		if (state.position === _position) throwError(state, "name of an anchor node must contain at least one character");
		state.anchor = state.input.slice(_position, state.position);
		return true;
	}
	function readAlias(state) {
		let ch = state.input.charCodeAt(state.position);
		if (ch !== 42) return false;
		ch = state.input.charCodeAt(++state.position);
		const _position = state.position;
		while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) ch = state.input.charCodeAt(++state.position);
		if (state.position === _position) throwError(state, "name of an alias node must contain at least one character");
		const alias = state.input.slice(_position, state.position);
		if (!_hasOwnProperty.call(state.anchorMap, alias)) throwError(state, "unidentified alias \"" + alias + "\"");
		state.result = state.anchorMap[alias];
		skipSeparationSpace(state, true, -1);
		return true;
	}
	function tryReadBlockMappingFromProperty(state, propertyStart, nodeIndent, flowIndent) {
		const fallbackState = snapshotState(state);
		beginAnchorTransaction(state);
		restoreState(state, propertyStart);
		state.tag = null;
		state.anchor = null;
		state.kind = null;
		state.result = null;
		if (readBlockMapping(state, nodeIndent, flowIndent) && state.kind === "mapping") {
			commitAnchorTransaction(state);
			return true;
		}
		rollbackAnchorTransaction(state);
		restoreState(state, fallbackState);
		return false;
	}
	function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
		let allowBlockScalars;
		let allowBlockCollections;
		let indentStatus = 1;
		let atNewLine = false;
		let hasContent = false;
		let propertyStart = null;
		let type2;
		let flowIndent;
		let blockIndent;
		if (state.depth >= state.maxDepth) throwError(state, "nesting exceeded maxDepth (" + state.maxDepth + ")");
		state.depth += 1;
		if (state.listener !== null) state.listener("open", state);
		state.tag = null;
		state.anchor = null;
		state.kind = null;
		state.result = null;
		const allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
		if (allowToSeek) {
			if (skipSeparationSpace(state, true, -1)) {
				atNewLine = true;
				if (state.lineIndent > parentIndent) indentStatus = 1;
				else if (state.lineIndent === parentIndent) indentStatus = 0;
				else if (state.lineIndent < parentIndent) indentStatus = -1;
			}
		}
		if (indentStatus === 1) while (true) {
			const ch = state.input.charCodeAt(state.position);
			const propertyState = snapshotState(state);
			if (atNewLine && (ch === 33 && state.tag !== null || ch === 38 && state.anchor !== null)) break;
			if (!readTagProperty(state) && !readAnchorProperty(state)) break;
			if (propertyStart === null) propertyStart = propertyState;
			if (skipSeparationSpace(state, true, -1)) {
				atNewLine = true;
				allowBlockCollections = allowBlockStyles;
				if (state.lineIndent > parentIndent) indentStatus = 1;
				else if (state.lineIndent === parentIndent) indentStatus = 0;
				else if (state.lineIndent < parentIndent) indentStatus = -1;
			} else allowBlockCollections = false;
		}
		if (allowBlockCollections) allowBlockCollections = atNewLine || allowCompact;
		if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
			if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) flowIndent = parentIndent;
			else flowIndent = parentIndent + 1;
			blockIndent = state.position - state.lineStart;
			if (indentStatus === 1) {
				if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) hasContent = true;
				else {
					const ch = state.input.charCodeAt(state.position);
					if (propertyStart !== null && allowBlockStyles && !allowBlockCollections && ch !== 124 && ch !== 62 && tryReadBlockMappingFromProperty(state, propertyStart, propertyStart.position - propertyStart.lineStart, flowIndent)) hasContent = true;
					else if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) hasContent = true;
					else if (readAlias(state)) {
						hasContent = true;
						if (state.tag !== null || state.anchor !== null) throwError(state, "alias node should not have any properties");
					} else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
						hasContent = true;
						if (state.tag === null) state.tag = "?";
					}
					if (state.anchor !== null) storeAnchor(state, state.anchor, state.result);
				}
			} else if (indentStatus === 0) hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
		}
		if (state.tag === null) {
			if (state.anchor !== null) storeAnchor(state, state.anchor, state.result);
		} else if (state.tag === "?") {
			if (state.result !== null && state.kind !== "scalar") throwError(state, "unacceptable node kind for !<?> tag; it should be \"scalar\", not \"" + state.kind + "\"");
			for (let typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
				type2 = state.implicitTypes[typeIndex];
				if (type2.resolve(state.result)) {
					state.result = type2.construct(state.result);
					state.tag = type2.tag;
					if (state.anchor !== null) storeAnchor(state, state.anchor, state.result);
					break;
				}
			}
		} else if (state.tag !== "!") {
			if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)) type2 = state.typeMap[state.kind || "fallback"][state.tag];
			else {
				type2 = null;
				const typeList = state.typeMap.multi[state.kind || "fallback"];
				for (let typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
					type2 = typeList[typeIndex];
					break;
				}
			}
			if (!type2) throwError(state, "unknown tag !<" + state.tag + ">");
			if (state.result !== null && type2.kind !== state.kind) throwError(state, "unacceptable node kind for !<" + state.tag + "> tag; it should be \"" + type2.kind + "\", not \"" + state.kind + "\"");
			if (!type2.resolve(state.result, state.tag)) throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
			else {
				state.result = type2.construct(state.result, state.tag);
				if (state.anchor !== null) storeAnchor(state, state.anchor, state.result);
			}
		}
		if (state.listener !== null) state.listener("close", state);
		state.depth -= 1;
		return state.tag !== null || state.anchor !== null || hasContent;
	}
	function readDocument(state) {
		const documentStart = state.position;
		let hasDirectives = false;
		let ch;
		state.version = null;
		state.checkLineBreaks = state.legacy;
		state.tagMap = /* @__PURE__ */ Object.create(null);
		state.anchorMap = /* @__PURE__ */ Object.create(null);
		while ((ch = state.input.charCodeAt(state.position)) !== 0) {
			skipSeparationSpace(state, true, -1);
			ch = state.input.charCodeAt(state.position);
			if (state.lineIndent > 0 || ch !== 37) break;
			hasDirectives = true;
			ch = state.input.charCodeAt(++state.position);
			let _position = state.position;
			while (ch !== 0 && !isWsOrEol(ch)) ch = state.input.charCodeAt(++state.position);
			const directiveName = state.input.slice(_position, state.position);
			const directiveArgs = [];
			if (directiveName.length < 1) throwError(state, "directive name must not be less than one character in length");
			while (ch !== 0) {
				while (isWhiteSpace(ch)) ch = state.input.charCodeAt(++state.position);
				if (ch === 35) {
					do
						ch = state.input.charCodeAt(++state.position);
					while (ch !== 0 && !isEol(ch));
					break;
				}
				if (isEol(ch)) break;
				_position = state.position;
				while (ch !== 0 && !isWsOrEol(ch)) ch = state.input.charCodeAt(++state.position);
				directiveArgs.push(state.input.slice(_position, state.position));
			}
			if (ch !== 0) readLineBreak(state);
			if (_hasOwnProperty.call(directiveHandlers, directiveName)) directiveHandlers[directiveName](state, directiveName, directiveArgs);
			else throwWarning(state, "unknown document directive \"" + directiveName + "\"");
		}
		skipSeparationSpace(state, true, -1);
		if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
			state.position += 3;
			skipSeparationSpace(state, true, -1);
		} else if (hasDirectives) throwError(state, "directives end mark is expected");
		composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
		skipSeparationSpace(state, true, -1);
		if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) throwWarning(state, "non-ASCII line breaks are interpreted as content");
		state.documents.push(state.result);
		if (state.position === state.lineStart && testDocumentSeparator(state)) {
			if (state.input.charCodeAt(state.position) === 46) {
				state.position += 3;
				skipSeparationSpace(state, true, -1);
			}
			return;
		}
		if (state.position < state.length - 1) throwError(state, "end of the stream or a document separator is expected");
	}
	function loadDocuments(input, options) {
		input = String(input);
		options = options || {};
		if (input.length !== 0) {
			if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) input += "\n";
			if (input.charCodeAt(0) === 65279) input = input.slice(1);
		}
		const state = new State(input, options);
		const nullpos = input.indexOf("\0");
		if (nullpos !== -1) {
			state.position = nullpos;
			throwError(state, "null byte is not allowed in input");
		}
		state.input += "\0";
		while (state.input.charCodeAt(state.position) === 32) {
			state.lineIndent += 1;
			state.position += 1;
		}
		while (state.position < state.length - 1) readDocument(state);
		return state.documents;
	}
	function loadAll2(input, iterator, options) {
		if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
			options = iterator;
			iterator = null;
		}
		const documents = loadDocuments(input, options);
		if (typeof iterator !== "function") return documents;
		for (let index = 0, length = documents.length; index < length; index += 1) iterator(documents[index]);
	}
	function load2(input, options) {
		const documents = loadDocuments(input, options);
		if (documents.length === 0) return;
		else if (documents.length === 1) return documents[0];
		throw new YAMLException2("expected a single document in the stream, but found more");
	}
	loader.loadAll = loadAll2;
	loader.load = load2;
	return loader;
}
var dumper = {};
var hasRequiredDumper;
function requireDumper() {
	if (hasRequiredDumper) return dumper;
	hasRequiredDumper = 1;
	const common2 = requireCommon();
	const YAMLException2 = requireException();
	const DEFAULT_SCHEMA2 = require_default();
	const _toString = Object.prototype.toString;
	const _hasOwnProperty = Object.prototype.hasOwnProperty;
	const CHAR_BOM = 65279;
	const CHAR_TAB = 9;
	const CHAR_LINE_FEED = 10;
	const CHAR_CARRIAGE_RETURN = 13;
	const CHAR_SPACE = 32;
	const CHAR_EXCLAMATION = 33;
	const CHAR_DOUBLE_QUOTE = 34;
	const CHAR_SHARP = 35;
	const CHAR_PERCENT = 37;
	const CHAR_AMPERSAND = 38;
	const CHAR_SINGLE_QUOTE = 39;
	const CHAR_ASTERISK = 42;
	const CHAR_COMMA = 44;
	const CHAR_MINUS = 45;
	const CHAR_COLON = 58;
	const CHAR_EQUALS = 61;
	const CHAR_GREATER_THAN = 62;
	const CHAR_QUESTION = 63;
	const CHAR_COMMERCIAL_AT = 64;
	const CHAR_LEFT_SQUARE_BRACKET = 91;
	const CHAR_RIGHT_SQUARE_BRACKET = 93;
	const CHAR_GRAVE_ACCENT = 96;
	const CHAR_LEFT_CURLY_BRACKET = 123;
	const CHAR_VERTICAL_LINE = 124;
	const CHAR_RIGHT_CURLY_BRACKET = 125;
	const ESCAPE_SEQUENCES = {};
	ESCAPE_SEQUENCES[0] = "\\0";
	ESCAPE_SEQUENCES[7] = "\\a";
	ESCAPE_SEQUENCES[8] = "\\b";
	ESCAPE_SEQUENCES[9] = "\\t";
	ESCAPE_SEQUENCES[10] = "\\n";
	ESCAPE_SEQUENCES[11] = "\\v";
	ESCAPE_SEQUENCES[12] = "\\f";
	ESCAPE_SEQUENCES[13] = "\\r";
	ESCAPE_SEQUENCES[27] = "\\e";
	ESCAPE_SEQUENCES[34] = "\\\"";
	ESCAPE_SEQUENCES[92] = "\\\\";
	ESCAPE_SEQUENCES[133] = "\\N";
	ESCAPE_SEQUENCES[160] = "\\_";
	ESCAPE_SEQUENCES[8232] = "\\L";
	ESCAPE_SEQUENCES[8233] = "\\P";
	const DEPRECATED_BOOLEANS_SYNTAX = [
		"y",
		"Y",
		"yes",
		"Yes",
		"YES",
		"on",
		"On",
		"ON",
		"n",
		"N",
		"no",
		"No",
		"NO",
		"off",
		"Off",
		"OFF"
	];
	const DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
	function compileStyleMap(schema2, map2) {
		if (map2 === null) return {};
		const result = {};
		const keys = Object.keys(map2);
		for (let index = 0, length = keys.length; index < length; index += 1) {
			let tag = keys[index];
			let style = String(map2[tag]);
			if (tag.slice(0, 2) === "!!") tag = "tag:yaml.org,2002:" + tag.slice(2);
			const type2 = schema2.compiledTypeMap["fallback"][tag];
			if (type2 && _hasOwnProperty.call(type2.styleAliases, style)) style = type2.styleAliases[style];
			result[tag] = style;
		}
		return result;
	}
	function encodeHex(character) {
		let handle;
		let length;
		const string = character.toString(16).toUpperCase();
		if (character <= 255) {
			handle = "x";
			length = 2;
		} else if (character <= 65535) {
			handle = "u";
			length = 4;
		} else if (character <= 4294967295) {
			handle = "U";
			length = 8;
		} else throw new YAMLException2("code point within a string may not be greater than 0xFFFFFFFF");
		return "\\" + handle + common2.repeat("0", length - string.length) + string;
	}
	const QUOTING_TYPE_SINGLE = 1;
	const QUOTING_TYPE_DOUBLE = 2;
	function State(options) {
		this.schema = options["schema"] || DEFAULT_SCHEMA2;
		this.indent = Math.max(1, options["indent"] || 2);
		this.noArrayIndent = options["noArrayIndent"] || false;
		this.skipInvalid = options["skipInvalid"] || false;
		this.flowLevel = common2.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
		this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
		this.sortKeys = options["sortKeys"] || false;
		this.lineWidth = options["lineWidth"] || 80;
		this.noRefs = options["noRefs"] || false;
		this.noCompatMode = options["noCompatMode"] || false;
		this.condenseFlow = options["condenseFlow"] || false;
		this.quotingType = options["quotingType"] === "\"" ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
		this.forceQuotes = options["forceQuotes"] || false;
		this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
		this.implicitTypes = this.schema.compiledImplicit;
		this.explicitTypes = this.schema.compiledExplicit;
		this.tag = null;
		this.result = "";
		this.duplicates = [];
		this.usedDuplicates = null;
	}
	function indentString(string, spaces) {
		const ind = common2.repeat(" ", spaces);
		let position = 0;
		let result = "";
		const length = string.length;
		while (position < length) {
			let line;
			const next = string.indexOf("\n", position);
			if (next === -1) {
				line = string.slice(position);
				position = length;
			} else {
				line = string.slice(position, next + 1);
				position = next + 1;
			}
			if (line.length && line !== "\n") result += ind;
			result += line;
		}
		return result;
	}
	function generateNextLine(state, level) {
		return "\n" + common2.repeat(" ", state.indent * level);
	}
	function testImplicitResolving(state, str2) {
		for (let index = 0, length = state.implicitTypes.length; index < length; index += 1) if (state.implicitTypes[index].resolve(str2)) return true;
		return false;
	}
	function isWhitespace(c) {
		return c === CHAR_SPACE || c === CHAR_TAB;
	}
	function isPrintable(c) {
		return c >= 32 && c <= 126 || c >= 161 && c <= 55295 && c !== 8232 && c !== 8233 || c >= 57344 && c <= 65533 && c !== CHAR_BOM || c >= 65536 && c <= 1114111;
	}
	function isNsCharOrWhitespace(c) {
		return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
	}
	function isPlainSafe(c, prev, inblock) {
		const cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
		const cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
		return (inblock ? cIsNsCharOrWhitespace : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar;
	}
	function isPlainSafeFirst(c) {
		return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
	}
	function isPlainSafeLast(c) {
		return !isWhitespace(c) && c !== CHAR_COLON;
	}
	function codePointAt(string, pos) {
		const first = string.charCodeAt(pos);
		let second;
		if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
			second = string.charCodeAt(pos + 1);
			if (second >= 56320 && second <= 57343) return (first - 55296) * 1024 + second - 56320 + 65536;
		}
		return first;
	}
	function needIndentIndicator(string) {
		return /^\n* /.test(string);
	}
	const STYLE_PLAIN = 1;
	const STYLE_SINGLE = 2;
	const STYLE_LITERAL = 3;
	const STYLE_FOLDED = 4;
	const STYLE_DOUBLE = 5;
	function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
		let i;
		let char = 0;
		let prevChar = null;
		let hasLineBreak = false;
		let hasFoldableLine = false;
		const shouldTrackWidth = lineWidth !== -1;
		let previousLineBreak = -1;
		let plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
		if (singleLineOnly || forceQuotes) for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
			char = codePointAt(string, i);
			if (!isPrintable(char)) return STYLE_DOUBLE;
			plain = plain && isPlainSafe(char, prevChar, inblock);
			prevChar = char;
		}
		else {
			for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
				char = codePointAt(string, i);
				if (char === CHAR_LINE_FEED) {
					hasLineBreak = true;
					if (shouldTrackWidth) {
						hasFoldableLine = hasFoldableLine || i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
						previousLineBreak = i;
					}
				} else if (!isPrintable(char)) return STYLE_DOUBLE;
				plain = plain && isPlainSafe(char, prevChar, inblock);
				prevChar = char;
			}
			hasFoldableLine = hasFoldableLine || shouldTrackWidth && i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
		}
		if (!hasLineBreak && !hasFoldableLine) {
			if (plain && !forceQuotes && !testAmbiguousType(string)) return STYLE_PLAIN;
			return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
		}
		if (indentPerLevel > 9 && needIndentIndicator(string)) return STYLE_DOUBLE;
		if (!forceQuotes) return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
		return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
	}
	function writeScalar(state, string, level, iskey, inblock) {
		state.dump = (function() {
			if (string.length === 0) return state.quotingType === QUOTING_TYPE_DOUBLE ? "\"\"" : "''";
			if (!state.noCompatMode) {
				if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) return state.quotingType === QUOTING_TYPE_DOUBLE ? "\"" + string + "\"" : "'" + string + "'";
			}
			const indent = state.indent * Math.max(1, level);
			const lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
			const singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
			function testAmbiguity(string2) {
				return testImplicitResolving(state, string2);
			}
			switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity, state.quotingType, state.forceQuotes && !iskey, inblock)) {
				case STYLE_PLAIN: return string;
				case STYLE_SINGLE: return "'" + string.replace(/'/g, "''") + "'";
				case STYLE_LITERAL: return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
				case STYLE_FOLDED: return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
				case STYLE_DOUBLE: return "\"" + escapeString(string) + "\"";
				default: throw new YAMLException2("impossible error: invalid scalar style");
			}
		})();
	}
	function blockHeader(string, indentPerLevel) {
		const indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
		const clip = string[string.length - 1] === "\n";
		return indentIndicator + (clip && (string[string.length - 2] === "\n" || string === "\n") ? "+" : clip ? "" : "-") + "\n";
	}
	function dropEndingNewline(string) {
		return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
	}
	function foldString(string, width) {
		const lineRe = /(\n+)([^\n]*)/g;
		let result = (function() {
			let nextLF = string.indexOf("\n");
			nextLF = nextLF !== -1 ? nextLF : string.length;
			lineRe.lastIndex = nextLF;
			return foldLine(string.slice(0, nextLF), width);
		})();
		let prevMoreIndented = string[0] === "\n" || string[0] === " ";
		let moreIndented;
		let match;
		while (match = lineRe.exec(string)) {
			const prefix = match[1];
			const line = match[2];
			moreIndented = line[0] === " ";
			result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
			prevMoreIndented = moreIndented;
		}
		return result;
	}
	function foldLine(line, width) {
		if (line === "" || line[0] === " ") return line;
		const breakRe = / [^ ]/g;
		let match;
		let start = 0;
		let end;
		let curr = 0;
		let next = 0;
		let result = "";
		while (match = breakRe.exec(line)) {
			next = match.index;
			if (next - start > width) {
				end = curr > start ? curr : next;
				result += "\n" + line.slice(start, end);
				start = end + 1;
			}
			curr = next;
		}
		result += "\n";
		if (line.length - start > width && curr > start) result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
		else result += line.slice(start);
		return result.slice(1);
	}
	function escapeString(string) {
		let result = "";
		let char = 0;
		for (let i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
			char = codePointAt(string, i);
			const escapeSeq = ESCAPE_SEQUENCES[char];
			if (!escapeSeq && isPrintable(char)) {
				result += string[i];
				if (char >= 65536) result += string[i + 1];
			} else result += escapeSeq || encodeHex(char);
		}
		return result;
	}
	function writeFlowSequence(state, level, object) {
		let _result = "";
		const _tag = state.tag;
		for (let index = 0, length = object.length; index < length; index += 1) {
			let value = object[index];
			if (state.replacer) value = state.replacer.call(object, String(index), value);
			if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
				if (_result !== "") _result += "," + (!state.condenseFlow ? " " : "");
				_result += state.dump;
			}
		}
		state.tag = _tag;
		state.dump = "[" + _result + "]";
	}
	function writeBlockSequence(state, level, object, compact) {
		let _result = "";
		const _tag = state.tag;
		for (let index = 0, length = object.length; index < length; index += 1) {
			let value = object[index];
			if (state.replacer) value = state.replacer.call(object, String(index), value);
			if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
				if (!compact || _result !== "") _result += generateNextLine(state, level);
				if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) _result += "-";
				else _result += "- ";
				_result += state.dump;
			}
		}
		state.tag = _tag;
		state.dump = _result || "[]";
	}
	function writeFlowMapping(state, level, object) {
		let _result = "";
		const _tag = state.tag;
		const objectKeyList = Object.keys(object);
		for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
			let pairBuffer = "";
			if (_result !== "") pairBuffer += ", ";
			if (state.condenseFlow) pairBuffer += "\"";
			const objectKey = objectKeyList[index];
			let objectValue = object[objectKey];
			if (state.replacer) objectValue = state.replacer.call(object, objectKey, objectValue);
			if (!writeNode(state, level, objectKey, false, false)) continue;
			if (state.dump.length > 1024) pairBuffer += "? ";
			pairBuffer += state.dump + (state.condenseFlow ? "\"" : "") + ":" + (state.condenseFlow ? "" : " ");
			if (!writeNode(state, level, objectValue, false, false)) continue;
			pairBuffer += state.dump;
			_result += pairBuffer;
		}
		state.tag = _tag;
		state.dump = "{" + _result + "}";
	}
	function writeBlockMapping(state, level, object, compact) {
		let _result = "";
		const _tag = state.tag;
		const objectKeyList = Object.keys(object);
		if (state.sortKeys === true) objectKeyList.sort();
		else if (typeof state.sortKeys === "function") objectKeyList.sort(state.sortKeys);
		else if (state.sortKeys) throw new YAMLException2("sortKeys must be a boolean or a function");
		for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
			let pairBuffer = "";
			if (!compact || _result !== "") pairBuffer += generateNextLine(state, level);
			const objectKey = objectKeyList[index];
			let objectValue = object[objectKey];
			if (state.replacer) objectValue = state.replacer.call(object, objectKey, objectValue);
			if (!writeNode(state, level + 1, objectKey, true, true, true)) continue;
			const explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
			if (explicitPair) {
				if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) pairBuffer += "?";
				else pairBuffer += "? ";
			}
			pairBuffer += state.dump;
			if (explicitPair) pairBuffer += generateNextLine(state, level);
			if (!writeNode(state, level + 1, objectValue, true, explicitPair)) continue;
			if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) pairBuffer += ":";
			else pairBuffer += ": ";
			pairBuffer += state.dump;
			_result += pairBuffer;
		}
		state.tag = _tag;
		state.dump = _result || "{}";
	}
	function detectType(state, object, explicit) {
		const typeList = explicit ? state.explicitTypes : state.implicitTypes;
		for (let index = 0, length = typeList.length; index < length; index += 1) {
			const type2 = typeList[index];
			if ((type2.instanceOf || type2.predicate) && (!type2.instanceOf || typeof object === "object" && object instanceof type2.instanceOf) && (!type2.predicate || type2.predicate(object))) {
				if (explicit) {
					if (type2.multi && type2.representName) state.tag = type2.representName(object);
					else state.tag = type2.tag;
				} else state.tag = "?";
				if (type2.represent) {
					const style = state.styleMap[type2.tag] || type2.defaultStyle;
					let _result;
					if (_toString.call(type2.represent) === "[object Function]") _result = type2.represent(object, style);
					else if (_hasOwnProperty.call(type2.represent, style)) _result = type2.represent[style](object, style);
					else throw new YAMLException2("!<" + type2.tag + "> tag resolver accepts not \"" + style + "\" style");
					state.dump = _result;
				}
				return true;
			}
		}
		return false;
	}
	function writeNode(state, level, object, block, compact, iskey, isblockseq) {
		state.tag = null;
		state.dump = object;
		if (!detectType(state, object, false)) detectType(state, object, true);
		const type2 = _toString.call(state.dump);
		const inblock = block;
		if (block) block = state.flowLevel < 0 || state.flowLevel > level;
		const objectOrArray = type2 === "[object Object]" || type2 === "[object Array]";
		let duplicateIndex;
		let duplicate;
		if (objectOrArray) {
			duplicateIndex = state.duplicates.indexOf(object);
			duplicate = duplicateIndex !== -1;
		}
		if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) compact = false;
		if (duplicate && state.usedDuplicates[duplicateIndex]) state.dump = "*ref_" + duplicateIndex;
		else {
			if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) state.usedDuplicates[duplicateIndex] = true;
			if (type2 === "[object Object]") {
				if (block && Object.keys(state.dump).length !== 0) {
					writeBlockMapping(state, level, state.dump, compact);
					if (duplicate) state.dump = "&ref_" + duplicateIndex + state.dump;
				} else {
					writeFlowMapping(state, level, state.dump);
					if (duplicate) state.dump = "&ref_" + duplicateIndex + " " + state.dump;
				}
			} else if (type2 === "[object Array]") {
				if (block && state.dump.length !== 0) {
					if (state.noArrayIndent && !isblockseq && level > 0) writeBlockSequence(state, level - 1, state.dump, compact);
					else writeBlockSequence(state, level, state.dump, compact);
					if (duplicate) state.dump = "&ref_" + duplicateIndex + state.dump;
				} else {
					writeFlowSequence(state, level, state.dump);
					if (duplicate) state.dump = "&ref_" + duplicateIndex + " " + state.dump;
				}
			} else if (type2 === "[object String]") {
				if (state.tag !== "?") writeScalar(state, state.dump, level, iskey, inblock);
			} else if (type2 === "[object Undefined]") return false;
			else {
				if (state.skipInvalid) return false;
				throw new YAMLException2("unacceptable kind of an object to dump " + type2);
			}
			if (state.tag !== null && state.tag !== "?") {
				let tagStr = encodeURI(state.tag[0] === "!" ? state.tag.slice(1) : state.tag).replace(/!/g, "%21");
				if (state.tag[0] === "!") tagStr = "!" + tagStr;
				else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") tagStr = "!!" + tagStr.slice(18);
				else tagStr = "!<" + tagStr + ">";
				state.dump = tagStr + " " + state.dump;
			}
		}
		return true;
	}
	function getDuplicateReferences(object, state) {
		const objects = [];
		const duplicatesIndexes = [];
		inspectNode(object, objects, duplicatesIndexes);
		const length = duplicatesIndexes.length;
		for (let index = 0; index < length; index += 1) state.duplicates.push(objects[duplicatesIndexes[index]]);
		state.usedDuplicates = new Array(length);
	}
	function inspectNode(object, objects, duplicatesIndexes) {
		if (object !== null && typeof object === "object") {
			const index = objects.indexOf(object);
			if (index !== -1) {
				if (duplicatesIndexes.indexOf(index) === -1) duplicatesIndexes.push(index);
			} else {
				objects.push(object);
				if (Array.isArray(object)) for (let i = 0, length = object.length; i < length; i += 1) inspectNode(object[i], objects, duplicatesIndexes);
				else {
					const objectKeyList = Object.keys(object);
					for (let i = 0, length = objectKeyList.length; i < length; i += 1) inspectNode(object[objectKeyList[i]], objects, duplicatesIndexes);
				}
			}
		}
	}
	function dump2(input, options) {
		options = options || {};
		const state = new State(options);
		if (!state.noRefs) getDuplicateReferences(input, state);
		let value = input;
		if (state.replacer) value = state.replacer.call({ "": value }, "", value);
		if (writeNode(state, 0, value, true, true)) return state.dump + "\n";
		return "";
	}
	dumper.dump = dump2;
	return dumper;
}
var hasRequiredJsYaml;
function requireJsYaml() {
	if (hasRequiredJsYaml) return jsYaml;
	hasRequiredJsYaml = 1;
	const loader2 = requireLoader();
	const dumper2 = requireDumper();
	function renamed(from, to) {
		return function() {
			throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
		};
	}
	jsYaml.Type = requireType();
	jsYaml.Schema = requireSchema();
	jsYaml.FAILSAFE_SCHEMA = requireFailsafe();
	jsYaml.JSON_SCHEMA = requireJson();
	jsYaml.CORE_SCHEMA = requireCore();
	jsYaml.DEFAULT_SCHEMA = require_default();
	jsYaml.load = loader2.load;
	jsYaml.loadAll = loader2.loadAll;
	jsYaml.dump = dumper2.dump;
	jsYaml.YAMLException = requireException();
	jsYaml.types = {
		binary: requireBinary(),
		float: requireFloat(),
		map: requireMap(),
		null: require_null(),
		pairs: requirePairs(),
		set: requireSet(),
		timestamp: requireTimestamp(),
		bool: requireBool(),
		int: requireInt(),
		merge: requireMerge(),
		omap: requireOmap(),
		seq: requireSeq(),
		str: requireStr()
	};
	jsYaml.safeLoad = renamed("safeLoad", "load");
	jsYaml.safeLoadAll = renamed("safeLoadAll", "loadAll");
	jsYaml.safeDump = renamed("safeDump", "dump");
	return jsYaml;
}
const yaml = /* @__PURE__ */ getDefaultExportFromCjs(requireJsYaml());
const { Type, Schema, FAILSAFE_SCHEMA, JSON_SCHEMA, CORE_SCHEMA, DEFAULT_SCHEMA, load, loadAll, dump, YAMLException, types, safeLoad, safeLoadAll, safeDump } = yaml;
//#endregion
//#region src/settings-store.js
/**
* Plugin-owned settings store — the single source of truth for this plugin's
* user configuration on every host line.
*
* WHY THIS EXISTS
*
* DSH 0.1.7 persists a settings write through the profile patch
* (`configEditor.edit` → cordis.patch.yml), and every such write reconciles the
* whole loader tree and hot-reloads the plugin's fiber (~1–1.5 s, plus a storm
* of client mirror refreshes). The plugin's own files — the credential, the
* catalog cache — have always lived in `<profile>/.dsh-session-prompt/`, so the
* settings move there too: a write becomes a small atomic local file write with
* an in-memory apply, no tree reconcile, no reload.
*
* FILE
*   <profile>/.dsh-session-prompt/settings.json
*
* The profile directory is discovered the same way the credential store's is:
* `$DSH_HOME/profiles/*`, keeping the one whose package.json declares this
* plugin (and, when several do, the one whose node_modules link resolves to
* this package). `DSH_SESSION_PROMPT_DATA_DIR` overrides the whole directory —
* the tests and a relocated profile use it.
*
* MIGRATION (one time, on the first boot after upgrading)
*   the file is absent → seed it from the composition entry config (the values
*   the profile patch carried) → write the file → delete ONLY this plugin's own
*   keys from the entry config (see ./index.js), so the profile row returns to
*   its shipped state and no second source of truth remains.
*
* @module dsh-session-head-prompt/settings-store
*/
/** Package name, used to find the declaring profile. */
const PACKAGE_NAME = "dsh-session-prompt";
/** Data-directory name inside the profile (same directory as the credential). */
const DATA_DIR_NAME = ".dsh-session-prompt";
/** Settings file name inside the data directory. */
const SETTINGS_FILE_NAME = "settings.json";
/** Environment override for the whole data directory (tests, relocated profiles). */
const DATA_DIR_ENV = "DSH_SESSION_PROMPT_DATA_DIR";
/**
* Resolve `$DSH_HOME` the way the Host does, without importing the Host's
* path helper (a client bundle must not depend on a Host package, and this
* module runs inside the host process where that helper is not exported to
* plugins either).
* @returns {string} the Harness home directory.
*/
function dshHome() {
	const fromEnv = process.env.DSH_HOME?.trim();
	if (fromEnv) return fromEnv;
	return join(homedir(), ".dsh");
}
/**
* This package's own root (the checkout, or the profile's node_modules copy).
* @returns {string} absolute path.
*/
function packageRoot() {
	return dirname(fileURLToPath(import.meta.url)).replace(/[\\/]lib$/, "");
}
/** Read a directory's package.json dependencies, tolerating absence. */
function declaredBy(dir, packageName) {
	try {
		const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
		return typeof {
			...manifest.dependencies,
			...manifest.devDependencies
		}[packageName] === "string";
	} catch {
		return false;
	}
}
/**
* The profile that owns this plugin's data: the single profile under
* `$DSH_HOME/profiles` declaring this package, or — when several do — the one
* whose installed copy resolves to this package.
* @returns {string | undefined} the profile directory, or undefined when none
*   declares this plugin (a bare checkout run: the caller then uses the env
*   override or falls back to the Home itself).
*/
function discoverProfileDir() {
	const override = process.env[DATA_DIR_ENV]?.trim();
	if (override) return override;
	const root = join(dshHome(), "profiles");
	let entries;
	try {
		entries = readdirSync(root, { withFileTypes: true });
	} catch {
		return;
	}
	const candidates = entries.filter((entry) => entry.isDirectory() || entry.isSymbolicLink()).map((entry) => join(root, entry.name)).filter((dir) => declaredBy(dir, PACKAGE_NAME));
	if (candidates.length === 0) return void 0;
	if (candidates.length === 1) return candidates[0];
	const own = packageRoot();
	return candidates.find((dir) => {
		try {
			return realpathSync(join(dir, "node_modules", PACKAGE_NAME)) === realpathSync(own);
		} catch {
			return false;
		}
	}) ?? candidates[0];
}
/** This plugin's data directory, created on demand. @returns {string} absolute path. */
function dataDir() {
	const profile = discoverProfileDir() ?? dshHome();
	return join(profile, DATA_DIR_NAME);
}
/** Absolute path of the settings file. @returns {string} */
function settingsFilePath() {
	return join(dataDir(), SETTINGS_FILE_NAME);
}
/** Read + parse the settings file; `undefined` when absent or unreadable. */
function readFile() {
	const path = settingsFilePath();
	if (!existsSync(path)) return void 0;
	try {
		const parsed = JSON.parse(readFileSync(path, "utf8"));
		return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : void 0;
	} catch {
		return;
	}
}
/**
* Write the settings file atomically (tmp + rename), creating the directory.
* @param {object} values - the whole user layer (keys this plugin owns).
* @returns {void}
*/
function writeSettings(values) {
	const path = settingsFilePath();
	mkdirSync(dirname(path), { recursive: true });
	const tmp = `${path}.tmp`;
	writeFileSync(tmp, `${JSON.stringify(values, null, 2)}\n`, "utf8");
	renameSync(tmp, path);
}
const loadYaml = typeof yaml?.load === "function" ? yaml.load : yaml?.default?.load;
/** The legacy document to read: the live 0.1.5 file first, else the renamed one. */
function legacySettingsPath() {
	const home = dshHome();
	for (const name of ["settings.yaml", "settings.yaml.imported"]) {
		const path = join(home, name);
		if (existsSync(path)) return path;
	}
}
/**
* Read this plugin's sections out of the legacy settings document.
* @param {readonly string[]} namespaces - the section names the 0.1.5 host
*   keyed this plugin's settings under (more than one when the plugin had
*   several served sections).
* @returns {object | undefined} the union of those sections' fields, or
*   undefined when the document is absent, unreadable, or holds none of them.
*/
function readLegacySections(namespaces) {
	const path = legacySettingsPath();
	if (path === void 0) return void 0;
	let document;
	try {
		document = loadYaml(readFileSync(path, "utf8"));
	} catch (error) {
		return;
	}
	if (document === null || typeof document !== "object") return void 0;
	const merged = {};
	let found = false;
	for (const ns of namespaces) {
		const section = document[ns];
		if (section === null || typeof section !== "object" || Array.isArray(section)) continue;
		Object.assign(merged, section);
		found = true;
	}
	return found ? merged : void 0;
}
/**
* Reserved bookkeeping key: how many writes the settings card has made through
* this store. Its presence separates "the file holds migration seed" from "the
* file holds the user's live edits" — see the seed rule in ./index.js. Field
* readers address their fields by name and never collide with it.
*/
const WRITE_MARK = "__writes";
/**
* One store instance: the plugin's own settings file, with the entry config as
* the migration source and the schema defaults as the last fallback.
*/
var SettingsStore = class {
	/** The user layer exactly as stored (presence marks an override). */
	user;
	/**
	* @param {object} [initial] - the user layer to adopt (migration seed).
	*/
	constructor(initial) {
		this.user = initial ?? readFile() ?? {};
	}
	/** Whether the store file exists (a fresh profile has none). */
	exists() {
		return existsSync(settingsFilePath());
	}
	/**
	* Whether the settings card has ever written through this store.
	*
	* False during the migration window — the window where the legacy settings
	* document can still deliver the user's real values, and where a first seed
	* may have been taken before those landed. While false the entry config stays
	* authoritative (where it carries a non-default value); once the card writes,
	* the file is — a runtime edit must never be regressed by a stale row.
	* @returns {boolean}
	*/
	get edited() {
		return typeof this.user[WRITE_MARK] === "number" && this.user[WRITE_MARK] > 0;
	}
	/**
	* The effective value of one field: the stored user value, else the schema
	* default the caller passes in.
	* @param {string} field - field name.
	* @param {unknown} fallback - the schema default for this field.
	* @returns {unknown} the effective value.
	*/
	value(field, fallback) {
		return Object.hasOwn(this.user, field) ? this.user[field] : fallback;
	}
	/**
	* Apply one patch in memory and persist it.
	* @param {object} patch - field to value; a `null` value clears the field.
	* @param {boolean} [fromCard] - true when the settings card made this write;
	*   marks the file as holding live user edits from then on.
	* @returns {object} the new user layer.
	*/
	patch(patch, fromCard = false) {
		const next = { ...this.user };
		for (const [field, value] of Object.entries(patch)) if (value === null) delete next[field];
		else next[field] = value;
		if (fromCard) next[WRITE_MARK] = (typeof next[WRITE_MARK] === "number" ? next[WRITE_MARK] : 0) + 1;
		writeSettings(next);
		for (const key of Object.keys(this.user)) delete this.user[key];
		Object.assign(this.user, next);
		return this.user;
	}
	/** Read the current user layer without touching the disk. */
	values() {
		return this.user;
	}
};
//#endregion
//#region src/index.js
/**
* Session head prompt — Host half (plain ESM; the node build config copies
* this file to lib/index.js verbatim).
*
* Registers one user-editable settings namespace and one global system-prompt
* section that renders the configured text at the VERY TOP of every session's
* assembled prompt (before the harness identity opener at -100 and the
* deployment persona at 0). Because the section text is a provider evaluated
* at each assembly, edits made on the web settings page take effect on the
* next request — no re-registration, no restart.
*
* @module dsh-session-head-prompt
*/
/**
* Host-API note: DSH 0.1.5-rc.x removed the `installSettingsSection` /
* `settingsNamespace` exports from `@deepseek-ai/dsh-settings`. A settings
* namespace is now a plain validated string, and registration goes through
* the `settings` service's `installSection` method, wrapped in
* `ctx.inject(['settings'], ...)` so a profile without a settings provider
* falls back to the composition entry (the same pattern the host's own
* bash-local and web-search-deepseek plugins use).
*
* DSH 0.1.7 removed that method (and `register`) in favour of projecting the
* plugin's own `Config` schema into the settings document: a field the user may
* edit is marked `.volatile()`, the Host serves it (its `describe()` reads
* `entry.fiber.runtime.Config`) and hands `apply` a stable reference per field
* instead of a plain value. Both paths are therefore probed at runtime — see
* `volatileField` and `readField` — and a host with neither keeps working on
* the composition entry alone.
*/
/** Plugin-owned keys: exactly what the migration deletes from the entry config. */
const OWN_KEYS = ["enabled", "prompt"];
/**
* The schema defaults, spelled out: the seed rule below uses them to tell a
* real profile override apart from the defaults the Host hands out once the
* one-time cleanup has emptied the entry's config.
*/
const DEFAULT_FOR_FIELD = {
	enabled: true,
	prompt: ""
};
/**
* The section names the 0.1.5 host keyed this plugin's settings under. The
* 0.1.7 platform refuses to import sections whose names are not profile entry
* ids, so the plugin reads them out of the legacy document itself.
*/
const LEGACY_NAMESPACES = ["session-head-prompt"];
/** Route base for the browser half's settings face. */
const ROUTE_BASE = "/plugins/dsh-session-prompt";
/**
* Read one config field.
*
* A `.volatile()` field parses into a stable reference read with `.get()`
* (0.1.7), while an older host hands the plain value through; a profile that
* supplies its own object (a hand-written entry, the smoke test) keeps working
* because a non-reference value falls through unchanged. Every read of a
* volatile field goes through here — a raw read would compare and render the
* reference object instead of the value behind it.
* @param {object} config - the object the field lives on.
* @param {string} field - field name.
* @returns {unknown} the field's current value, or undefined when it carries none.
*/
function readField(config, field) {
	const value = config?.[field];
	return value !== null && typeof value === "object" && typeof value.get === "function" ? value.get() : value;
}
/**
* Mark one field volatile when the resolved schemastery supports it.
*
* The marker is what puts the field into the 0.1.7 settings document, and what
* makes the Host hand `apply` a live reference instead of a frozen value. The
* 0.1.5 schemastery has no `volatile` method at all, so the call is probed:
* an unconditional `.volatile()` would throw there and take the plugin down.
* @param {object} field - the field schema to mark.
* @returns {object} the marked schema, or the field unchanged on an older host.
*/
function volatileField(field) {
	if (typeof field.volatile === "function") return field.volatile();
	if (typeof field.extra === "function") return field.extra("volatile", true);
	if (field && typeof field === "object") {
		field.meta = {
			...field.meta,
			volatile: true
		};
		return field;
	}
	return field;
}
/**
* Settings namespace owning the user-editable section of this plugin
* (lowercase kebab-case; paired with the same key on the web settings card).
* On DSH >= 0.1.5-rc.x a namespace is a plain string. On 0.1.7 the settings
* document is keyed by profile entry id instead, which this plugin's
* cordis.patch.yml spells as the same `session-head-prompt`.
* @type {string}
*/
const SETTINGS_NAMESPACE = "session-head-prompt";
/**
* Prompt order of the injected section. Sections concatenate in ascending
* order; the harness identity sits at -100 and the deployment persona at 0.
* -200 renders first, so the custom prompt is the first thing the model
* reads in every session.
*/
const HEAD_ORDER = -200;
/** Unique section name (a duplicate registration would throw). */
const HEAD_SECTION = "session-head-prompt:head";
/** Cordis plugin name (the row id in cordis.yml may differ). */
const name = "session-head-prompt";
/** The assembly registry this plugin contributes to, plus the card's settings face. */
const inject = ["systemPrompt", "webServer"];
/**
* Plugin configuration: whether injection is on, and the prompt text.
* @typedef {object} Config
* @property {boolean} [enabled] Master switch; disabled sections render nothing.
* @property {string} [prompt]   Text injected at the head of every session's system prompt.
*/
/** Runtime schema for the row and the settings namespace (defaults included). */
const Config = z.object({
	enabled: volatileField(z.boolean().default(true)),
	prompt: volatileField(z.string().default(""))
});
/**
* Matches a complete `{{…}}` group. The prompt renderer interpolates strict
* `{{variable}}` references and THROWS on unknown or malformed groups (a
* `{{name}}` nobody registered, `{{}}`, `{{ spaced }}`), which would break
* every request. The settings validator below therefore refuses such text at
* the write that produces it, before anything is stored. A lone `{{` without
* a later `}}` is literal prose and stays allowed.
*/
const COMPLETE_GROUP = /\{\{[^{}]*\}\}/;
/**
* Whether a value equals the schema default.
*
* Deep, and it has to be: `[]` and `[]` are two array literals, so `!==`
* reports every array field as a real override — which silently erased a
* user's disabled-model list on the boot after the migration. Configuration
* values are JSON-shaped, so a canonical-JSON comparison is exact here.
*/
function isDefaultValue(value, fallback) {
	if (value === fallback) return true;
	if (typeof value !== typeof fallback) return false;
	if (value === null || fallback === null || typeof value !== "object") return false;
	try {
		return JSON.stringify(value) === JSON.stringify(fallback);
	} catch {
		return false;
	}
}
/**
* Delete this plugin's own keys from the profile entry config, leaving every
* other key of the row untouched.
*
* One-time, right after the settings file has been seeded: the entry returns to
* its shipped state, so no second source of truth remains. The change callback
* returns INHERITED plus the row's foreign keys, not "the row minus our keys":
* the profile's composition check (`isDeepStrictEqual(next, inherited)`) is
* what lets the editor drop the row's user layer entirely, and a hand-built
* `{}` fails that check whenever a bundle layer still carries a config for this
* entry. Returning inherited makes the check pass either way.
*
* RETRIES, deliberately: `configEditor.edit` writes under the profile's
* package.json lock, and every plugin migrating on the same boot contends for
* that ONE lock — four sibling plugins seeding at once measured exactly one
* winner and three "timed out waiting for the writer lock" failures. The write
* is idempotent, so backing off (with jitter, so the four do not retry in
* lockstep) is what makes the rest land.
*
* @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
* @param {object} entryConfig - the entry config as the Host handed it over.
* @returns {Promise<void>} resolves once the cleanup landed or was skipped.
*/
/**
* When the profile tree last recomposed, module-level so every apply sees it.
*
* The legacy settings.yaml import writes the profile patch one section at a
* time for seconds after the Loader settles, emitting this event on every
* write. Cleaning up our row in that window is futile — the import's next
* section simply writes it back — so the cleanup waits for the tree to fall
* quiet first.
*/
let lastConfigReloadAt = Date.now();
/**
* Wait until the profile tree has been quiet for a while (the legacy import
* finished), or the deadline passes.
* @returns {Promise<void>} resolves when it is quiet, or on the deadline.
*/
async function waitForProfileQuiet() {
	const deadline = Date.now() + 12e4;
	for (;;) {
		if (Date.now() - lastConfigReloadAt >= 5e3) return;
		if (Date.now() >= deadline) return;
		await new Promise((resolve) => setTimeout(resolve, 1e3));
	}
}
async function cleanupEntryConfig(ctx, entryConfig) {
	const attempts = 10;
	for (let attempt = 0; attempt < attempts; attempt++) try {
		if (attempt === 0) await waitForProfileQuiet();
		else await new Promise((resolve) => setTimeout(resolve, 2e3 + Math.random() * 1e3));
		const editor = (typeof ctx.get === "function" ? (() => {
			try {
				return ctx.get("configEditor");
			} catch {
				return;
			}
		})() : void 0) ?? await new Promise((resolve) => {
			ctx.inject(["settings"], (settingsCtx) => {
				const owner = settingsCtx.settings?.ownerContext;
				resolve(typeof owner?.get === "function" ? (() => {
					try {
						return owner.get("configEditor");
					} catch {
						return;
					}
				})() : void 0);
			});
		});
		const entry = ctx.fiber?.entry;
		if (editor !== void 0 && entry !== void 0) {
			await editor.edit(entry, (raw, inherited) => {
				const next = { ...inherited ?? {} };
				for (const [key, value] of Object.entries(raw ?? {})) {
					if (OWN_KEYS.includes(key)) continue;
					if (!Object.hasOwn(next, key)) next[key] = value;
				}
				return next;
			});
			return;
		}
		await new Promise((resolve) => {
			ctx.inject(["settings"], (settingsCtx) => {
				const settings = settingsCtx.settings;
				if (typeof settings?.replace !== "function") {
					resolve();
					return;
				}
				const keep = Object.fromEntries(Object.entries(entryConfig).filter(([key]) => !OWN_KEYS.includes(key)));
				Promise.resolve(settings.replace(SETTINGS_NAMESPACE, keep)).catch(() => {}).then(resolve);
			});
		});
		return;
	} catch (error) {
		if (attempt === 9) {
			ctx.logger?.warn?.("session-head-prompt: entry config cleanup failed", error);
			return;
		}
		await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1) + Math.random() * 500));
	}
}
/** Loopback guard for the settings face (the Host's own rule for plugin routes). */
function trustedRequest(req) {
	const host = req.headers.host ?? "";
	const origin = req.headers.origin;
	if (!/^(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i.test(host)) return false;
	return origin === void 0 || /^https?:\/\/(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i.test(origin);
}
/** Read the JSON request body, or undefined when it is absent or oversized. */
function readBody(req) {
	return new Promise((resolve) => {
		let body = "";
		req.on("data", (chunk) => {
			body += chunk;
			if (body.length > 1e6) {
				resolve(void 0);
				req.destroy();
			}
		});
		req.on("end", () => resolve(body));
		req.on("error", () => resolve(void 0));
	});
}
/** JSON response helper. */
function json(res, status, body) {
	const payload = JSON.stringify(body);
	res.writeHead(status, { "Content-Type": "application/json" });
	res.end(payload);
}
/**
* Register the settings face (GET/POST) the browser card talks to.
*
* The key is minted per plugin lifetime and rides the GET response — that
* response already passed the loopback guard, exactly like the probe routes of
* the sibling plugins. The POST authorizes with it in a header, validates the
* patch against the same rule the schema used to enforce (no complete `{{…}}`
* group in the prompt), writes the store, and answers with the new view.
*
* @param {import('@deepseek-ai/cordis').Context} ctx - plugin context.
* @param {SettingsStore} store - this plugin's settings store.
* @returns {void}
*/
function registerSettingsFace(ctx, store) {
	ctx.inject(["webServer"], (webCtx) => {
		const server = webCtx.webServer;
		if (server === void 0) return;
		webCtx.effect(() => {
			const key = randomBytes(24).toString("hex");
			/** The document both routes answer with. */
			const view = () => ({
				key,
				value: {
					enabled: store.value("enabled", true),
					prompt: store.value("prompt", "")
				},
				base: {
					enabled: true,
					prompt: ""
				},
				user: store.values()
			});
			const dispose = server.register({
				kind: "exact",
				path: `${ROUTE_BASE}/settings`,
				handler: async (req, res) => {
					if (!trustedRequest(req)) {
						json(res, 403, { error: "request-not-trusted" });
						return;
					}
					if (req.method === "GET") {
						json(res, 200, view());
						return;
					}
					if (req.method !== "POST") {
						json(res, 405, { error: "method not allowed" });
						return;
					}
					if (req.headers["x-session-prompt-key"] !== key) {
						json(res, 403, { error: "invalid-key" });
						return;
					}
					const body = await readBody(req);
					if (body === void 0) {
						json(res, 413, { error: "body too large" });
						return;
					}
					let patch;
					try {
						patch = JSON.parse(body || "{}");
					} catch {
						json(res, 400, { error: "invalid json" });
						return;
					}
					if (Object.hasOwn(patch, "prompt")) {
						const prompt = patch.prompt;
						if (prompt !== null && (typeof prompt !== "string" || COMPLETE_GROUP.test(prompt))) {
							json(res, 400, { error: "invalid prompt" });
							return;
						}
					}
					if (Object.hasOwn(patch, "enabled") && patch.enabled !== null && typeof patch.enabled !== "boolean") {
						json(res, 400, { error: "invalid enabled" });
						return;
					}
					store.patch(patch, true);
					json(res, 200, view());
				}
			});
			return () => {
				dispose();
			};
		}, "session-head-prompt: settings face");
	});
}
/**
* Register the settings namespace (with the composition entry as the base
* layer) and the head prompt section whose text follows the effective
* settings on every assembly.
* @param {import('@deepseek-ai/cordis').Context} ctx - plugin context carrying
*   the injected systemPrompt service.
* @param {Config} config - the composition entry config, used as the settings base
*   (on 0.1.7 the entry's volatile fields arrive as live references).
*/
function apply(ctx, config) {
	const store = new SettingsStore();
	const legacy = readLegacySections(LEGACY_NAMESPACES);
	const seeded = {};
	for (const key of OWN_KEYS) {
		const entryValue = readField(config, key);
		const legacyValue = legacy === void 0 ? void 0 : legacy[key];
		if (!Object.hasOwn(store.user, key)) {
			if (entryValue !== void 0 && !isDefaultValue(entryValue, DEFAULT_FOR_FIELD[key])) seeded[key] = entryValue;
			else if (legacyValue !== void 0 && !isDefaultValue(legacyValue, DEFAULT_FOR_FIELD[key])) seeded[key] = legacyValue;
			else if (entryValue !== void 0) seeded[key] = entryValue;
			else if (legacyValue !== void 0) seeded[key] = legacyValue;
			continue;
		}
		if (store.edited) continue;
		if (entryValue !== void 0 && !isDefaultValue(entryValue, DEFAULT_FOR_FIELD[key])) {
			seeded[key] = entryValue;
			continue;
		}
		if (legacy !== void 0 && legacy[key] !== void 0 && !isDefaultValue(legacy[key], DEFAULT_FOR_FIELD[key])) seeded[key] = legacy[key];
	}
	if (Object.keys(seeded).length > 0) {
		store.patch(seeded);
		cleanupEntryConfig(ctx, config);
	}
	ctx.on("loader/volatile-update", () => {
		migrateOwnSettings();
	});
	ctx.on("app-boot/config-reload", () => {
		lastConfigReloadAt = Date.now();
	});
	registerSettingsFace(ctx, store);
	const effective = () => ({
		enabled: store.value("enabled", true),
		prompt: store.value("prompt", "")
	});
	ctx.systemPrompt.section({
		name: HEAD_SECTION,
		order: HEAD_ORDER,
		text: () => {
			const settings = effective();
			return settings.enabled !== false && typeof settings.prompt === "string" && settings.prompt !== "" ? settings.prompt : "";
		}
	});
}
//#endregion
export { Config, HEAD_ORDER, HEAD_SECTION, SETTINGS_NAMESPACE, apply, inject, name };
