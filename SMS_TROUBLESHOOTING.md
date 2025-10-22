# 📱 SMS Troubleshooting Guide

## Your Current Status: ✅ GSM Module Connected!

From the test output, your GSM module **IS** connected and working:
- ✅ **Port opened successfully** on COM12
- ✅ **Modem initialized successfully**
- ✅ **SIM card is READY** (`+CPIN: READY`)
- ✅ **Signal strength: 17/31** (Good signal!)

## 🔍 Why You're Not Receiving SMS

Since your GSM module is connected and initialized, here are the most likely reasons:

### 1. **Phone Number Format Issue** ⚠️
The most common problem! Check if your phone number is formatted correctly.

**Correct formats:**
- International: `+639123456789` (Philippines)
- Local: `09123456789`

**System will auto-convert:**
- `09123456789` → `+639123456789`
- `9123456789` → `+639123456789`

**❌ Wrong formats:**
- Missing country code
- Extra spaces or dashes
- Country code without +

### 2. **SIM Card Issues** 💳

Even though SIM shows "READY", check:
- ✓ **Has credit/load** - Send SMS costs money!
- ✓ **Is registered** - Unregistered SIMs can't send SMS
- ✓ **SMS service enabled** - Some SIMs have SMS blocked
- ✓ **Not expired** - Old prepaid SIMs may be deactivated

### 3. **Network Registration** 📶

Your module might be connected but not registered to network:

```javascript
// Check network registration status
AT+CREG? // Should return: +CREG: 0,1 or +CREG: 0,5
```

### 4. **SMS Center Number** 📞

GSM module needs SMS Center (SMSC) number configured:

```javascript
// Check SMSC number
AT+CSCA? // Should return: +CSCA: "+639180000101",145 (Globe)
                        // or +CSCA: "+639189001211",145 (Smart)
```

**Philippines SMSC Numbers:**
- **Globe**: `+639180000101`
- **Smart**: `+639189001211`
- **Sun**: `+639209300000`

## 🧪 **Step-by-Step Testing**

### **Option 1: Use the Direct Test Script**

1. **Edit the test file:**
   ```bash
   # Open test-direct-sms.js and change line 8:
   const TEST_PHONE_NUMBER = '+639XXXXXXXXX'; // Your actual number
   ```

2. **Run the test:**
   ```bash
   node test-direct-sms.js
   ```

This will give you detailed step-by-step feedback!

### **Option 2: Test via Dashboard**

1. **Start the dashboard:**
   ```bash
   start-gsm-test.bat
   ```

2. **Check status indicators** - Should all be green

3. **Enter your phone number** in correct format

4. **Send test SMS** and watch the logs

### **Option 3: Manual AT Commands**

If you want to test manually, create this script:

```javascript
// test-manual-sms.js
const gsmService = require('./server/services/gsmService');

async function manualTest() {
    await gsmService.initialize();
    await new Promise(r => setTimeout(r, 5000));
    
    // Check network registration
    gsmService.modem.executeCommand('AT+CREG?', (r) => {
        console.log('Network:', r);
    });
    
    // Check SMSC
    gsmService.modem.executeCommand('AT+CSCA?', (r) => {
        console.log('SMSC:', r);
    });
    
    // Your phone number
    const phone = '+639XXXXXXXXX'; // CHANGE THIS
    const msg = 'Test from Smart Bin';
    
    console.log('Sending SMS...');
    gsmService.modem.sendSMS(phone, msg, true, (result) => {
        console.log('Result:', result);
        process.exit(0);
    });
}

manualTest();
```

## 🔧 **Common Fixes**

### **Fix 1: Set SMSC Number**

If SMSC is not set or wrong:

```javascript
// In gsmService.js constructor, add:
this.options = {
    // ... existing options
    customInitCommand: 'AT+CSCA="+639180000101",145', // For Globe
    // or
    // customInitCommand: 'AT+CSCA="+639189001211",145', // For Smart
};
```

### **Fix 2: Wait Longer**

SMS sending can take 10-30 seconds. Make sure you're waiting long enough:

```javascript
// The dashboard should show "Sending..." during this time
// Don't close or refresh while sending!
```

### **Fix 3: Check Timeout**

Increase timeout in gsmService.js if needed:

```javascript
this.modem.sendSMS(phoneNumber, message, true, (result) => {
    // This callback might take 10-30 seconds
}, 30000); // 30 second timeout
```

### **Fix 4: Test with Different Number**

Try sending to a different phone number to rule out recipient issues.

## 📊 **Diagnostic Commands**

Run these to get more info:

```bash
# Check full status
node test-gsm-sms.js

# Check just connection
node -e "const g=require('./server/services/gsmService'); g.initialize().then(()=>{setTimeout(()=>{console.log(g.getStatus());process.exit()},5000)})"
```

## 🎯 **Quick Checklist**

Before sending SMS, verify:

- [ ] GSM module connected to COM12
- [ ] SIM card inserted and has credit
- [ ] Signal strength > 5 (you have 17, so ✅)
- [ ] SIM status shows "ready" (you have this ✅)
- [ ] Phone number in correct format (+639XXXXXXXXX)
- [ ] SMSC number configured for your network
- [ ] Network registration successful
- [ ] Wait 10-30 seconds for sending
- [ ] Check phone for SMS

## 🚨 **If Still Not Working**

1. **Test with SMS manually** - Use your phone to send SMS from the SIM card
2. **Check SIM in phone** - Put SIM in phone and verify it can send SMS
3. **Try different SIM** - Test with another SIM card
4. **Check network** - Verify network coverage in your area
5. **Restart GSM module** - Unplug and replug GSM module

## 📝 **Logs to Check**

Look in the dashboard logs for:
- ❌ `SMS sending failed` - Check error message
- ⚠️ `Message length exceeds` - Shorten message
- ❌ `GSM module not initialized` - Wait longer
- ❌ `Phone number invalid` - Check format

## 💡 **Pro Tips**

1. **Test with short message first** - "Test" instead of long message
2. **Use local number** - 09XXXXXXXXX is easier
3. **Check SIM credit** - Most common issue!
4. **Verify SMSC** - Wrong SMSC = no SMS
5. **Be patient** - SMS takes time, wait at least 30 seconds

---

## 🎯 **Next Steps**

1. **Edit and run** `test-direct-sms.js` with your actual phone number
2. **Check** the detailed output
3. **Verify** SMSC number if needed
4. **Wait** 30 seconds after clicking send
5. **Check** your phone

If you're still having issues after trying these steps, share the output from `test-direct-sms.js` for more specific help!
