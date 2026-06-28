using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using OrderFlow.Application.Features.Auth;

namespace OrderFlow.API.Endpoints;

public class AuthEndpoint : ICarterModule
{
   public void AddRoutes(IEndpointRouteBuilder app)
   {
      app.MapPost("/auth/login", async (LoginRequest request, IMediator mediator) =>
      {
         var result = await mediator.Send(request);
         return Results.Ok(new { Token = result });
      });
   }
}