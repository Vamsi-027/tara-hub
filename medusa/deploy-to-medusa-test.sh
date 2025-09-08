#!/bin/bash

# Deploy to medusa-test service
echo "🚀 Deploying to medusa-test service..."

# Set the service name (you'll need to run this interactively)
echo "Please run the following commands in your terminal:"
echo ""
echo "1. Link to medusa-test service:"
echo "   railway service"
echo "   (Select 'medusa-test' from the list)"
echo ""
echo "2. Deploy the code:"
echo "   railway up"
echo ""
echo "3. Check deployment status:"
echo "   railway status"
echo ""
echo "4. View logs:"
echo "   railway logs"
echo ""

# Alternative: Deploy with explicit service specification if Railway supports it
echo "Or try deploying directly with service specification:"
echo "railway up --service medusa-test"