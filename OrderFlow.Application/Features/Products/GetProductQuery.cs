using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using OrderFlow.Domain.Entities;
using OrderFlow.Domain.Repositories;

namespace OrderFlow.Application.Features.Products;

public record GetProductQuery() : IRequest<List<Product>>;

public class GetProductQueryHandler : IRequestHandler<GetProductQuery, List<Product>>
{
    private readonly IProductRepository _productRepository;

    public GetProductQueryHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<List<Product>> Handle(GetProductQuery request, CancellationToken cancellationToken)
    {
        return await _productRepository.GetAllAsync(cancellationToken);
    }
}
