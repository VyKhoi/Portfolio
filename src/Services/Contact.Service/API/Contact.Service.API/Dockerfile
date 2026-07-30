FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/Services/Contact.Service/API/Contact.Service.API/Contact.Service.API.csproj", "src/Services/Contact.Service/API/Contact.Service.API/"]
RUN dotnet restore "src/Services/Contact.Service/API/Contact.Service.API/Contact.Service.API.csproj"
COPY . .
WORKDIR "/src/src/Services/Contact.Service/API/Contact.Service.API"
RUN dotnet build "Contact.Service.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Contact.Service.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Contact.Service.API.dll"]
