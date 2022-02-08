var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, copyDefault, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && (copyDefault || key !== "default"))
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toCommonJS = /* @__PURE__ */ ((cache) => {
  return (module2, temp) => {
    return cache && cache.get(module2) || (temp = __reExport(__markAsModule({}), module2, 1), cache && cache.set(module2, temp), temp);
  };
})(typeof WeakMap !== "undefined" ? /* @__PURE__ */ new WeakMap() : 0);

// node_modules/pg-format/lib/index.js
var require_lib = __commonJS({
  "node_modules/pg-format/lib/index.js"(exports, module2) {
    "use strict";
    var reservedMap = require(__dirname + "/reserved.js");
    var fmtPattern = {
      ident: "I",
      literal: "L",
      string: "s"
    };
    function formatDate(date) {
      date = date.replace("T", " ");
      date = date.replace("Z", "+00");
      return date;
    }
    function isReserved(value) {
      if (reservedMap[value.toUpperCase()]) {
        return true;
      }
      return false;
    }
    function arrayToList(useSpace, array, formatter) {
      var sql = "";
      var temp = [];
      sql += useSpace ? " (" : "(";
      for (var i = 0; i < array.length; i++) {
        sql += (i === 0 ? "" : ", ") + formatter(array[i]);
      }
      sql += ")";
      return sql;
    }
    function quoteIdent(value) {
      if (value === void 0 || value === null) {
        throw new Error("SQL identifier cannot be null or undefined");
      } else if (value === false) {
        return '"f"';
      } else if (value === true) {
        return '"t"';
      } else if (value instanceof Date) {
        return '"' + formatDate(value.toISOString()) + '"';
      } else if (value instanceof Buffer) {
        throw new Error("SQL identifier cannot be a buffer");
      } else if (Array.isArray(value) === true) {
        var temp = [];
        for (var i = 0; i < value.length; i++) {
          if (Array.isArray(value[i]) === true) {
            throw new Error("Nested array to grouped list conversion is not supported for SQL identifier");
          } else {
            temp.push(quoteIdent(value[i]));
          }
        }
        return temp.toString();
      } else if (value === Object(value)) {
        throw new Error("SQL identifier cannot be an object");
      }
      var ident = value.toString().slice(0);
      if (/^[a-z_][a-z0-9_$]*$/.test(ident) === true && isReserved(ident) === false) {
        return ident;
      }
      var quoted = '"';
      for (var i = 0; i < ident.length; i++) {
        var c = ident[i];
        if (c === '"') {
          quoted += c + c;
        } else {
          quoted += c;
        }
      }
      quoted += '"';
      return quoted;
    }
    function quoteLiteral(value) {
      var literal = null;
      var explicitCast = null;
      if (value === void 0 || value === null) {
        return "NULL";
      } else if (value === false) {
        return "'f'";
      } else if (value === true) {
        return "'t'";
      } else if (value instanceof Date) {
        return "'" + formatDate(value.toISOString()) + "'";
      } else if (value instanceof Buffer) {
        return "E'\\\\x" + value.toString("hex") + "'";
      } else if (Array.isArray(value) === true) {
        var temp = [];
        for (var i = 0; i < value.length; i++) {
          if (Array.isArray(value[i]) === true) {
            temp.push(arrayToList(i !== 0, value[i], quoteLiteral));
          } else {
            temp.push(quoteLiteral(value[i]));
          }
        }
        return temp.toString();
      } else if (value === Object(value)) {
        explicitCast = "jsonb";
        literal = JSON.stringify(value);
      } else {
        literal = value.toString().slice(0);
      }
      var hasBackslash = false;
      var quoted = "'";
      for (var i = 0; i < literal.length; i++) {
        var c = literal[i];
        if (c === "'") {
          quoted += c + c;
        } else if (c === "\\") {
          quoted += c + c;
          hasBackslash = true;
        } else {
          quoted += c;
        }
      }
      quoted += "'";
      if (hasBackslash === true) {
        quoted = "E" + quoted;
      }
      if (explicitCast) {
        quoted += "::" + explicitCast;
      }
      return quoted;
    }
    function quoteString(value) {
      if (value === void 0 || value === null) {
        return "";
      } else if (value === false) {
        return "f";
      } else if (value === true) {
        return "t";
      } else if (value instanceof Date) {
        return formatDate(value.toISOString());
      } else if (value instanceof Buffer) {
        return "\\x" + value.toString("hex");
      } else if (Array.isArray(value) === true) {
        var temp = [];
        for (var i = 0; i < value.length; i++) {
          if (value[i] !== null && value[i] !== void 0) {
            if (Array.isArray(value[i]) === true) {
              temp.push(arrayToList(i !== 0, value[i], quoteString));
            } else {
              temp.push(quoteString(value[i]));
            }
          }
        }
        return temp.toString();
      } else if (value === Object(value)) {
        return JSON.stringify(value);
      }
      return value.toString().slice(0);
    }
    function config(cfg) {
      fmtPattern.ident = "I";
      fmtPattern.literal = "L";
      fmtPattern.string = "s";
      if (cfg && cfg.pattern) {
        if (cfg.pattern.ident) {
          fmtPattern.ident = cfg.pattern.ident;
        }
        if (cfg.pattern.literal) {
          fmtPattern.literal = cfg.pattern.literal;
        }
        if (cfg.pattern.string) {
          fmtPattern.string = cfg.pattern.string;
        }
      }
    }
    function formatWithArray(fmt, parameters) {
      var index = 0;
      var params = parameters;
      var re = "%(%|(\\d+\\$)?[";
      re += fmtPattern.ident;
      re += fmtPattern.literal;
      re += fmtPattern.string;
      re += "])";
      re = new RegExp(re, "g");
      return fmt.replace(re, function(_, type) {
        if (type === "%") {
          return "%";
        }
        var position = index;
        var tokens = type.split("$");
        if (tokens.length > 1) {
          position = parseInt(tokens[0]) - 1;
          type = tokens[1];
        }
        if (position < 0) {
          throw new Error("specified argument 0 but arguments start at 1");
        } else if (position > params.length - 1) {
          throw new Error("too few arguments");
        }
        index = position + 1;
        if (type === fmtPattern.ident) {
          return quoteIdent(params[position]);
        } else if (type === fmtPattern.literal) {
          return quoteLiteral(params[position]);
        } else if (type === fmtPattern.string) {
          return quoteString(params[position]);
        }
      });
    }
    function format(fmt) {
      var args = Array.prototype.slice.call(arguments);
      args = args.slice(1);
      return formatWithArray(fmt, args);
    }
    exports = module2.exports = format;
    exports.config = config;
    exports.ident = quoteIdent;
    exports.literal = quoteLiteral;
    exports.string = quoteString;
    exports.withArray = formatWithArray;
  }
});

// services/node-lamda/hello.ts
var hello_exports = {};
__export(hello_exports, {
  handler: () => handler
});
var import_aws_sdk = require("aws-sdk");
var pgFormat = require_lib();
var s3Client = new import_aws_sdk.S3();
async function handler(event, context) {
  const buckets = await s3Client.listBuckets().promise();
  console.log("Got an event:");
  console.log(event);
  console.log(pgFormat.name);
  return {
    statusCode: 200,
    body: "Here are your buckets: " + JSON.stringify(buckets)
  };
}
module.exports = __toCommonJS(hello_exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
