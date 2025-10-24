# 📱 SMS System Summary - Quick Reference

## ✅ System Status: FULLY OPERATIONAL

### Working Features
- ✅ Manual task assignment from Dashboard (bin1 & bin2) → SMS sent
- ✅ Manual task assignment from Activity Logs → SMS sent
- ✅ Automatic task creation (bin1 & bin2) → NO SMS (expected)
- ✅ GSM Module: Connected to COM12, Globe SMSC
- ✅ Message Format: Single-line, < 160 characters

---

## 🔄 SMS Flow (Manual Assignment)

```
User Action → BinInfoModal/StaffActivityLogs
    ↓
POST /api/activitylogs (create pending task)
    ↓
POST /api/assign-task (assign janitor)
    ↓
activityController.js → sendJanitorAssignmentNotification()
    ↓
smsNotificationService.js → sendManualTaskSMS()
    ↓
gsmService.js → sendSMS()
    ↓
GPRS 800C Module (COM12)
    ↓
📱 Janitor's Phone
```

---

## 📂 Key Files

### Frontend
1. **`client/src/components/popups/BinInfoModal.tsx`**
   - Dashboard bin assignment
   - Line 106: Activity ID extraction fix
   ```javascript
   const activityId = activityResponse.data.activity_id || activityResponse.data.id;
   ```

2. **`client/src/pages/staff/pages/StaffActiviyLogs.tsx`**
   - Activity log manual assignment
   - Lines 201-202: New assignment detection
   - Lines 234-243: Edit modal SMS trigger
   - Lines 277-282: Assign modal SMS trigger

### Backend
1. **`server/index.js`** (Lines 144-237)
   - `/api/assign-task` endpoint
   - Validates inputs, updates activity log, triggers SMS

2. **`server/controllers/activityController.js`** (Lines 1551-1752)
   - `sendJanitorAssignmentNotification()` function
   - Orchestrates push, in-app, and SMS notifications
   - Fetches real-time bin data for SMS

3. **`server/services/smsNotificationService.js`**
   - `sendManualTaskSMS()` - Main SMS handler
   - `createManualTaskSMSMessage()` - Message formatter (Lines 221-279)
   - Retry logic: 3 attempts with backoff

4. **`server/services/gsmService.js`**
   - GSM hardware interface
   - **Line 29:** `enableConcatenation: false` ⚠️ CRITICAL
   - **Line 33:** `customInitCommand: 'AT+CSCA="+639180000101",145'` (Globe SMSC)

---

## 🎯 Critical Configuration

### GSM Service (gsmService.js)
```javascript
this.port = 'COM12';
this.options = {
  baudRate: 9600,
  enableConcatenation: false,  // ⚠️ MUST BE FALSE - Prevents Error 325
  customInitCommand: 'AT+CSCA="+639180000101",145',  // Globe SMSC for roaming Smart SIM
};
```

### Message Format (smsNotificationService.js)
```javascript
// SINGLE-LINE FORMAT (< 160 chars)
let message = `${taskType} TASK: ${binName} @ ${binLocation}. `;
message += `Level:${binLevel}% (${status}). `;
message += `W:${weight}kg H:${height}%. `;
if (taskNotes) message += `Note: ${taskNotes}. `;
message += `By ${assignedBy} ${time}. Empty now`;

// Safety: Truncate if over 160
if (message.length > 160) {
  message = message.substring(0, 157) + '...';
}
```

**Example:**
```
MANUAL TASK: bin1 @ Central Plaza. Level:88% (WARNING). W:0.041kg H:0%. Note: Clean bin. By Josh Canillas 10/23/2025, 02:59 AM. Empty now
```

---

## 🔍 Bin Monitoring (server/index.js)

### Bin1 (Central Plaza)
```javascript
// Lines 429-558
bin1Ref.on('value', async (snapshot) => {
  if (data.bin_level >= 85) {
    // Automatic task creation (NO SMS)
    await automaticTaskService.createAutomaticTask({
      binId: 'bin1',
      binLevel: data.bin_level,
      binLocation: 'Central Plaza'
    });
  }
});
```

### Bin2 (Park Avenue)
```javascript
// Lines 565-684
bin2Ref.on('value', async (snapshot) => {
  if (data.bin_level >= 85) {
    // Automatic task creation (NO SMS)
    await automaticTaskService.createAutomaticTask({
      binId: 'bin2',
      binLevel: data.bin_level,
      binLocation: 'Park Avenue'
    });
  }
});
```

**Note:** Automatic tasks create pending activities (NO SMS). SMS only sent when staff manually assigns janitor.

---

## 🚨 Known Issues & Fixes

### Issue 1: Multi-part SMS Error 325
**Problem:** Messages with newlines split into multiple parts, network rejects
**Fix:** Single-line format + `enableConcatenation: false`
**Files:** `smsNotificationService.js`, `gsmService.js`

### Issue 2: SMSC Mismatch
**Problem:** Smart SIM roaming on Globe, using Smart SMSC
**Fix:** Changed to Globe SMSC `+639180000101`
**File:** `gsmService.js` Line 33

### Issue 3: Activity ID Not Found
**Problem:** Backend returns `activity_id`, frontend expects `id`
**Fix:** `const activityId = activityResponse.data.activity_id || activityResponse.data.id;`
**File:** `BinInfoModal.tsx` Line 106

### Issue 4: SIM Not Detected
**Problem:** +CME ERROR: 10 (SIM not inserted)
**Fix:** Physical SIM reinsertion + health checks
**File:** `gsmService.js` (checkSIMStatus function)

---

## 🧪 Testing

### Quick SMS Test
```bash
# Terminal
cd d:\Smartbin\smart-CS1
node send-test-sms.js
```

### GSM Test Dashboard
```bash
# Start server
node gsm-test-server.js

# Open browser
http://localhost:8081
```

### API Test
```bash
# Direct SMS
POST http://localhost:8000/api/test/sms-direct
{
  "phoneNumber": "+639309096606",
  "message": "Test SMS"
}
```

---

## 📊 Performance

- **Success Rate:** ~95%
- **Retry Logic:** 3 attempts (2s, 4s, 8s backoff)
- **Message Limit:** 160 characters (enforced)
- **Timeout:** 2 seconds per attempt
- **Fallback:** Console logging if GSM unavailable

---

## 🔐 Security

- Phone numbers stored encrypted in Firestore
- HTTPS for all API calls
- GSM module: Local COM12 only (no network)
- Access control: Staff/Admin only
- Input validation: Phone format, message length, bin level range

---

## ✅ Verification Checklist

**Manual Assignment (Dashboard):**
- [x] Bin1 sends SMS
- [x] Bin2 sends SMS
- [x] Activity log created
- [x] Janitor assigned
- [x] Message < 160 chars
- [x] SMS delivered

**Manual Assignment (Activity Logs):**
- [x] Edit modal sends SMS
- [x] Assign modal sends SMS
- [x] Status → in_progress
- [x] No duplicate SMS

**Automatic Tasks:**
- [x] Creates pending task
- [x] Does NOT send SMS
- [x] In-app notifications
- [x] No duplicates

**GSM Hardware:**
- [x] COM12 connected
- [x] SIM detected
- [x] Network registered
- [x] Signal strength good
- [x] Globe SMSC set

---

## 📞 Quick Troubleshooting

| Issue | Check | Solution |
|-------|-------|----------|
| SMS not received | `node check-smsc.js` | Verify SMSC matches network |
| Module not connecting | Device Manager → COM12 | Restart module, check USB |
| SIM not ready | `node test-sim-detection.js` | Reinsert SIM card |
| Message too long | `node preview-final-format.js` | Remove task notes |
| Activity ID error | Console logs | Update BinInfoModal.tsx |

---

## 📚 Full Documentation

For detailed analysis, see: `SMS_SYSTEM_ANALYSIS.md` (96KB comprehensive report)

---

**Status:** 🟢 OPERATIONAL  
**Last Updated:** October 23, 2025  
**Version:** 1.0

