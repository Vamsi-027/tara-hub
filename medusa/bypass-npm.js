#!/usr/bin/env node

/**
 * Direct Medusa Runner - Bypasses npm issues
 * Runs Medusa directly with Node.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Medusa directly...');

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/medusa_db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
process.env.COOKIE_SECRET = process.env.COOKIE_SECRET || 'supersecret';
process.env.MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

// Check if .medusa directory exists
const medusaServerPath = path.join(__dirname, '.medusa', 'server', 'index.js');
const medusaDevPath = path.join(__dirname, 'node_modules', '@medusajs', 'medusa', 'dist', 'commands', 'develop.js');

if (fs.existsSync(medusaServerPath)) {
    console.log('✅ Found built server, starting...');
    require(medusaServerPath);
} else if (fs.existsSync(medusaDevPath)) {
    console.log('✅ Starting in development mode...');
    const medusa = spawn('node', [medusaDevPath], {
        stdio: 'inherit',
        env: process.env
    });

    medusa.on('error', (err) => {
        console.error('❌ Failed to start:', err);
    });
} else {
    console.log('⚠️  No Medusa build found. Trying direct start...');

    try {
        // Try to load Medusa directly
        const { loadEnv, startProjectInMode } = require('@medusajs/framework/utils');

        loadEnv(process.env.NODE_ENV, process.cwd());

        startProjectInMode({
            directory: process.cwd(),
            mode: 'development'
        });
    } catch (err) {
        console.error('❌ Cannot start Medusa:', err.message);
        console.log('\n📦 Please run one of these first:');
        console.log('   docker-compose up');
        console.log('   OR');
        console.log('   npm install --legacy-peer-deps');
    }
}