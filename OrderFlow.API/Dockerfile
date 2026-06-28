# 1. ETAPA DE COMPILACION (SDK de .NET 9)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copiar archivos de proyecto (.csproj) para restaurar dependencias de forma eficiente (Caching)
COPY ["OrderFlow.API/OrderFlow.API.csproj", "OrderFlow.API/"]
COPY ["OrderFlow.Application/OrderFlow.Application.csproj", "OrderFlow.Application/"]
COPY ["OrderFlow.Domain/OrderFlow.Domain.csproj", "OrderFlow.Domain/"]
COPY ["OrderFlow.Infrastructure/OrderFlow.Infrastructure.csproj", "OrderFlow.Infrastructure/"]

RUN dotnet restore "OrderFlow.API/OrderFlow.API.csproj"

# Copiar el resto del código y compilar la app
COPY . .
WORKDIR "/src/OrderFlow.API"
RUN dotnet publish "OrderFlow.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. ETAPA DE EJECUCIÓN (Runtime ligero de ASP.NET 9)
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
EXPOSE 8081
ENTRYPOINT ["dotnet", "OrderFlow.API.dll"]