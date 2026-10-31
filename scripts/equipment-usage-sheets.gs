/**
 * Idempotent Apps Script endpoint for Firebase equipment and inventory synchronization.
 * Configure Script Properties: SPREADSHEET_ID and SYNC_SECRET. To enable the
 * admin machinery editor, also set MACHINERY_CATALOG_SPREADSHEET_ID. Deploy as
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

    if (request.machinery) {
      return updateMachineryCatalogRow_(properties, request.machinery);
    }
    if (request.inventoryCatalog) {
      return updateInventoryCatalogRow_(properties, request.inventoryCatalog);
    }
    if (request.inventoryCatalogCreate) {
      return createInventoryCatalogRow_(properties, request.inventoryCatalogCreate);
    }
    if (request.inventoryDelete) {
      var inventoryDeleteSpreadsheetId = properties.getProperty("INVENTORY_SPREADSHEET_ID") || spreadsheetId;
      return deleteInventorySheetRecord_(inventoryDeleteSpreadsheetId, request.inventoryDelete);
    }
    if (request.inventory) {
      var inventorySpreadsheetId = properties.getProperty("INVENTORY_SPREADSHEET_ID") || spreadsheetId;
      return syncInventoryToSheet_(SpreadsheetApp.openById(inventorySpreadsheetId), request.inventory);
    }
    if (request.usageDelete) {
      return deleteEquipmentUsageSheetRecord_(spreadsheetId, request.usageDelete);
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

function deleteInventorySheetRecord_(spreadsheetId, payload) {
  if (!payload || payload.kind !== "loan" || !/^[A-Za-z0-9_-]{1,128}$/.test(String(payload.id || ""))) {
    return jsonResponse({ ok: false, error: "Invalid inventory history record" });
  }
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheet = spreadsheet.getSheetByName("Inventory Borrowing");
  if (!sheet || sheet.getLastRow() < 2) return jsonResponse({ ok: true, deleted: false, id: payload.id });
  var ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues();
  var rows = [];
  ids.forEach(function(row, index) {
    if (String(row[0]) === String(payload.id)) rows.push(index + 2);
  });
  rows.sort(function(a, b) { return b - a; }).forEach(function(rowNumber) { sheet.deleteRow(rowNumber); });
  SpreadsheetApp.flush();
  return jsonResponse({ ok: true, deleted: rows.length > 0, id: payload.id });
}

function deleteEquipmentUsageSheetRecord_(spreadsheetId, payload) {
  if (!payload || !/^[A-Za-z0-9_-]{1,128}$/.test(String(payload.usageId || ""))) {
    return jsonResponse({ ok: false, error: "Invalid equipment usage record" });
  }
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheet = spreadsheet.getSheetByName("Equipment Usage");
  if (!sheet || sheet.getLastRow() < 2) return jsonResponse({ ok: true, deleted: false, id: payload.usageId });
  var ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues();
  var rows = [];
  ids.forEach(function(row, index) {
    if (String(row[0]) === String(payload.usageId)) rows.push(index + 2);
  });
  rows.sort(function(a, b) { return b - a; }).forEach(function(rowNumber) { sheet.deleteRow(rowNumber); });
  SpreadsheetApp.flush();
  return jsonResponse({ ok: true, deleted: rows.length > 0, id: payload.usageId });
}

/** Updates one existing row in the machinery source workbook. The Next.js
 * server action authenticates the human administrator before calling here. */
function updateMachineryCatalogRow_(properties, payload) {
  var spreadsheetId = properties.getProperty("MACHINERY_CATALOG_SPREADSHEET_ID");
  if (!spreadsheetId) return jsonResponse({ ok: false, error: "Machinery catalog spreadsheet is not configured" });
  var rowNumber = Number(payload.sourceRow);
  var srNo = Number(payload.srNo);
  var fields = payload.fields || {};
  if (!Number.isInteger(rowNumber) || rowNumber < 4 || !Number.isInteger(srNo) || srNo < 1) {
    return jsonResponse({ ok: false, error: "Invalid machinery row identifier" });
  }
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheet = spreadsheet.getSheetById(1308933560) || spreadsheet.getSheets()[0];
  if (rowNumber > sheet.getLastRow() || Number(sheet.getRange(rowNumber, 2).getValue()) !== srNo) {
    return jsonResponse({ ok: false, error: "Machinery source row changed; refresh and retry" });
  }
  var requiredText = ["name", "manufacturer", "model", "detailsUrl", "type", "description", "currentStatus", "maintenancePartner", "contact"];
  for (var i = 0; i < requiredText.length; i++) {
    var field = requiredText[i];
    if (!isSafeSheetText_(fields[field], 1000)) {
      return jsonResponse({ ok: false, error: "Invalid machinery field: " + field });
    }
  }
  if (!fields.name.trim() || !Number.isInteger(Number(fields.quantity)) || Number(fields.quantity) < 0 || Number(fields.quantity) > 10000) {
    return jsonResponse({ ok: false, error: "Machine name and quantity are required and must be valid" });
  }
  if (fields.detailsUrl && !/^https:\/\//i.test(fields.detailsUrl)) {
    return jsonResponse({ ok: false, error: "Machine details link must use HTTPS" });
  }
  var row = [[
    srNo, fields.name.trim(), fields.manufacturer.trim(), fields.model.trim(), fields.detailsUrl.trim(),
    fields.type.trim(), Number(fields.quantity), fields.description.trim(), fields.currentStatus.trim(),
    fields.maintenancePartner.trim(), fields.contact.trim()
  ]];
  sheet.getRange(rowNumber, 2, 1, row[0].length).setValues(row);
  SpreadsheetApp.flush();
  return jsonResponse({ ok: true, srNo: srNo, sourceRow: rowNumber });
}

function updateInventoryCatalogRow_(properties, payload) {
  var spreadsheetId = properties.getProperty("INVENTORY_CATALOG_SPREADSHEET_ID");
  if (!spreadsheetId) return jsonResponse({ ok: false, error: "Inventory catalog spreadsheet is not configured" });
  var sheetConfig = {
    "Power tools": { gid: 0, nameColumn: 3, referenceColumn: 2, descriptionColumn: 5, urlColumn: 8 },
    "Power tools Consumables": { gid: 1994125015, nameColumn: 5, referenceColumn: 2, urlColumn: 8 },
    "Macheneries": { gid: 1308933560, nameColumn: 3, referenceColumn: 2, descriptionColumn: 9, urlColumn: 6 },
    "Electrical and Electronics": { gid: 1112580146, nameColumn: 3, referenceColumn: 2, descriptionColumn: 7, urlColumn: 9 },
    "Electrical and Electronics Comp": { gid: 546701528, nameColumn: 2, referenceColumn: 1, descriptionColumn: 4 },
    "Hand tool 2.0": { gid: 856206127, nameColumn: 3, referenceColumn: 2, descriptionColumn: 6, urlColumn: 9 },
    "Measurement Tools": { gid: 58606889, nameColumn: 3, referenceColumn: 2, descriptionColumn: 6, urlColumn: 9 },
    "Safety Equipment": { gid: 56245970, nameColumn: 3, referenceColumn: 2, descriptionColumn: 9, urlColumn: 8 }
  };
  var config = sheetConfig[payload.sourceSheet];
  var rowNumber = Number(payload.sourceRow);
  if (!config || !Number.isInteger(rowNumber) || rowNumber < 2 || typeof payload.name !== "string" || !payload.name.trim()) {
    return jsonResponse({ ok: false, error: "Invalid inventory source row" });
  }
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheet = spreadsheet.getSheetById(config.gid);
  if (!sheet || rowNumber > sheet.getLastRow()) return jsonResponse({ ok: false, error: "Inventory source row not found" });
  var currentName = String(sheet.getRange(rowNumber, config.nameColumn).getDisplayValue() || "").trim();
  var currentReference = String(sheet.getRange(rowNumber, config.referenceColumn).getDisplayValue() || "").trim();
  if (currentName !== payload.name.trim() || currentReference !== String(payload.sourceReference || "").trim()) {
    return jsonResponse({ ok: false, error: "Inventory source row changed; refresh and retry" });
  }
  if (payload.description !== undefined) {
    if (!config.descriptionColumn || !isSafeSheetText_(payload.description, 1000)) {
      return jsonResponse({ ok: false, error: "Description cannot be edited for this inventory category" });
    }
    sheet.getRange(rowNumber, config.descriptionColumn).setValue(payload.description.trim());
  }
  if (payload.detailsUrl !== undefined) {
    if (!config.urlColumn || !isSafeSheetText_(payload.detailsUrl, 500)
      || payload.detailsUrl && !/^https:\/\//i.test(payload.detailsUrl)) {
      return jsonResponse({ ok: false, error: "Product link cannot be edited for this inventory category" });
    }
    sheet.getRange(rowNumber, config.urlColumn).setValue(payload.detailsUrl.trim());
  }
  SpreadsheetApp.flush();
  return jsonResponse({ ok: true, sourceSheet: payload.sourceSheet, sourceRow: rowNumber });
}

function isSafeSheetText_(value, maximum) {
  return typeof value === "string" && value.length <= maximum && !/^[=+\-@\t\r]/.test(value);
}

function createInventoryCatalogRow_(properties, payload) {
  var spreadsheetId = properties.getProperty("INVENTORY_CATALOG_SPREADSHEET_ID");
  if (!spreadsheetId) return jsonResponse({ ok: false, error: "Inventory catalog spreadsheet is not configured" });
  var configs = {
    "Power tools": { gid: 0, startRow: 4, ref: 2, name: 3, quantity: 4, description: 5, model: 7, url: 8, status: 11, issued: 12, width: 12 },
    "Power tools Consumables": { gid: 1994125015, startRow: 5, ref: 2, name: 5, purpose: 3, model: 4, description: 7, url: 8, width: 8, review: true },
    "Electrical and Electronics": { gid: 1112580146, startRow: 5, ref: 2, name: 3, out: 4, quantity: 5, model: 6, description: 7, url: 9, status: 11, width: 11 },
    "Electrical and Electronics Comp": { gid: 546701528, startRow: 2, ref: 1, name: 2, quantity: 3, description: 4, model: 5, width: 5 },
    "Hand tool 2.0": { gid: 856206127, startRow: 7, ref: 2, name: 3, out: 4, quantity: 5, description: 6, model: 8, url: 9, status: 10, width: 10 },
    "Measurement Tools": { gid: 58606889, startRow: 3, ref: 2, name: 3, out: 4, quantity: 5, description: 6, model: 8, url: 9, status: 10, width: 10 },
    "Safety Equipment": { gid: 56245970, startRow: 3, ref: 2, name: 3, out: 4, quantity: 5, model: 7, url: 8, description: 9, status: 10, width: 10 }
  };
  var config = configs[payload.sourceSheet];
  var fields = payload.fields || {};
  if (!config || !isSafeSheetText_(fields.name, 160) || !fields.name.trim()
    || !isSafeSheetText_(fields.description || "", 1000)
    || !isSafeSheetText_(fields.model || "", 160)
    || !isSafeSheetText_(fields.detailsUrl || "", 500)
    || fields.detailsUrl && !/^https:\/\//i.test(fields.detailsUrl)
    || !Number.isInteger(Number(fields.quantity)) || Number(fields.quantity) < 0 || Number(fields.quantity) > 10000) {
    return jsonResponse({ ok: false, error: "Invalid inventory item details" });
  }
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var sheet = spreadsheet.getSheetById(config.gid);
  if (!sheet) return jsonResponse({ ok: false, error: "Inventory source sheet not found" });
  var lastRow = sheet.getLastRow();
  var firstRow = config.startRow;
  var existingNames = lastRow >= firstRow
    ? sheet.getRange(firstRow, config.name, lastRow - firstRow + 1, 1).getDisplayValues()
    : [];
  var existingModels = config.model && lastRow >= firstRow
    ? sheet.getRange(firstRow, config.model, lastRow - firstRow + 1, 1).getDisplayValues()
    : [];
  for (var index = 0; index < existingNames.length; index++) {
    var sameName = String(existingNames[index][0] || "").trim().toLowerCase() === fields.name.trim().toLowerCase();
    var sameModel = !config.model || String(existingModels[index][0] || "").trim().toLowerCase() === String(fields.model || "").trim().toLowerCase();
    if (sameName && sameModel) return jsonResponse({ ok: false, error: "An item with this name and model already exists in that category. Edit its stock instead." });
  }
  var sourceRow = Math.max(lastRow + 1, firstRow);
  var reference = sourceRow;
  if (config.ref !== 1 && lastRow >= firstRow) {
    var references = sheet.getRange(firstRow, config.ref, lastRow - firstRow + 1, 1).getValues();
    reference = references.reduce(function(maximum, row) {
      var value = Number(row[0]);
      return Number.isFinite(value) ? Math.max(maximum, value) : maximum;
    }, 0) + 1;
  }
  var row = Array(config.width).fill("");
  row[config.ref - 1] = reference;
  row[config.name - 1] = fields.name.trim();
  if (config.purpose) row[config.purpose - 1] = "General lab use";
  if (config.model) row[config.model - 1] = String(fields.model || "").trim();
  if (config.description) row[config.description - 1] = String(fields.description || "").trim();
  if (config.url) row[config.url - 1] = String(fields.detailsUrl || "").trim();
  if (config.quantity) row[config.quantity - 1] = config.out ? Number(fields.quantity) : Number(fields.quantity);
  if (config.out) row[config.out - 1] = 0;
  if (config.status) row[config.status - 1] = config.review ? "Stock count required" : "In Work";
  if (config.issued) row[config.issued - 1] = 0;
  sheet.getRange(sourceRow, 1, 1, config.width).setValues([row]);
  SpreadsheetApp.flush();
  return jsonResponse({ ok: true, sourceSheet: payload.sourceSheet, sourceRow: sourceRow, sourceReference: reference, stockNeedsReview: Boolean(config.review) });
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
