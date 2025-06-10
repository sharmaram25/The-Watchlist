@echo off
echo 🎬 Setting up The WatchList App...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install root dependencies
echo 📦 Installing root dependencies...
call npm install

REM Install server dependencies
echo 📦 Installing server dependencies...
cd server
call npm install
cd ..

REM Install client dependencies
echo 📦 Installing client dependencies...
cd client
call npm install
cd ..

REM Create .env file if it doesn't exist
if not exist "server\.env" (
    echo 📝 Creating server\.env file...
    copy "server\.env.example" "server\.env"
    echo ⚠️  Please add your TMDB API key to server\.env
)

echo ✅ Setup complete!
echo.
echo 🚀 To start the application:
echo    npm run dev
echo.
echo 📋 Don't forget to:
echo    1. Get your TMDB API key from: https://www.themoviedb.org/settings/api
echo    2. Add it to server\.env file
echo.
echo 🎉 Happy watching!
