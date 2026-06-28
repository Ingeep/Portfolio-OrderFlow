using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OrderFlow.Application.Common.Interfaces;
using OrderFlow.Domain.Repositories;
using OrderFlow.Infrastructure.Data;
using OrderFlow.Infrastructure.Repositories;
using OrderFlow.Infrastructure.Services;

namespace OrderFlow.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddHttpClient<ICatalogService, CatalogService>(client =>
        {
            client.BaseAddress = new Uri(configuration["ExternalServices:CatalogUrl"] ?? "http://localhost:5299");
        })
        .AddStandardResilienceHandler();

        services.AddScoped<IEventBus, AzureEventBus>();

        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

        return services;
    }
}
