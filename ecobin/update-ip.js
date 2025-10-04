#!/usr/bin/env node

/**
 * Simple script to update the IP address in .env file
 * Usage: node update-ip.js <new-ip-address>
 * Example: node update-ip.js 192.168.1.100
 */

const fs = require('fs');
const path = require('path');

function updateIPAddress(newIP) {
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found. Please create it first using .env.example as a template.');
    process.exit(1);
  }

  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update the API_BASE_URL with the new IP
    const updatedContent = envContent.replace(
      /API_BASE_URL=http:\/\/[^:]+/,
      `API_BASE_URL=http://${newIP}`
    );
    
    if (updatedContent === envContent) {
      console.log('⚠️  No changes made. The IP address might already be set to this value.');
      return;
    }
    
    fs.writeFileSync(envPath, updatedContent);
    console.log(`✅ Successfully updated API_BASE_URL to: http://${newIP}:8000`);
    console.log('🔄 Please restart your development server for changes to take effect.');
    
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    process.exit(1);
  }
}

// Get IP from command line arguments
const newIP = process.argv[2];

if (!newIP) {
  console.log('Usage: node update-ip.js <new-ip-address>');
  console.log('Example: node update-ip.js 192.168.1.100');
  process.exit(1);
}

// Basic IP validation
const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
if (!ipRegex.test(newIP)) {
  console.error('❌ Invalid IP address format. Please use format like: 192.168.1.100');
  process.exit(1);
}

updateIPAddress(newIP);
