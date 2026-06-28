using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using OrderFlow.Application.Features.Orders;

namespace OrderFlow.API.Endpoints;

public class OrderEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/orders").RequireAuthorization();

        group.MapPost("", async (CreateOrderCommand command, IMediator mediator) =>
        {
            var orderId = await mediator.Send(command);
            return Results.Created($"/api/orders/{orderId}", orderId);
        });

        group.MapGet("", async (IMediator mediator) =>
        {
            var orders = await mediator.Send(new GetOrdersQuery());
            return Results.Ok(orders);
        });
    }
}
