Set-Location src\Services\Identity.Service
dotnet new xunit -n Identity.Service.API.Tests
dotnet add Identity.Service.API.Tests/Identity.Service.API.Tests.csproj reference API/Identity.Service.API/Identity.Service.API.csproj
Set-Location ..\..\..
dotnet sln add src\Services\Identity.Service\Identity.Service.API.Tests\Identity.Service.API.Tests.csproj
