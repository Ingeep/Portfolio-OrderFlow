using Microsoft.EntityFrameworkCore;
using OrderFlow.Domain.Entities;

namespace OrderFlow.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configuraciones de DDD: Mapeo de la colección privada de Order
        modelBuilder.Entity<Order>(cfg =>
        {
            cfg.HasKey(o => o.Id);
            
            // Le dice a EF que mapee el backing field privado `_items` a la relación de Items
            cfg.Metadata.FindNavigation(nameof(Order.Items))!
               .SetPropertyAccessMode(PropertyAccessMode.Field);
               
            cfg.HasMany(o => o.Items)
               .WithOne(oi => oi.Order) // Especificamos la propiedad inversa para evitar relaciones duplicadas
               .HasForeignKey("OrderId") 
               .OnDelete(DeleteBehavior.Cascade); // SQL Server ahora permitirá la cascada al no haber ciclos
        });

        modelBuilder.Entity<OrderItem>(cfg =>
        {
            cfg.HasKey(oi => oi.Id);
        });
    }
}
