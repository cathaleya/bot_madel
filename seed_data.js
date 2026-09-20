"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var fs_1 = require("fs");
var path_1 = require("path");
var prisma = new client_1.PrismaClient();
// Standard Normal CDF (Phi)
function normalCDF(x) {
    return (1.0 + erf(x / Math.sqrt(2.0))) / 2.0;
}
function erf(x) {
    var sign = (x >= 0) ? 1 : -1;
    x = Math.abs(x);
    var a1 = 0.254829592;
    var a2 = -0.284496736;
    var a3 = 1.421413741;
    var a4 = -1.453152027;
    var a5 = 1.061405429;
    var p = 0.3275911;
    var t = 1.0 / (1.0 + p * x);
    var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}
function randn_bm() {
    var u = 0, v = 0;
    while (u === 0)
        u = Math.random();
    while (v === 0)
        v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var madelQ, prelQ, b_madel, campuses, genders, origins, _loop_1, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Clearing database...');
                    return [4 /*yield*/, prisma.$executeRawUnsafe('TRUNCATE TABLE "Assessment", "Survey", "User" RESTART IDENTITY CASCADE;')];
                case 1:
                    _a.sent();
                    madelQ = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, 'src/app/assessment/madel5c/questions.json'), 'utf8'));
                    prelQ = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, 'src/app/assessment/preliminary/questions.json'), 'utf8'));
                    b_madel = madelQ.map(function () { return (Math.random() * 2 - 1) * 0.5; });
                    console.log('Generating 500 respondents...');
                    campuses = ['UNJ', 'UHAMKA', 'Atmajaya'];
                    genders = ['Laki-Laki', 'Perempuan'];
                    origins = ['Jawa', 'Luar Jawa'];
                    _loop_1 = function (i) {
                        var campus, gender, origin_1, specialNeeds, theta, user, totalMadel, madelAnswers, totalPrelim, prelimAnswers, susTotalRaw, susAnswers, susTotalScore;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    campus = campuses[Math.floor(Math.random() * campuses.length)];
                                    gender = genders[Math.floor(Math.random() * genders.length)];
                                    origin_1 = origins[Math.floor(Math.random() * origins.length)];
                                    specialNeeds = Math.random() < 0.95 ? 'tidak' : 'ya';
                                    theta = randn_bm();
                                    return [4 /*yield*/, prisma.user.create({
                                            data: {
                                                name: "Responden ".concat(i + 1),
                                                campus: campus,
                                                gender: gender,
                                                origin: origin_1,
                                                specialNeeds: specialNeeds
                                            }
                                        })];
                                case 1:
                                    user = _b.sent();
                                    totalMadel = 0;
                                    madelAnswers = madelQ.map(function (q, idx) {
                                        // Get possible sorted scores for this item
                                        var scores = q.options.map(function (o) { return o.score; }).sort(function (a, b) { return a - b; });
                                        // Calculate probability of being at higher end using Item Response Theory (GRM approximation)
                                        // theta - b gives the continuous position. Add small random noise to prevent 1.0 perfect correlations.
                                        var rawPos = theta - b_madel[idx] + (randn_bm() * 0.3);
                                        var p = normalCDF(rawPos);
                                        // Map probability to score index (e.g. 0 to scores.length - 1)
                                        var scoreIdx = Math.floor(p * scores.length);
                                        if (scoreIdx >= scores.length)
                                            scoreIdx = scores.length - 1;
                                        if (scoreIdx < 0)
                                            scoreIdx = 0;
                                        var pickedScore = scores[scoreIdx];
                                        totalMadel += pickedScore;
                                        return { questionId: q.id, score: pickedScore };
                                    });
                                    return [4 /*yield*/, prisma.assessment.create({
                                            data: {
                                                userId: user.id,
                                                type: 'MADEL5C',
                                                totalScore: totalMadel,
                                                answersJson: JSON.stringify(madelAnswers)
                                            }
                                        })];
                                case 2:
                                    _b.sent();
                                    totalPrelim = 0;
                                    prelimAnswers = prelQ.map(function (q) {
                                        var pScore = Math.round(theta + 3 + (randn_bm() * 0.5));
                                        if (pScore > 5)
                                            pScore = 5;
                                        if (pScore < 1)
                                            pScore = 1;
                                        totalPrelim += pScore;
                                        return { questionId: q.id, score: pScore };
                                    });
                                    return [4 /*yield*/, prisma.assessment.create({
                                            data: {
                                                userId: user.id,
                                                type: 'PDI-DL',
                                                totalScore: totalPrelim,
                                                answersJson: JSON.stringify(prelimAnswers)
                                            }
                                        })];
                                case 3:
                                    _b.sent();
                                    susTotalRaw = 0;
                                    susAnswers = Array.from({ length: 10 }).map(function (_, idx) {
                                        var qNum = idx + 1;
                                        // Correlate with theta: high theta = good UX (high on odd, low on even)
                                        var raw = Math.round(theta * 0.5 + 4 + randn_bm() * 0.5);
                                        if (raw > 5)
                                            raw = 5;
                                        if (raw < 1)
                                            raw = 1;
                                        var finalScore = raw;
                                        if (qNum % 2 === 0) { // even (negative wording) -> reverse
                                            finalScore = 6 - raw;
                                        }
                                        susTotalRaw += (qNum % 2 !== 0) ? (finalScore - 1) : (5 - finalScore);
                                        return { questionId: qNum, score: finalScore };
                                    });
                                    susTotalScore = susTotalRaw * 2.5;
                                    return [4 /*yield*/, prisma.survey.create({
                                            data: {
                                                userId: user.id,
                                                totalScore: susTotalScore,
                                                answersJson: JSON.stringify(susAnswers),
                                                feedback: "Cukup baik dan mudah digunakan."
                                            }
                                        })];
                                case 4:
                                    _b.sent();
                                    if ((i + 1) % 50 === 0)
                                        console.log("Inserted ".concat(i + 1, "/500 users..."));
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < 500)) return [3 /*break*/, 5];
                    return [5 /*yield**/, _loop_1(i)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log('Data generation completed successfully!');
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (e) {
    console.error(e);
    process.exit(1);
}).finally(function () {
    prisma.$disconnect();
});
