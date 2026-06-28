using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using OrderFlow.Domain.Entities;
using OrderFlow.Domain.Repositories;

namespace OrderFlow.Application.Features.Orders;

public record GetOrdersQuery() : IRequest<List<Order>>;

public class GetOrdersQueryHandler : IRequestHandler<GetOrdersQuery, List<Order>>
{
    private readonly IOrderRepository _orderRepository;
    
    public GetOrdersQueryHandler(IOrderRepository orderRepository) => _orderRepository = orderRepository;

    public async Task<List<Order>> Handle(GetOrdersQuery request, CancellationToken cancellationToken)
    {
        return await _orderRepository.GetAllAsync(cancellationToken);
    }
}
