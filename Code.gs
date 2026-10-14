/**
 * Higher.study Employee Counsellor Training Platform - Google Apps Script Backend (Code.gs)
 * Production deployment script for bidirectional Google Sheets integration.
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Sheet linked to the Higher.study training application.
 * 2. Click Extensions > Apps Script.
 * 3. Replace all existing code in Code.gs with this script.
 * 4. Click Deploy > Manage Deployments > Edit (or New Deployment).
 * 5. Set Type: Web App | Execute as: Me | Who has access: Anyone.
 * 6. Copy the Web App URL (ends with /exec) into config.js as SHEET_URL.
 */

const PRIMARY_ADMIN_EMAIL = "hsadmin@gmail.com";
const PRIMARY_ADMIN_DEFAULT_PW = "hsadmin@2026";

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    ok: true,
    info: "Higher.study training API is running.",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const raw = e.postData.contents;
    const body = JSON.parse(raw);
    const action = body.action;

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Ping / Health check
    if (action === "ping") {
      return responseJson({ ok: true, status: "Connected", timestamp: new Date().toISOString() });
    }

    // 2. User Login
    if (action === "login") {
      return handleLogin(ss, body);
    }

    // 3. User Registration
    if (action === "register") {
      return handleRegister(ss, body);
    }

    // 4. Full Data Synchronization (fetch all tabs)
    if (action === "data") {
      return handleDataFetch(ss, body);
    }

    // 5. Put Single Row
    if (action === "put") {
      return handlePutRow(ss, body);
    }

    // 6. Put Multiple Rows
    if (action === "putMany") {
      return handlePutManyRows(ss, body);
    }

    // 7. Replace Table / Sub-set
    if (action === "replace") {
      return handleReplace(ss, body);
    }

    // 8. Approve / Reject User
    if (action === "approve") {
      return handleApprove(ss, body);
    }

    // 9. Remove User
    if (action === "removeUser") {
      return handleRemoveUser(ss, body);
    }

    // 10. Audit Logging
    if (action === "log") {
      return handleLogActivity(ss, body);
    }

    return responseJson({ ok: false, error: "Unknown action: " + action });

  } catch (err) {
    return responseJson({ ok: false, error: "Server Exception: " + err.toString() });
  }
}

// JSON Output Helper
function responseJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Ensure Sheet Exists with Headers
function getOrCreateSheet(ss, sheetName, defaultHeaders) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (defaultHeaders && defaultHeaders.length) {
      sheet.appendRow(defaultHeaders);
      sheet.getRange(1, 1, 1, defaultHeaders.length).setFontWeight("bold");
    }
  }
  return sheet;
}

// Convert Sheet to Array of JSON Objects
function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(String);
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

// Handle User Login
function handleLogin(ss, body) {
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "").trim();
  const requestedRole = String(body.role || "employee").toLowerCase();

  const userSheet = getOrCreateSheet(ss, "Users", [
    "User ID", "Name", "Email", "Password", "Role", "Job Role", "Department", "Approved", "Created", "Last Login", "Login Count"
  ]);

  const users = sheetToObjects(userSheet);
  let matchedRowIdx = -1;
  let user = null;

  for (let i = 0; i < users.length; i++) {
    if (String(users[i]["Email"]).trim().toLowerCase() === email) {
      matchedRowIdx = i + 2; // 1-based, +1 for header
      user = users[i];
      break;
    }
  }

  // Auto-provision or elevate Primary Admin
  if (email === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    if (!user) {
      user = {
        "User ID": "ADM001",
        "Name": "Primary Admin",
        "Email": PRIMARY_ADMIN_EMAIL,
        "Password": password || PRIMARY_ADMIN_DEFAULT_PW,
        "Role": "admin",
        "Job Role": "Primary Admin",
        "Department": "Management",
        "Approved": "TRUE",
        "Created": Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd HH:mm"),
        "Last Login": Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd HH:mm"),
        "Login Count": 1
      };
      userSheet.appendRow([
        user["User ID"], user["Name"], user["Email"], user["Password"], user["Role"],
        user["Job Role"], user["Department"], user["Approved"], user["Created"], user["Last Login"], user["Login Count"]
      ]);
    } else {
      // Fix role in sheet if it was previously set as employee
      if (String(user["Role"]).toLowerCase() !== "admin") {
        userSheet.getRange(matchedRowIdx, 5).setValue("admin");
        userSheet.getRange(matchedRowIdx, 6).setValue("Primary Admin");
        userSheet.getRange(matchedRowIdx, 8).setValue("TRUE");
        user["Role"] = "admin";
        user["Job Role"] = "Primary Admin";
        user["Approved"] = "TRUE";
      }
    }
  }

  if (!user) {
    return responseJson({ ok: false, error: "No account found with this email." });
  }

  if (String(user["Password"]).trim() !== password) {
    return responseJson({ ok: false, error: "Incorrect password." });
  }

  const actualRole = String(user["Role"]).trim().toLowerCase();
  if (actualRole !== requestedRole && email !== PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    return responseJson({
      ok: false,
      error: 'This is a ' + actualRole + ' account. Choose "' + capitalize(actualRole) + '" above.'
    });
  }

  const isApproved = String(user["Approved"]).trim().toUpperCase() === "TRUE";
  if (!isApproved && email !== PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    return responseJson({ ok: false, error: "Your account is waiting for admin approval." });
  }

  // Update Login timestamp
  if (matchedRowIdx > 0) {
    userSheet.getRange(matchedRowIdx, 10).setValue(Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd HH:mm"));
    const count = parseInt(user["Login Count"] || 0, 10) + 1;
    userSheet.getRange(matchedRowIdx, 11).setValue(count);
  }

  // Generate session token
  const token = Utilities.getUuid();

  // Return full data set on login
  const data = fetchAllTablesData(ss);

  return responseJson({
    ok: true,
    token: token,
    user: {
      id: user["User ID"],
      name: user["Name"],
      email: user["Email"],
      role: actualRole === "admin" ? "admin" : actualRole,
      jobRole: user["Job Role"] || "",
      approved: true
    },
    data: data
  });
}

// Handle Registration
function handleRegister(ss, body) {
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "").trim();
  const role = String(body.role || "employee").toLowerCase();
  const dept = String(body.dept || "Sales & Counselling").trim();
  const jobRole = String(body.jobRole || (role === "admin" ? "HS Admin" : role === "manager" ? "HS Manager" : "Sales Counsellor")).trim();
  const joined = String(body.joined || "").trim();
  const managerId = String(body.managerId || "").trim();

  if (!name || !email || !password) {
    return responseJson({ ok: false, error: "Fill in every field. The password needs at least 6 characters." });
  }

  const userSheet = getOrCreateSheet(ss, "Users", [
    "User ID", "Name", "Email", "Password", "Role", "Job Role", "Department", "Approved", "Created", "Last Login", "Login Count"
  ]);

  const users = sheetToObjects(userSheet);
  for (let i = 0; i < users.length; i++) {
    if (String(users[i]["Email"]).trim().toLowerCase() === email) {
      return responseJson({ ok: false, error: "An account with this email already exists." });
    }
  }

  const isEmp = role === "employee";
  const isPrimary = email === PRIMARY_ADMIN_EMAIL.toLowerCase();
  const prefix = isPrimary || role === "admin" ? "ADM" : role === "manager" ? "MGR" : "EMP";
  const nextId = prefix + String(users.length + 1).padStart(3, "0");
  const approved = isEmp || isPrimary ? "TRUE" : "FALSE";
  const nowStr = Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd HH:mm");

  userSheet.appendRow([
    nextId, name, email, password, role, jobRole, dept, approved, nowStr, "", 0
  ]);

  // If employee, add to Employees sheet
  if (isEmp) {
    const empSheet = getOrCreateSheet(ss, "Employees", [
      "Employee ID", "Name", "Email", "Department", "Role", "Joining Date", "Training Plan", "Status", "Manager ID", "Manager Name", "Last Login", "Login Count"
    ]);
    empSheet.appendRow([
      nextId, name, email, dept, jobRole, joined || nowStr.slice(0, 10), "Alliance Counsellor Training Plan", "Not Started", managerId, "", "", 0
    ]);
  }

  return responseJson({
    ok: true,
    id: nextId,
    role: role,
    approved: approved === "TRUE"
  });
}

// Fetch All Tables
function fetchAllTablesData(ss) {
  const tableNames = [
    "Colleges", "Campuses", "Courses", "Training Plans", "Training Modules", "Lessons",
    "Takeaways", "Questions", "Scenarios", "Users", "Employees", "Employee Progress",
    "Quiz Attempts", "Attendance", "Reviews", "Tasks", "Work Log", "Activity Log"
  ];

  const result = {};
  tableNames.forEach(t => {
    const s = ss.getSheetByName(t);
    result[t] = s ? sheetToObjects(s) : [];
  });
  return result;
}

// Handle Data Fetch
function handleDataFetch(ss, body) {
  return responseJson({
    ok: true,
    data: fetchAllTablesData(ss)
  });
}

// Handle Put Single Row
function handlePutRow(ss, body) {
  const tableName = body.table;
  const rowObj = body.row;
  if (!tableName || !rowObj) return responseJson({ ok: false, error: "Missing table or row data." });

  const sheet = ss.getSheetByName(tableName);
  if (!sheet) return responseJson({ ok: false, error: "Table does not exist: " + tableName });

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const rowValues = headers.map(h => rowObj[h] !== undefined ? rowObj[h] : "");

  // Check if primary key already exists (column 1)
  const pkColVals = sheet.getRange(1, 1, Math.max(1, sheet.getLastRow()), 1).getValues();
  let matchRow = -1;
  const targetPk = String(rowValues[0]);

  for (let i = 1; i < pkColVals.length; i++) {
    if (String(pkColVals[i][0]) === targetPk) {
      matchRow = i + 1;
      break;
    }
  }

  if (matchRow > 0) {
    sheet.getRange(matchRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return responseJson({ ok: true, status: "Saved" });
}

// Handle Put Many Rows
function handlePutManyRows(ss, body) {
  const tableName = body.table;
  const rows = body.rows || [];
  if (!tableName || !rows.length) return responseJson({ ok: false, error: "Missing table or rows." });

  const sheet = ss.getSheetByName(tableName);
  if (!sheet) return responseJson({ ok: false, error: "Table does not exist: " + tableName });

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const valuesToAppend = rows.map(r => headers.map(h => r[h] !== undefined ? r[h] : ""));

  if (valuesToAppend.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, valuesToAppend.length, headers.length).setValues(valuesToAppend);
  }

  return responseJson({ ok: true, count: valuesToAppend.length });
}

// Handle Replace Sub-set
function handleReplace(ss, body) {
  const tableName = body.table;
  const rows = body.rows || [];
  const where = body.where; // e.g. { col: 'Module ID', val: 'MOD01' }

  const sheet = ss.getSheetByName(tableName);
  if (!sheet) return responseJson({ ok: false, error: "Table does not exist: " + tableName });

  // Delete matching rows or clear data
  if (!where) {
    const lr = sheet.getLastRow();
    if (lr > 1) {
      sheet.getRange(2, 1, lr - 1, sheet.getLastColumn()).clearContent();
    }
  }

  // Insert new rows
  return handlePutManyRows(ss, body);
}

// Handle Approve / Reject User
function handleApprove(ss, body) {
  const id = body.id;
  const ok = body.ok === true || String(body.ok).toLowerCase() === "true";

  const userSheet = ss.getSheetByName("Users");
  if (!userSheet) return responseJson({ ok: false, error: "Users table not found." });

  const data = userSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      if (ok) {
        userSheet.getRange(i + 1, 8).setValue("TRUE");
      } else {
        userSheet.deleteRow(i + 1);
      }
      return responseJson({ ok: true });
    }
  }
  return responseJson({ ok: false, error: "User not found." });
}

// Handle Remove User
function handleRemoveUser(ss, body) {
  const id = body.id;
  const userSheet = ss.getSheetByName("Users");
  if (!userSheet) return responseJson({ ok: false, error: "Users table not found." });

  const data = userSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      userSheet.deleteRow(i + 1);
      return responseJson({ ok: true });
    }
  }
  return responseJson({ ok: false, error: "User not found." });
}

// Handle Log Activity
function handleLogActivity(ss, body) {
  const logSheet = getOrCreateSheet(ss, "Activity Log", [
    "Time", "User ID", "Name", "Email", "Role", "Event", "Details"
  ]);

  const now = Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
  logSheet.appendRow([
    now,
    body.userId || "",
    body.name || "",
    body.email || "",
    body.role || "",
    body.event || "Event",
    body.detail || ""
  ]);

  return responseJson({ ok: true });
}

function capitalize(s) {
  return String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);
}
