FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/Services/Identity.Service/API/Identity.Service.API/Identity.Service.API.csproj", "src/Services/Identity.Service/API/Identity.Service.API/"]
RUN dotnet restore "src/Services/Identity.Service/API/Identity.Service.API/Identity.Service.API.csproj"
COPY . .
WORKDIR "/src/src/Services/Identity.Service/API/Identity.Service.API"
RUN dotnet build "Identity.Service.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Identity.Service.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Identity.Service.API.dll"]
