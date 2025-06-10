#!/bin/bash

echo "🎬 Setting up The WatchList App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

# Create .env file if it doesn't exist
if [ ! -f "server/.env" ]; then
    echo "📝 Creating server/.env file..."
    cp server/.env.example server/.env
    echo "⚠️  Please add your TMDB API key to server/.env"
fi

echo "✅ Setup complete!"
echo ""
echo "🚀 To start the application:"
echo "   npm run dev"
echo ""
echo "📋 Don't forget to:"
echo "   1. Get your TMDB API key from: https://www.themoviedb.org/settings/api"
echo "   2. Add it to server/.env file"
echo ""
echo "🎉 Happy watching!"
