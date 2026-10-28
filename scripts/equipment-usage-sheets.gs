/**
 * Idempotent Apps Script endpoint for Firebase equipment and inventory synchronization.
 * Configure Script Properties: SPREADSHEET_ID and SYNC_SECRET, then deploy as
 * a Web App that executes as the spreadsheet owner.
 */
function doPost(event) {
  var lock = LockService.getScriptLock();
  try {
    var properties = PropertiesService.getScriptProperties();
    var expectedSecret = properties.getProperty("SYNC_SECRET");
    var spreadsheetId = properties.getProperty("SPREADSHEET_ID");
    var request = JSON.parse(event.postData.contents || "{}");
    if (!expectedSecret || request.secret !== expectedSecret) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }
    if (!spreadsheetId) return jsonResponse({ ok: false, error: "Spreadsheet is not configured" });
    if (!lock.tryLock(10000)) return jsonResponse({ ok: false, error: "Busy; retry the request" });

    if (request.inventory) {
      var inventorySpreadsheetId = properties.getProperty("INVENTORY_SPREADSHEET_ID") || spreadsheetId;
      return syncInventoryToSheet_(SpreadsheetApp.openById(inventorySpreadsheetId), request.inventory);
    }
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    if (!request.usage || !request.usage.usageId) return jsonResponse({ ok: false, error: "Invalid usage record" });
    var sheet = spreadsheet.getSheetByName("Equipment Usage") || spreadsheet.insertSheet("Equipment Usage");
    var headers = [
      "Usage ID", "Use number", "Student name", "Student UID", "Project name", "Project ID",
      "Equipment", "Equipment ID", "Status", "Started at (IST)", "Ended at (IST)",
      "Resolved by", "End reason", "Last synced at (IST)"
    ];
    if (sheet.getLastRow() === 0) sheet.appendRow(headers);
    else {
      sheet.getRange(1, 10, 1, 2).setValues([["Started at (IST)", "Ended at (IST)"]]);
      sheet.getRange(1, 14).setValue("Last synced at (IST)");
    }

    migrateExistingTimestampsToIst_(sheet, properties);

    var usage = request.usage;
    var row = [
      usage.usageId,
      usage.usageNumber || "",
      usage.userName || "",
      usage.userUid || "",
      usage.projectTitle || "",
      usage.projectId || "",
      usage.equipmentName || "",
      usage.equipmentId || "",
      usage.status || "ACTIVE",
      formatTimestampAsIst_(usage.startedAt),
      formatTimestampAsIst_(usage.endedAt),
      usage.endedByEmail || "",
      usage.endReason || "",
      formatTimestampAsIst_(new Date())
    ];

    var existingRow = 0;
    if (sheet.getLastRow() > 1) {
      var matches = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1)
        .createTextFinder(String(usage.usageId))
        .matchEntireCell(true)
        .findNext();
      if (matches) existingRow = matches.getRow();
    }
    if (existingRow) sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    else sheet.appendRow(row);

    return jsonResponse({ ok: true, usageId: usage.usageId, version: request.version || 0 });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message || "Sync failed") });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function syncInventoryToSheet_(spreadsheet, payload) {
  if (!payload || !payload.record || !payload.record.itemId && payload.kind === "item" || !payload.record.loanId && payload.kind === "loan") {
    return jsonResponse({ ok: false, error: "Invalid inventory record" });
  }
  var kind = payload.kind;
  if (kind !== "loan" && kind !== "item") return jsonResponse({ ok: false, error: "Invalid inventory record type" });
  var isLoan = kind === "loan";
  var sheetName = isLoan ? "Inventory Borrowing" : "Inventory Stock";
  var sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
  var headers = isLoan ? [
    "Request ID", "Request status", "Student name", "University email", "Student UID",
    "Project name", "Project ID", "Item name", "Item ID", "Category", "Quantity",
    "Requested at (IST)", "Approved at (IST)", "Approved by", "Returned at (IST)",
    "Return recorded by", "Last synced at (IST)", "Version"
  ] : [
    "Item ID", "Item name", "Category", "Total quantity", "Available quantity",
    "Availability", "Source sheet", "Source row", "Last updated at (IST)", "Version"
  ];
  if (sheet.getLastRow() === 0) sheet.appendRow(headers);
  var record = payload.record;
  var id = isLoan ? record.loanId : record.itemId;
  var version = Number(payload.version) || 0;
  var lastColumn = headers.length;
  var versionColumn = lastColumn;
  var existingRow = 0;
  var duplicates = [];
  if (sheet.getLastRow() > 1) {
    var matches = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1)
      .createTextFinder(String(id)).matchEntireCell(true).findAll();
    if (matches.length) {
      existingRow = matches[0].getRow();
      for (var m = 1; m < matches.length; m++) duplicates.push(matches[m].getRow());
    }
  }
  if (existingRow) {
    var currentVersion = Number(sheet.getRange(existingRow, versionColumn).getValue()) || 0;
    if (currentVersion > version) return jsonResponse({ ok: true, id: id, version: version, stale: true });
  }

  var row;
  if (isLoan) {
    row = [
      record.loanId || "", record.status || "REQUESTED", record.userName || "", record.userEmail || "",
      record.userUid || "", record.projectTitle || "", record.projectId || "", record.itemName || "",
      record.itemId || "", record.category || "", record.quantity || 0,
      formatTimestampAsIst_(record.requestedAt), formatTimestampAsIst_(record.approvedAt),
      record.approvedByEmail || "", formatTimestampAsIst_(record.returnedAt),
      record.returnedByEmail || "", formatTimestampAsIst_(new Date()), version
    ];
  } else {
    var availability = record.borrowable !== true ? "LAB USE ONLY"
      : record.stockNeedsReview === true ? "STOCK CHECK REQUIRED"
      : Number(record.availableQuantity) > 0 ? "AVAILABLE" : "OUT OF STOCK";
    row = [
      record.itemId || "", record.name || "", record.category || "", Number(record.totalQuantity) || 0,
      Number(record.availableQuantity) || 0, availability, record.sourceSheet || "", record.sourceRow || "",
      formatTimestampAsIst_(new Date()), version
    ];
  }
  if (existingRow) sheet.getRange(existingRow, 1, 1, lastColumn).setValues([row]);
  else sheet.appendRow(row);
  duplicates.sort(function(a, b) { return b - a; }).forEach(function(rowNumber) { sheet.deleteRow(rowNumber); });
  return jsonResponse({ ok: true, id: id, version: version });
}

function migrateExistingTimestampsToIst_(sheet, properties) {
  var migrationKey = "IST_TIMESTAMPS_MIGRATED_V1";
  if (properties.getProperty(migrationKey) === "true") return;

  var rowCount = sheet.getLastRow() - 1;
  if (rowCount > 0) {
    [10, 11, 14].forEach(function(column) {
      var range = sheet.getRange(2, column, rowCount, 1);
      var values = range.getValues();
      var converted = values.map(function(row) {
        return [formatTimestampAsIst_(row[0])];
      });
      range.setValues(converted);
    });
  }
  properties.setProperty(migrationKey, "true");
}

function formatTimestampAsIst_(value) {
  if (!value) return "";
  if (typeof value === "string" && / IST$/.test(value)) return value;
  var date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return value;
  return Utilities.formatDate(date, "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss 'IST'");
}

function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
