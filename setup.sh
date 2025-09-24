#!/bin/bash

echo "�� Setting up TradeSync Project..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.11+ first."
    exit 1
fi

echo "✅ Node.js and Python found"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Setup AI service
echo "🐍 Setting up AI service..."
cd ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

echo "✅ Setup complete!"
echo "🚀 To start the project:"
echo "   npm run dev          # Start all services"
echo "   docker-compose up    # Start with Docker"
echo ""
echo "📁 Project structure:"
echo "   frontend/    - Next.js application (port 3000)"
echo "   backend/     - Node.js API (port 3001)"
echo "   ai-service/  - Python FastAPI (port 8001)"
