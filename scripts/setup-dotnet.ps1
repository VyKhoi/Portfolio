dotnet new sln -n Portfolio
New-Item -ItemType Directory -Force -Path "src/Services/Gateway.API"
New-Item -ItemType Directory -Force -Path "src/Services/Identity.Service/API"
New-Item -ItemType Directory -Force -Path "src/Services/Content.Service/API"
New-Item -ItemType Directory -Force -Path "src/Services/Contact.Service/API"
New-Item -ItemType Directory -Force -Path "src/Workers/Notification.Worker"

Push-Location "src/Services/Gateway.API"; dotnet new web -n Gateway.API -f net9.0; Pop-Location
Push-Location "src/Services/Identity.Service/API"; dotnet new webapi -n Identity.Service.API -f net9.0; Pop-Location
Push-Location "src/Services/Content.Service/API"; dotnet new webapi -n Content.Service.API -f net9.0; Pop-Location
Push-Location "src/Services/Contact.Service/API"; dotnet new webapi -n Contact.Service.API -f net9.0; Pop-Location
Push-Location "src/Workers/Notification.Worker"; dotnet new worker -n Notification.Worker -f net9.0; Pop-Location

dotnet sln add src/Services/Gateway.API/Gateway.API.csproj
dotnet sln add src/Services/Identity.Service/API/Identity.Service.API.csproj
dotnet sln add src/Services/Content.Service/API/Content.Service.API.csproj
dotnet sln add src/Services/Contact.Service/API/Contact.Service.API.csproj
dotnet sln add src/Workers/Notification.Worker/Notification.Worker.csproj
