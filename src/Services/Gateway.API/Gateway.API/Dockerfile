FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/Services/Gateway.API/Gateway.API/Gateway.API.csproj", "src/Services/Gateway.API/Gateway.API/"]
RUN dotnet restore "src/Services/Gateway.API/Gateway.API/Gateway.API.csproj"
COPY . .
WORKDIR "/src/src/Services/Gateway.API/Gateway.API"
RUN dotnet build "Gateway.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Gateway.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Gateway.API.dll"]
