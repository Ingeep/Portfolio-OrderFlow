using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using OrderFlow.Application.Common.Interfaces;


namespace OrderFlow.Infrastructure.Services;

public class CatalogService : ICatalogService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<CatalogService> _logger;

    public CatalogService(HttpClient httpClient, ILogger<CatalogService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<CatalogProductDto?> GetProductByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Fetching product {ProductId} from Catalog API", id);
            
            var response = await _httpClient.GetAsync($"/api/catalog/{id}", cancellationToken);

            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                _logger.LogWarning("Product {ProductId} not found in Catalog API", id);
                return null;
            }

            response.EnsureSuccessStatusCode();

            var productDto = await response.Content.ReadFromJsonAsync<CatalogProductDto>(cancellationToken);
            return productDto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching product {ProductId} from Catalog API", id);
            return null;
        }
    }
}