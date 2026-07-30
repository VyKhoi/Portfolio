FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/Services/Content.Service/API/Content.Service.API/Content.Service.API.csproj", "src/Services/Content.Service/API/Content.Service.API/"]
RUN dotnet restore "src/Services/Content.Service/API/Content.Service.API/Content.Service.API.csproj"
COPY . .
WORKDIR "/src/src/Services/Content.Service/API/Content.Service.API"
RUN dotnet build "Content.Service.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Content.Service.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Content.Service.API.dll"]
