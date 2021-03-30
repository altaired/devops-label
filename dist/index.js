"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldHaveProposalLabel = exports.checkSameDirectory = exports.checkCategoryLabel = void 0;
var core = __importStar(require("@actions/core"));
var github_1 = require("@actions/github");
var yaml = __importStar(require("js-yaml"));
var minimatch_1 = __importDefault(require("minimatch"));
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var ghToken, configPath, prNumber, ghClient, files, config, categories, issue, dir, label, addProposalLabel;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('fetching inputs...');
                    ghToken = core.getInput('github-token');
                    configPath = core.getInput('configuration-path');
                    prNumber = getPRNumber();
                    if (prNumber == undefined) {
                        console.log('invalid pr number');
                        return [2 /*return*/, false];
                    }
                    ghClient = github_1.getOctokit(ghToken);
                    return [4 /*yield*/, getPRFiles(ghClient, prNumber)];
                case 1:
                    files = _a.sent();
                    console.log('parsing configuration file...');
                    return [4 /*yield*/, getConfiguration(ghClient, configPath)];
                case 2:
                    config = _a.sent();
                    categories = config.categories, issue = config.issue, dir = config.dir;
                    // Only continue if all files are in the specified path
                    if (!files.map(function (file) { return file.filename; }).every(function (file) { return minimatch_1.default(file, dir); })) {
                        console.log('files outside config directory');
                        return [2 /*return*/, false];
                    }
                    label = checkCategoryLabel(files, categories);
                    if (!(label != undefined)) return [3 /*break*/, 4];
                    return [4 /*yield*/, addLabel(ghClient, prNumber, label)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    setFailed('no single match found, make sure only one category is modified');
                    return [2 /*return*/, false];
                case 5:
                    addProposalLabel = shouldHaveProposalLabel(files, categories[label]);
                    if (addProposalLabel) {
                        console.log('pr is a new proposal, adding label');
                        addLabel(ghClient, prNumber, 'proposal');
                    }
                    return [2 /*return*/, true];
            }
        });
    });
}
function addLabel(client, prNumber, label) {
    return __awaiter(this, void 0, void 0, function () {
        var current, data, labels;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.issues.listLabelsOnIssue({
                        owner: github_1.context.repo.owner,
                        repo: github_1.context.repo.repo,
                        issue_number: prNumber,
                    })];
                case 1:
                    current = _a.sent();
                    data = current.data;
                    labels = data.map(function (label) { return label.name; });
                    console.log("current labels: [" + labels.join(', ') + "]");
                    return [4 /*yield*/, client.issues.update({
                            owner: github_1.context.repo.owner,
                            repo: github_1.context.repo.repo,
                            issue_number: prNumber,
                            labels: __spreadArray(__spreadArray([], labels), [label]),
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, true];
            }
        });
    });
}
function setFailed(error) {
    core.setFailed(error);
}
function checkCategoryLabel(files, categories) {
    var _loop_1 = function (category) {
        if (files.length > 0) {
            var _a = categories[category], glob_1 = _a.glob, suffix_1 = _a.suffix, folder_1 = _a.folder;
            var sameCategory = files.every(function (file) { return minimatch_1.default(file.filename, "" + glob_1 + folder_1 + "/" + suffix_1); });
            var sameDirectory = checkSameDirectory(files, categories[category]);
            if (sameCategory && sameDirectory) {
                console.log("matched with label " + category);
                return { value: category };
            }
        }
    };
    for (var category in categories) {
        var state_1 = _loop_1(category);
        if (typeof state_1 === "object")
            return state_1.value;
    }
    console.log('no match found');
    return undefined;
}
exports.checkCategoryLabel = checkCategoryLabel;
function checkSameDirectory(files, category) {
    var glob = category.glob, folder = category.folder;
    var filenames = files.map(function (file) { return file.filename.split('/'); });
    var first = filenames[0];
    var prefix = ("" + glob + folder).split('/');
    var length = prefix.length;
    for (var _i = 0, filenames_1 = filenames; _i < filenames_1.length; _i++) {
        var filename = filenames_1[_i];
        for (var i = 0; i < length; i++) {
            if (first[i] !== filename[i]) {
                return false;
            }
        }
    }
    return true;
}
exports.checkSameDirectory = checkSameDirectory;
function shouldHaveProposalLabel(files, category) {
    var glob = category.glob, folder = category.folder, proposal = category.proposal;
    // Checks if the pr includes an added file by the name of category.proposal
    return files.some(function (file) { return file.status === 'added' && minimatch_1.default(file.filename, "" + glob + folder + "/" + proposal); });
}
exports.shouldHaveProposalLabel = shouldHaveProposalLabel;
function getPRFiles(client, prNumber) {
    return __awaiter(this, void 0, void 0, function () {
        var filesResponse, files, _i, files_1, file;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filesResponse = client.pulls.listFiles.endpoint.merge({
                        owner: github_1.context.repo.owner,
                        repo: github_1.context.repo.repo,
                        pull_number: prNumber,
                    });
                    return [4 /*yield*/, client.paginate(filesResponse)];
                case 1:
                    files = _a.sent();
                    console.log('changed files:');
                    for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                        file = files_1[_i];
                        console.log("   " + file.filename + " (" + file.status + ")");
                    }
                    return [2 /*return*/, files];
            }
        });
    });
}
function getPRNumber() {
    var pr = github_1.context.payload.pull_request;
    if (!pr) {
        return undefined;
    }
    return pr.number;
}
function fetchFile(client, path) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.repos.getContent({
                        owner: github_1.context.repo.owner,
                        repo: github_1.context.repo.repo,
                        path: path,
                        ref: github_1.context.sha,
                    })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, Buffer.from(response.data.content, response.data.encoding).toString()];
            }
        });
    });
}
function getConfiguration(client, configPath) {
    return __awaiter(this, void 0, void 0, function () {
        var configurationContent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchFile(client, configPath)];
                case 1:
                    configurationContent = _a.sent();
                    try {
                        return [2 /*return*/, yaml.load(configurationContent)];
                    }
                    catch (error) {
                        return [2 /*return*/, ''];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
run();
