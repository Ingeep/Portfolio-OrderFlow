using System;
using System.Threading;
using System.Threading.Tasks;
using OrderFlow.Domain.Entities;

namespace OrderFlow.Domain.Repositories;

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task AddAsync(Order order, CancellationToken cancellationToken);
    Task<List<Order>> GetAllAsync(CancellationToken cancellationToken);
}
