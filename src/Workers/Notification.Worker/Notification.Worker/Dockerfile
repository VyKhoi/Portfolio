FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/Workers/Notification.Worker/Notification.Worker/Notification.Worker.csproj", "src/Workers/Notification.Worker/Notification.Worker/"]
RUN dotnet restore "src/Workers/Notification.Worker/Notification.Worker/Notification.Worker.csproj"
COPY . .
WORKDIR "/src/src/Workers/Notification.Worker/Notification.Worker"
RUN dotnet build "Notification.Worker.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Notification.Worker.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Notification.Worker.dll"]
