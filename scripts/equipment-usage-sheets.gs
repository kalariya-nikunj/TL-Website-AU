/**
 * Idempotent Apps Script endpoint for Firebase equipment usage synchronization.
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
    if (!spreadsheetId || !request.usage || !request.usage.usageId) {
      return jsonResponse({ ok: false, error: "Invalid configuration or usage record" });
    }
    if (!lock.tryLock(10000)) return jsonResponse({ ok: false, error: "Busy; retry the request" });

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
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
