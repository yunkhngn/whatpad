#!/bin/bash
echo "🧪 Testing Backend Setup..."
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "✅ .env file exists"
else
    echo "❌ .env file missing"
fi

# Check if node_modules exists
if [ -d node_modules ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Dependencies not installed"
fi

# Check src structure
echo ""
echo "📁 Project Structure:"
echo "└── src/"
for dir in mw utils modules docs; do
    if [ -d "src/$dir" ]; then
        echo "    ├── $dir/ ✅"
    else
        echo "    ├── $dir/ ❌"
    fi
done

# Check key files
echo ""
echo "📄 Key Files:"
files=("src/app.js" "src/db.js" "README.md" "package.json")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "    ✅ $file"
    else
        echo "    ❌ $file"
    fi
done

# Check modules
echo ""
echo "🔌 Modules:"
modules=("auth" "users" "stories" "chapters" "comments" "votes" "follows" "tags" "favorites" "reading" "reviews" "upload")
for module in "${modules[@]}"; do
    if [ -f "src/modules/$module/routes.js" ]; then
        echo "    ✅ $module"
    else
        echo "    ❌ $module"
    fi
done

echo ""
echo "🎯 Next Steps:"
echo "1. Configure .env with your MSSQL and Cloudinary credentials"
echo "2. Run database/createdb.sql in your MSSQL server"
echo "3. Start the server: npm run dev"
echo "4. Visit http://localhost:4000/docs for API documentation"
echo "5. Test /health endpoint: curl http://localhost:4000/health"
