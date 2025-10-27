#!/usr/bin/env node

/**
 * Test script để kiểm tra routes có hoạt động không
 * Run: node test-routes.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:4000';

// Colors for console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    console.log(`${colors.blue}Testing:${colors.reset} ${path}`);
    
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          path: path
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testRoutes() {
  console.log('\n🧪 Testing Whatpad API Routes\n');
  console.log('=' .repeat(50));
  
  const tests = [
    { path: '/health', expected: 200, description: 'Health check' },
    { path: '/stories', expected: 200, description: 'List stories' },
    { path: '/stories/1', expected: [200, 404], description: 'Get story by ID' },
    { path: '/chapters/story/1', expected: [200, 404], description: 'List chapters (old route)' },
    { path: '/stories/1/chapters', expected: [200, 404], description: 'List chapters (nested route)' },
    { path: '/stories/1/chapters/1', expected: [200, 404], description: '✨ Get chapter (nested route)' },
    { path: '/chapters/1', expected: [200, 404], description: 'Get chapter (legacy route)' },
  ];

  for (const test of tests) {
    try {
      const result = await makeRequest(test.path);
      const expectedStatuses = Array.isArray(test.expected) ? test.expected : [test.expected];
      const isSuccess = expectedStatuses.includes(result.status);
      
      if (isSuccess) {
        console.log(`${colors.green}✅ PASS${colors.reset} [${result.status}] ${test.description}`);
        
        // Parse response
        try {
          const json = JSON.parse(result.data);
          if (json.ok === false) {
            console.log(`   ${colors.yellow}⚠️  Response:${colors.reset} ${json.message || 'Error'}`);
          }
        } catch (e) {
          // Not JSON
        }
      } else {
        console.log(`${colors.red}❌ FAIL${colors.reset} [${result.status}] ${test.description}`);
        console.log(`   Expected: ${expectedStatuses.join(' or ')}, Got: ${result.status}`);
      }
    } catch (err) {
      console.log(`${colors.red}❌ ERROR${colors.reset} ${test.description}`);
      console.log(`   ${colors.red}Error:${colors.reset} ${err.message}`);
      
      if (err.code === 'ECONNREFUSED') {
        console.log(`\n${colors.red}🚫 Server is not running!${colors.reset}`);
        console.log(`   Start server with: cd backend && npm run dev\n`);
        process.exit(1);
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Testing completed!\n');
  
  // Additional checks
  console.log('📋 Checklist:');
  console.log('  □ Server is running (npm run dev)');
  console.log('  □ Database is created and migrated');
  console.log('  □ story_comments has chapter_id column');
  console.log('  □ votes table exists with chapter_id column');
  console.log('\n');
}

// Run tests
testRoutes().catch(err => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err);
  process.exit(1);
});

