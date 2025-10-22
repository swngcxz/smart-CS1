# 🔴 Network Registration Denied - Fix Guide

## ⚠️ **Your Problem: Network Registration Denied (`+CREG: 2,3`)**

Your GSM module shows:
- ✅ **Connected** to COM12
- ✅ **Modem initialized**
- ✅ **SIM card ready** (`+CPIN: READY`)
- ✅ **Good signal** (18/31)
- ❌ **Network registration: DENIED** ← **This is the problem!**

**This is why SMS is not working!** Even though everything looks good, the network operator is refusing to register your SIM card.

## 🎯 **What This Means**

Network registration status `2,3` means:
- **2** = Unsolicited result code enabled
- **3** = Registration denied

Your SIM card is trying to connect to the network, but the network is **rejecting** it.

## 🔍 **Common Causes**

### 1. **Unregistered/Unactivated SIM** (Most Common)
- New SIM card not activated
- Prepaid SIM needs first-time activation
- Postpaid SIM not properly registered

### 2. **Expired SIM Card**
- Prepaid SIM with no load for extended period
- SIM automatically deactivated

### 3. **Network Issues**
- SIM locked to specific network
- Wrong network operator selected
- Roaming restrictions

### 4. **SIM Problem**
- Damaged SIM card
- Invalid SIM for the region
- Corporate/special SIM with restrictions

## ✅ **Solution Steps**

### **Step 1: Test SIM in Regular Phone** (REQUIRED)

1. **Remove SIM** from GSM module
2. **Insert into** regular phone
3. **Check if** phone connects to network
4. **Try sending** an SMS from the phone
5. **If it works** in phone, problem is with GSM module settings
6. **If it doesn't work**, SIM needs activation

### **Step 2: Activate/Register SIM** (If needed)

#### For Globe (Philippines):
```
Text: ACTIVATE
Send to: 8080
```

#### For Smart (Philippines):
```
Text: START
Send to: 211
```

#### For Sun/DITO:
```
Text: ACTIVATE
Send to: 2474
```

Or call customer service to activate.

### **Step 3: Load Credits** (For Prepaid)

Ensure SIM has sufficient credits:
- Minimum ₱20 load recommended
- SMS costs ₱1-5 per message

### **Step 4: Try Network Registration Fix**

Run this script to attempt automatic registration:

```bash
node fix-network-registration.js
```

This will:
- Check current status
- Search for networks
- Attempt automatic registration
- Verify connection

### **Step 5: Manual Network Selection**

If automatic doesn't work:

```javascript
// Try these AT commands manually:
AT+COPS=? // List available networks (takes 30-60 seconds)
AT+COPS=0 // Set to automatic
AT+COPS=1,2,"51502" // Force Smart (Philippines)
AT+COPS=1,2,"51501" // Force Globe (Philippines)
```

## 🧪 **Testing Process**

### **Test 1: Verify SIM Works**
```bash
# Put SIM in phone
# Send SMS to another phone
# Receive SMS
# If OK → SIM is activated
```

### **Test 2: Check GSM Module**
```bash
node check-smsc.js
# Look for: +CREG: 2,1 or +CREG: 2,5 (both are good)
# Avoid: +CREG: 2,3 (denied) or +CREG: 2,0 (not registered)
```

### **Test 3: Force Registration**
```bash
node fix-network-registration.js
# Wait for "Registered on home network"
```

### **Test 4: Send SMS**
```bash
# After successful registration:
node test-direct-sms.js
```

## 📋 **Expected Results**

### **Working Registration:**
```
+CREG: 2,1  ← Home network (GOOD)
+CREG: 2,5  ← Roaming (GOOD)
```

### **Not Working:**
```
+CREG: 2,3  ← Denied (BAD - your current status)
+CREG: 2,0  ← Not registered (BAD)
+CREG: 2,2  ← Still searching (WAIT)
```

## 🚨 **If Still Not Working**

### **Hardware Checks:**
1. **Antenna** - Ensure GSM module antenna is connected
2. **SIM orientation** - Check SIM is inserted correctly
3. **SIM contacts** - Clean SIM card contacts
4. **Power** - Ensure GSM module has sufficient power

### **Network Checks:**
1. **Coverage** - Verify network coverage in your area
2. **Operator** - Check which operator your SIM uses
3. **Restrictions** - Some SIMs restricted to certain devices

### **Alternative Solutions:**
1. **Try different SIM** from same operator
2. **Try different operator** SIM card
3. **Contact operator** to check SIM status
4. **Request new SIM** if old one is damaged

## 💡 **Quick Fix Checklist**

- [ ] SIM works in regular phone
- [ ] SIM has credits (₱20+)
- [ ] SIM is activated/registered
- [ ] Network coverage in area
- [ ] GSM antenna connected
- [ ] Ran `fix-network-registration.js`
- [ ] Status shows `2,1` or `2,5`
- [ ] Can send SMS from GSM module

## 📞 **Philippines Network Operators**

### Globe:
- Customer Service: 211
- Load inquiry: *143#
- SMSC: +639180000101

### Smart:
- Customer Service: 888
- Load inquiry: *121#
- SMSC: +639189001211

### DITO/Sun:
- Customer Service: 2474
- Load inquiry: *123#
- SMSC: +639209300000

## 🎯 **Next Steps**

1. **Remove SIM** from GSM module
2. **Test in phone** - Can it send SMS?
3. **If yes**: Run `fix-network-registration.js`
4. **If no**: Activate/load SIM first
5. **Once registered**: Test SMS with `test-direct-sms.js`

---

**The key issue: Your SIM is not registered on the network. This MUST be fixed before SMS will work!**
