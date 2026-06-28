using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using OrderFlow.Application.Features.Products;

namespace OrderFlow.API.Endpoints;

public class ProductsEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/products");

        group.MapPost("", async (CreateProductCommand command, IMediator mediator) =>
        {
            var id = await mediator.Send(command);
            return Results.Created($"/api/products/{id}", id);
        });

        group.MapGet("", async (IMediator mediator) =>
        {
            var products = await mediator.Send(new GetProductQuery());
            return Results.Ok(products);
        });
    }
}
