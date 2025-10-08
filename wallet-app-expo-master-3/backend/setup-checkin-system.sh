#!/bin/bash

echo "🚀 Setting up Check-In/Check-Out System..."
echo ""

# Run the task assignment migration
echo "📦 Running database migration..."
node src/migrations/add-task-assignments.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Restart your backend server: npm run dev"
    echo "2. Restart your mobile app: npx expo start"
    echo "3. Test check-in flow on a PC account"
    echo ""
    echo "📖 See CHECK_IN_SYSTEM.md for full documentation"
else
    echo ""
    echo "❌ Migration failed!"
    echo ""
    echo "💡 Troubleshooting:"
    echo "1. Ensure your .env file has correct DATABASE_URL"
    echo "2. Check if database is accessible"
    echo "3. Verify network connectivity"
    echo ""
    echo "You can manually run: node src/migrations/add-task-assignments.js"
fi
