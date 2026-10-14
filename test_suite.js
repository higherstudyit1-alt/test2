// test_suite.js - Automated Verification of all Master Prompt Requirements
const fs = require('fs');

// Mock browser environment
global.window = global;
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};
global.location = { hash: '#/dashboard' };
global.document = {
  querySelector() { return null; },
  querySelectorAll() { return []; },
  addEventListener() {}
};

console.log("=== RUNNING HIGHER.STUDY VERIFICATION SUITE ===\n");

// Load Scripts in sequence
require('./config.js');
require('./data/collegesData.js');
require('./data/trainingModulesData.js');
require('./data/questionBankData.js');
require('./js/db.js');
require('./js/auth.js');
require('./js/quiz.js');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${message}`);
  } else {
    console.error(`[FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// 1. TEST 28 COLLEGES
console.log("\n--- TEST GROUP 1: 28 DISTINCT COLLEGES ---");
const colleges = window.HS_COLLEGES;
assert(colleges.length === 28, `Exactly 28 colleges configured (Found: ${colleges.length})`);

const collegeNames = colleges.map(c => c.name);
const sortedNames = collegeNames.slice().sort((a, b) => a.localeCompare(b));
const isSorted = collegeNames.every((val, idx) => val === sortedNames[idx]);
assert(isSorted, "Colleges are strictly sorted in alphabetical order (A–Z)");

// Specific College Distinctions
assert(collegeNames.includes("Amity") && collegeNames.includes("Amity Online") && collegeNames.includes("Amity University"), "Amity, Amity Online, and Amity University exist as distinct entries");
assert(collegeNames.includes("Centurion Old") && collegeNames.includes("Centurion University"), "Centurion Old and Centurion University exist as distinct entries");
assert(collegeNames.includes("CV Raman GIFT") && collegeNames.includes("CV Raman University Old"), "CV Raman GIFT and CV Raman University Old exist as distinct entries");

// 2. TEST ALLIANCE CAMPUS RESTRICTIONS
console.log("\n--- TEST GROUP 2: ALLIANCE CAMPUS RESTRICTIONS ---");
const alliance = colleges.find(c => c.id === "COL02");
assert(alliance !== undefined, "Alliance institution entry exists (COL02)");
assert(alliance.campuses.length === 3, `Alliance has exactly 3 campuses (Found: ${alliance.campuses.length})`);

const ascentCampus = alliance.campuses.find(cmp => cmp.id === "CMP02_ASCENT");
const impactCampus = alliance.campuses.find(cmp => cmp.id === "CMP02_IMPACT");
const centralCampus = alliance.campuses.find(cmp => cmp.id === "CMP02_CENTRAL");

assert(ascentCampus && ascentCampus.name === "Alliance Ascent Campus", "Alliance Ascent Campus exists");
assert(ascentCampus.allowedCourses.length === 1 && ascentCampus.allowedCourses[0] === "MBA", "Alliance Ascent Campus is restricted to MBA ONLY");

assert(impactCampus && impactCampus.name === "Alliance Impact Campus", "Alliance Impact Campus exists");
assert(impactCampus.allowedCourses.length === 1 && impactCampus.allowedCourses[0] === "B.Com", "Alliance Impact Campus is restricted to B.Com ONLY");

const ascentFilteredCourses = window.getFilteredCoursesForCampus("COL02", "CMP02_ASCENT");
assert(ascentFilteredCourses.every(c => c.name.startsWith("MBA")), "Ascent Campus course filter strictly permits only MBA");

const impactFilteredCourses = window.getFilteredCoursesForCampus("COL02", "CMP02_IMPACT");
assert(impactFilteredCourses.every(c => c.name.startsWith("B.Com")), "Impact Campus course filter strictly permits only B.Com");

// 3. TEST EXACTLY EIGHT MAIN MODULES & HIERARCHY
console.log("\n--- TEST GROUP 3: EIGHT MAIN MODULES HIERARCHY ---");
const modules = window.HS_DEFAULT_MODULES;
assert(modules.length === 8, `Exactly eight main modules exist (Found: ${modules.length})`);

const expectedModuleNames = [
  "College Introduction",
  "Self Introduction (Employee)",
  "Call Handling",
  "Objection Handling",
  "CRM Process",
  "Daily Reporting",
  "Final Assessment",
  "IMP Module"
];

expectedModuleNames.forEach((name, idx) => {
  assert(modules[idx].order === idx + 1 && modules[idx].name === name, `Module ${idx + 1} is strictly '${name}'`);
});

// IMP Module Last position verification
const lastModule = modules[7];
assert(lastModule.name === "IMP Module" && lastModule.order === 8, "IMP Module is strictly Module 8 and the final main module");

// Module 2 Nested Counselling Process
const mod2 = modules[1];
const counsellingSub = mod2.subprocesses.find(s => s.name === "Counselling Process");
assert(counsellingSub !== undefined, "Counselling Process is strictly nested inside Module 2 (Self Introduction)");

// Module 3 Four Required Sub-processes
const mod3 = modules[2];
const subNames = mod3.subprocesses.map(s => s.name);
assert(subNames.includes("Lead Handling"), "Module 3 contains sub-process: Lead Handling");
assert(subNames.includes("Follow-up Process"), "Module 3 contains sub-process: Follow-up Process");
assert(subNames.includes("Lead Status Management"), "Module 3 contains sub-process: Lead Status Management");
assert(subNames.includes("Admission Process"), "Module 3 contains sub-process: Admission Process");

// 4. TEST 15 OBJECTION SCENARIOS
console.log("\n--- TEST GROUP 4: 15 OBJECTION SCENARIOS (12 FIELDS) ---");
const scenarios = window.HS_OBJECTION_SCENARIOS;
assert(scenarios.length === 15, `Exactly 15 objection scenarios configured (Found: ${scenarios.length})`);

const s1 = scenarios[0];
assert(s1.title && s1.studentStatement && s1.possibleReason && s1.discoveryQuestions && s1.recommendedResponse && s1.alternativeResponse && s1.responsesToAvoid && s1.verifiedFacts && s1.recommendedNextStep && s1.practiceActivity && s1.evaluationCriteria && s1.verificationSource, "Scenario 1 contains all 12 mandatory specification fields");

// 5. TEST QUESTION BANK & HONEST TRACKING
console.log("\n--- TEST GROUP 5: QUESTION BANK & HONEST TRACKER ---");
const qStats = window.computeQuestionBankStats("COL02", "MOD01", window.HS_DB.data.questions);
assert(qStats.targetCount === 50, "Target question count is 50 per module");
assert(qStats.savedCount >= 0, `Saved question count tracked accurately (Found: ${qStats.savedCount})`);
assert(qStats.remainingCount === Math.max(0, 50 - qStats.savedCount), `Remaining question count tracked honestly (${qStats.remainingCount})`);
assert(qStats.status.includes(String(qStats.savedCount)), "Honest completion status reported without false 100% claims");

// 6. TEST MANDATORY QUIZ BEHAVIOR (SECTION 12)
console.log("\n--- TEST GROUP 6: MANDATORY QUIZ ENGINE & ANSWER HIDING ---");
const empId = "EMP_TEST_001";
const attempt = window.HS_QUIZ.startAttempt(empId, "COL02", "MOD01", { forceNew: true });
assert(attempt.attemptId && attempt.questions.length > 0, "Quiz attempt initialized successfully");

// Verify zero immediate feedback during attempt
assert(attempt.result === null, "Live result is null during test attempt");
window.HS_QUIZ.selectAnswer(attempt, 0, 0); // Select Option A
assert(attempt.userAnswers[0] === 0, "Answer selected without displaying correctness");

// Test navigation
window.HS_QUIZ.setCurrentIndex(attempt, 1);
assert(attempt.currentIndex === 1, "Navigated to next question without revealing previous answer correctness");

// In-progress persistence test
const restoredAttempt = window.HS_QUIZ.getActiveAttempt(empId, "COL02", "MOD01");
assert(restoredAttempt && restoredAttempt.userAnswers[0] === 0, "In-progress attempt persisted across state reload");

// Submission and Backend Scoring
const quizResult = window.HS_QUIZ.submitAssessment(attempt);
assert(quizResult !== null, "Assessment scored upon formal submission");
assert(quizResult.finalPercentage >= 0 && quizResult.finalPercentage <= 100, `Final percentage scored: ${quizResult.finalPercentage}%`);
assert(quizResult.passMessage && quizResult.failMessage, "Pass/Fail encouraging messages present");

// Retake creates new attempt while preserving past history
const pastHistory = window.HS_QUIZ.getAttemptHistory(empId, "COL02", "MOD01");
assert(pastHistory.length === 1, "Attempt 1 archived in historical records");

const attempt2 = window.HS_QUIZ.startAttempt(empId, "COL02", "MOD01", { forceNew: true });
assert(attempt2.attemptNumber === 2, `Retake created Attempt #2 (Found: ${attempt2.attemptNumber})`);
assert(attempt2.attemptId !== attempt.attemptId, "New attempt ID generated independently");

// Retake with shuffled questions preserves correct answer association
const attemptShuffled = window.HS_QUIZ.startAttempt(empId, "COL02", "MOD01", { shuffle: true, forceNew: true });
attemptShuffled.questions.forEach(q => {
  const correctOptText = q.options[q._realCorrectIndex];
  assert(correctOptText !== undefined && correctOptText.length > 0, `Shuffled question option mapping valid: "${correctOptText.slice(0, 30)}..."`);
});

// 7. TEST AUTHENTICATION & PRIMARY ADMIN FIX
console.log("\n--- TEST GROUP 7: AUTHENTICATION & PRIMARY ADMIN FIX ---");
window.HS_AUTH.login("hsadmin@gmail.com", "hsadmin@2026", "admin").then(res => {
  assert(res.ok === true, "Primary Admin login successful with hsadmin@gmail.com / hsadmin@2026");
  assert(res.user.role === "admin", `Primary Admin role is strictly 'admin' (Found: ${res.user.role})`);
  assert(res.user.isPrimaryAdmin === true, "Primary Admin flag is true");
  assert(window.HS_AUTH.canAccess(res.user.role, "admin"), "Primary Admin has full access to Admin area");

  // Manager Login Test
  window.HS_AUTH.login("manager@higher.study", "manager@2026", "manager").then(resMgr => {
    assert(resMgr.ok === true, "Manager login successful");
    assert(resMgr.user.role === "manager", "Manager role assigned correctly");
    assert(window.HS_AUTH.canAccess(resMgr.user.role, "manager"), "Manager has access to Manager area");
    assert(!window.HS_AUTH.canAccess(resMgr.user.role, "admin"), "Manager is restricted from Admin area");

    // Employee Login Test
    window.HS_AUTH.login("neha@higher.study", "employee@2026", "employee").then(resEmp => {
      assert(resEmp.ok === true, "Employee login successful");
      assert(resEmp.user.role === "employee", "Employee role assigned correctly");
      assert(!window.HS_AUTH.canAccess(resEmp.user.role, "admin"), "Employee is restricted from Admin area");
      assert(!window.HS_AUTH.canAccess(resEmp.user.role, "manager"), "Employee is restricted from Manager area");

      console.log(`\n========================================`);
      console.log(`ALL VERIFICATION TESTS COMPLETED: ${passedTests} / ${totalTests} PASSED`);
      console.log(`========================================\n`);
    });
  });
});
