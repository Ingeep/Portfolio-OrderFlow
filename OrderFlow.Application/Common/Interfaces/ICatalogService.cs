using System;
using System.Threading;
using System.Threading.Tasks;
using OrderFlow.Domain.Entities;

namespace OrderFlow.Application.Common.Interfaces;

public record CatalogProductDto(
    Guid Id,
    string Name,
    decimal Price
);

public interface ICatalogService
{
    Task<CatalogProductDto?> GetProductByIdAsync(Guid id, CancellationToken cancellationToken);
}