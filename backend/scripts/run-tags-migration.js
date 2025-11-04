/**
 * Migration Script: Add Tags Support
 * Run this to apply database schema changes for tags feature
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const runMigration = async () => {
    let connection;
    
    try {
        // Read the SQL file
        const sqlFilePath = path.join(__dirname, '../database/add_tags_support.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        console.log('📦 Connecting to database...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'wattpad',
            multipleStatements: true
        });
        
        console.log('✅ Connected to database');
        console.log('🔄 Running migration...\n');
        
        // Execute the SQL migration
        const [results] = await connection.query(sqlContent);
        
        console.log('✅ Migration completed successfully!');
        console.log('\n📊 Migration Results:');
        
        // Show results if available
        if (Array.isArray(results)) {
            results.forEach((result, index) => {
                if (result && result.length > 0) {
                    console.log(`\nResult ${index + 1}:`);
                    console.table(result);
                }
            });
        }
        
        // Verify tags table
        const [tags] = await connection.query('SELECT * FROM tags ORDER BY usage_count DESC');
        console.log('\n📋 Tags in database:');
        console.table(tags);
        
        console.log('\n✨ Database is now ready with tags support!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
};

// Run the migration
runMigration();
