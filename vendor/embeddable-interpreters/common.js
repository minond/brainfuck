(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    exports.__esModule = true;
    var inBrowser = typeof window !== 'undefined';
    var inputPrompt = 'input: ';
    var ReadBuffer = /** @class */ (function () {
        function ReadBuffer(buff) {
            if (buff === void 0) { buff = ""; }
            this.buff = buff;
            this.pos = 0;
        }
        ReadBuffer.prototype.ready = function () {
            return this.buff.length !== 0;
        };
        ReadBuffer.prototype.next = function () {
            return this.buff.charAt(this.pos++) || String.fromCharCode(0);
        };
        return ReadBuffer;
    }());
    exports.ReadBuffer = ReadBuffer;
    exports.read = function (cb, buff) {
        return buff.ready() ? cb(buff.next()) :
            (inBrowser ? browserRead(cb) : nodeRead(cb));
    };
    exports.write = function (str) {
        return inBrowser ? browserWrite(str) : nodeWrite(str);
    };
    exports.isset = function (val) {
        return val !== null && val !== undefined;
    };
    exports.call = function (fn) {
        return fn();
    };
    exports.pass = function (x) {
        return x;
    };
    var nodeWrite = function (str) {
        return process.stdout.write(str);
    };
    var browserWrite = function (str) {
        return console.log(str);
    };
    var nodeRead = function (cb) {
        var readline = require('readline');
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(inputPrompt, function (input) {
            rl.close();
            cb(input);
        });
    };
    var browserRead = function (cb) {
        return cb(window.prompt(inputPrompt) || String.fromCharCode(0));
    };
});
