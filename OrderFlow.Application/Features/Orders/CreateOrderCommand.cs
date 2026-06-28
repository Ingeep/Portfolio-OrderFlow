using MediatR;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using OrderFlow.Domain.Entities;
using OrderFlow.Domain.Repositories;
using OrderFlow.Application.Common.Interfaces;
using OrderFlow.Application.Common.Events;


namespace OrderFlow.Application.Features.Orders;

// DTO para recibir los ítems desde el cliente
public record OrderItemDto(Guid ProductId, int Quantity);

public record CreateOrderCommand(string CustomerEmail, List<OrderItemDto> Items) : IRequest<Guid>;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICatalogService _catalogService;
    private readonly IEventBus _eventBus;
    

    public CreateOrderCommandHandler(IOrderRepository orderRepository, ICatalogService catalogService, IEventBus eventBus)
    {
        _orderRepository = orderRepository;
        _catalogService = catalogService;
        _eventBus = eventBus;
    }

    public async Task<Guid> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        // 1. Validar que vengan productos
        if (request.Items == null || request.Items.Count == 0)
            throw new ArgumentException("El pedido debe contener al menos un producto.");

        // 2. Crear la raíz del agregado Order
        var order = new Order(request.CustomerEmail);

        // 3. Resolver los precios y nombres reales de cada producto e insertarlos al agregado
        foreach (var itemDto in request.Items)
        {
            var product = await _catalogService.GetProductByIdAsync(itemDto.ProductId, cancellationToken);
            if (product == null)
                throw new KeyNotFoundException($"El producto con ID {itemDto.ProductId} no existe.");

            // Llamamos al método rico del dominio (DDD) que valida las reglas de negocio
            order.AddOrderItem(itemDto.ProductId, product.Name, product.Price, itemDto.Quantity);
        }

        // 4. Persistir el pedido completo en la base de datos
        await _orderRepository.AddAsync(order, cancellationToken);

        var @event = new OrderPlacedEvent(order.Id, order.CustomerEmail, order.TotalAmount);
        await _eventBus.PublishAsync(@event, cancellationToken);

        return order.Id;
    }
}
