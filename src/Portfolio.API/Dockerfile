FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/Portfolio.API/Portfolio.API.csproj", "src/Portfolio.API/"]
RUN dotnet restore "src/Portfolio.API/Portfolio.API.csproj"
COPY . .
WORKDIR "/src/src/Portfolio.API"
RUN dotnet publish "Portfolio.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "Portfolio.API.dll"]
