@echo off
:: Create the folder structure
mkdir applyboard-backend
cd applyboard-backend
mkdir src
mkdir src\config
mkdir src\controllers
mkdir src\models
mkdir src\routes
mkdir src\middlewares
mkdir src\utils

:: Create the files inside the directories
echo. > server.js
echo. > .env
echo. > package.json
echo. > src\config\db.js
echo. > src\controllers\auth.controller.js
echo. > src\models\user.model.js
echo. > src\routes\auth.routes.js
echo. > src\middlewares\validateRegister.js
echo. > src\utils\validators.js

echo Folder structure and files have been created successfully.
