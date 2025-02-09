#!/bin/bash
rm -rf node_modules
npm install
npx expo prebuild

arch -arm64 bash << 'EOF'
cd ios
rm -rf Pods
rm -f Podfile.lock
bundle install
pod install
EOF