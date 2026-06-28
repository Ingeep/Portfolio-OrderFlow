using Carter;
using Catalog.Api.Entities;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using MongoDB.Driver;

namespace Catalog.Api.Endpoints;

public class ProductEndpoints : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/catalog");

        // GET: Obtener todos los productos
        group.MapGet("", async (IMongoClient mongoClient, IConfiguration config) =>
        {
            var db = mongoClient.GetDatabase(config["MongoDbSettings:DatabaseName"]);
            var collection = db.GetCollection<Product>(config["MongoDbSettings:CollectionName"]);

            var products = await collection.Find(_ => true).ToListAsync();
            return Results.Ok(products);
        });

        // POST: Crear un nuevo producto con atributos dinámicos
        group.MapPost("", async (Product product, IMongoClient mongoClient, IConfiguration config) =>
        {
            var db = mongoClient.GetDatabase(config["MongoDbSettings:DatabaseName"]);
            var collection = db.GetCollection<Product>(config["MongoDbSettings:CollectionName"]);

            await collection.InsertOneAsync(product);
            return Results.Created($"/api/catalog/{product.Id}", product);
        });
    }
}
