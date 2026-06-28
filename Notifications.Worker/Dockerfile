# 1. ETAPA DE COMPILACIÓN
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["Notifications.Worker/Notifications.Worker.csproj", "Notifications.Worker/"]
COPY ["OrderFlow.Application/OrderFlow.Application.csproj", "OrderFlow.Application/"]
COPY ["OrderFlow.Domain/OrderFlow.Domain.csproj", "OrderFlow.Domain/"]
COPY ["OrderFlow.Infrastructure/OrderFlow.Infrastructure.csproj", "OrderFlow.Infrastructure/"]

RUN dotnet restore "Notifications.Worker/Notifications.Worker.csproj"

COPY . .
WORKDIR "/src/Notifications.Worker"
RUN dotnet publish "Notifications.Worker.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. ETAPA DE EJECUCIÓN (Runtime de consola genérico de .NET 9)
FROM mcr.microsoft.com/dotnet/runtime:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Notifications.Worker.dll"]
