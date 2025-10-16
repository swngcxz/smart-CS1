// models/userInfoModel.js
const { db, admin } = require("./firebase");
const withRetry = require('../utils/retryHandler');

const UserInfoModel = {
  // Create user info record
  async createUserInfo(userId, userInfoData) {
    try {
      const userInfoRef = await withRetry(() => 
        db.collection('userInfo').doc(userId).set({
          ...userInfoData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })
      );
      return userId; // Return the document ID (same as userId)
    } catch (error) {
      console.error('[USER INFO MODEL] Error creating user info:', error);
      throw new Error(`Failed to create user info: ${error.message}`);
    }
  },

  // Get user info by user ID
  async getUserInfo(userId) {
    try {
      const doc = await withRetry(() => 
        db.collection('userInfo').doc(userId).get()
      );
      
      if (!doc.exists) {
        return null;
      }
      
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('[USER INFO MODEL] Error getting user info:', error);
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  },

  // Update user info
  async updateUserInfo(userId, updateData) {
    try {
      await withRetry(() => 
        db.collection('userInfo').doc(userId).update({
          ...updateData,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })
      );
      return userId;
    } catch (error) {
      console.error('[USER INFO MODEL] Error updating user info:', error);
      throw new Error(`Failed to update user info: ${error.message}`);
    }
  },

  // Create or update user info (upsert)
  async upsertUserInfo(userId, userInfoData) {
    try {
      console.log('[USER INFO MODEL] Upserting user info for userId:', userId);
      console.log('[USER INFO MODEL] UserInfo data:', userInfoData);
      
      const userInfoRef = db.collection('userInfo').doc(userId);
      const doc = await userInfoRef.get();
      
      if (doc.exists) {
        // Update existing record
        console.log('[USER INFO MODEL] Updating existing record');
        await withRetry(() => userInfoRef.update({
          ...userInfoData,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }));
      } else {
        // Create new record
        console.log('[USER INFO MODEL] Creating new record');
        await withRetry(() => userInfoRef.set({
          ...userInfoData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }));
      }
      
      console.log('[USER INFO MODEL] Upsert completed successfully');
      return userId;
    } catch (error) {
      console.error('[USER INFO MODEL] Error upserting user info:', error);
      throw new Error(`Failed to upsert user info: ${error.message}`);
    }
  },

  // Delete user info
  async deleteUserInfo(userId) {
    try {
      await withRetry(() => 
        db.collection('userInfo').doc(userId).delete()
      );
      return userId;
    } catch (error) {
      console.error('[USER INFO MODEL] Error deleting user info:', error);
      throw new Error(`Failed to delete user info: ${error.message}`);
    }
  }
};

module.exports = UserInfoModel;
